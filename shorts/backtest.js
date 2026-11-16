// Backtest one intraday setup on NIFTY 5-min data that is >30 days old (SEBI 30-day lag for education).
// usage: node shorts/backtest.js <setupIndex 1..N> <out.json>
const fs = require('fs'), path = require('path');
const SETUPS = require('./setups.json');
const IST = 5.5 * 3600e3, DAY = 864e5;
const LAG_DAYS = 35, SPAN_DAYS = 120, COST_PTS = 2;   // data window: 155..35 days ago; 2 pts cost per trade (brokerage+slippage)

const ymd = ms => new Date(ms + IST).toISOString().slice(0, 10);
async function upstox(from, to) {
  const key = encodeURIComponent('NSE_INDEX|Nifty 50');
  const out = [];
  for (let a = from; a < to; a += 28 * DAY) {
    const b = Math.min(to, a + 27 * DAY);
    const u = `https://api.upstox.com/v3/historical-candle/${key}/minutes/5/${ymd(b)}/${ymd(a)}`;
    const r = await fetch(u, { headers: { Accept: 'application/json', ...(process.env.UPSTOX_TOKEN ? { Authorization: 'Bearer ' + process.env.UPSTOX_TOKEN } : {}) } });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.data) throw new Error('upstox ' + r.status + ' ' + JSON.stringify(j).slice(0, 200));
    for (const c of j.data.candles) out.push({ t: Date.parse(c[0]), o: +c[1], h: +c[2], l: +c[3], c: +c[4] });
  }
  return out;
}
async function yahoo(from, to) {
  const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/%5ENSEI?interval=5m&period1=${Math.floor(from / 1000)}&period2=${Math.floor(to / 1000)}`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const j = await r.json(); const R = j.chart.result[0], q = R.indicators.quote[0];
  return R.timestamp.map((s, i) => ({ t: s * 1000, o: q.open[i], h: q.high[i], l: q.low[i], c: q.close[i] })).filter(x => x.o != null);
}
function byDay(cs) {
  const m = {}; cs.sort((a, b) => a.t - b.t);
  const seen = new Set();
  for (const c of cs) { if (seen.has(c.t)) continue; seen.add(c.t); const d = ymd(c.t); const hm = new Date(c.t + IST).toISOString().slice(11, 16); if (hm < '09:15' || hm > '15:25') continue; c.hm = hm; (m[d] = m[d] || []).push(c); }
  return Object.entries(m).filter(([, v]) => v.length >= 60).map(([d, v]) => ({ d, c: v }));
}

// ---- setups: each returns null or {dir, entryIdx, entry, sl, tgt, lines:[{y,label,col}], zone:{i0,i1,hi,lo}}
const SIG = {
  orb(day, p) {   // opening range breakout
    const n = p.minutes / 5, cs = day.c, R = cs.slice(0, n), hi = Math.max(...R.map(x => x.h)), lo = Math.min(...R.map(x => x.l)), rng = hi - lo;
    if (rng < 8) return null;
    for (let i = n; i < cs.length && cs[i].hm <= p.last; i++) {
      const c = cs[i], mid = (hi + lo) / 2;
      if (c.c > hi) { const risk = c.c - mid; return { dir: 1, i, entry: c.c, sl: mid, tgt: c.c + p.rr * risk, zone: { i0: 0, i1: n - 1, hi, lo } }; }
      if (c.c < lo) { const risk = mid - c.c; return { dir: -1, i, entry: c.c, sl: mid, tgt: c.c - p.rr * risk, zone: { i0: 0, i1: n - 1, hi, lo } }; }
    }
    return null;
  },
};
function simulate(day, s) {
  const cs = day.c;
  for (let k = s.i + 1; k < cs.length; k++) {
    const c = cs[k];
    const hitSL = s.dir > 0 ? c.l <= s.sl : c.h >= s.sl, hitT = s.dir > 0 ? c.h >= s.tgt : c.l <= s.tgt;
    if (hitSL) return { res: 'SL', exitIdx: k, exit: s.sl };
    if (hitT) return { res: 'TGT', exitIdx: k, exit: s.tgt };
    if (c.hm >= '15:15') return { res: 'TIME', exitIdx: k, exit: c.c };
  }
  const L = cs.length - 1; return { res: 'TIME', exitIdx: L, exit: cs[L].c };
}

(async () => {
  const idx = Math.max(1, Number(process.argv[2]) || 1), outF = process.argv[3] || 'bt.json';
  const S = SETUPS[(idx - 1) % SETUPS.length];
  const to = Date.now() - LAG_DAYS * DAY, from = to - SPAN_DAYS * DAY;
  let cs, src;
  try { cs = await upstox(from, to); src = 'upstox'; } catch (e) { console.error('upstox failed:', e.message); cs = await yahoo(Math.max(from, Date.now() - 59 * DAY), to); src = 'yahoo'; }
  const days = byDay(cs);
  const trades = [];
  for (const day of days) {
    const s = SIG[S.type](day, S.p); if (!s) continue;
    const r = simulate(day, s);
    const pts = (r.exit - s.entry) * s.dir - COST_PTS;
    trades.push({ d: day.d, dir: s.dir, entry: +s.entry.toFixed(1), sl: +s.sl.toFixed(1), tgt: +s.tgt.toFixed(1), exit: +r.exit.toFixed(1), res: r.res, pts: +pts.toFixed(1), _day: day, _s: s, _r: r });
  }
  const W = trades.filter(t => t.pts > 0), Ls = trades.filter(t => t.pts <= 0);
  let streak = 0, maxL = 0; for (const t of trades) { streak = t.pts <= 0 ? streak + 1 : 0; maxL = Math.max(maxL, streak); }
  const sum = a => a.reduce((x, t) => x + t.pts, 0);
  const pick = (arr, f) => arr.slice().sort(f)[0];
  const exWin = pick(W, (a, b) => b.pts - a.pts), exLoss = pick(Ls.filter(t => t.res === 'SL'), (a, b) => Math.abs(a._r.exitIdx - a._s.i - 6) - Math.abs(b._r.exitIdx - b._s.i - 6)) || Ls[0];
  const ex = t => { if (!t) return null; const cs = t._day.c, e = Math.min(cs.length - 1, Math.max(t._r.exitIdx + 4, t._s.i + 10)); const s0 = 0, win = cs.slice(s0, e + 1).map(c => [c.o, c.h, c.l, c.c].map(v => +v.toFixed(1))); return { d: t.d, dir: t.dir, entry: t.entry, sl: t.sl, tgt: t.tgt, exit: t.exit, res: t.res, pts: t.pts, entryI: t._s.i - s0, exitI: t._r.exitIdx - s0, zone: t._s.zone, candles: win, times: [cs[s0].hm, cs[e].hm] }; };
  const out = {
    setup: S, src, from: days[0]?.d, to: days[days.length - 1]?.d, tradingDays: days.length, costPts: COST_PTS,
    n: trades.length, wins: W.length, losses: Ls.length, winPct: trades.length ? Math.round(W.length * 100 / trades.length) : 0,
    tgtHits: trades.filter(t => t.res === 'TGT').length, slHits: trades.filter(t => t.res === 'SL').length, timeExits: trades.filter(t => t.res === 'TIME').length,
    avgWin: W.length ? +(sum(W) / W.length).toFixed(1) : 0, avgLoss: Ls.length ? +(sum(Ls) / Ls.length).toFixed(1) : 0, net: +sum(trades).toFixed(0), maxLossStreak: maxL,
    longs: trades.filter(t => t.dir > 0).length, shorts: trades.filter(t => t.dir < 0).length,
    exWin: ex(exWin), exLoss: ex(exLoss),
    trades: trades.map(({ _day, _s, _r, ...t }) => t),
  };
  fs.writeFileSync(outF, JSON.stringify(out, null, 1));
  console.log(JSON.stringify({ ...out, trades: undefined, exWin: out.exWin && { ...out.exWin, candles: out.exWin.candles.length }, exLoss: out.exLoss && { ...out.exLoss, candles: out.exLoss.candles.length } }, null, 1));
})().catch(e => { console.error(e); process.exit(1); });
