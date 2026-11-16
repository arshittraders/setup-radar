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
  pdhl(day, p, prev) {
    if (!prev) return null; const cs = day.c, H = Math.max(...prev.c.map(x => x.h)), L = Math.min(...prev.c.map(x => x.l));
    if (cs[0].o > H || cs[0].o < L) return null;   // gap beyond level: skip
    for (let i = 1; i < cs.length && cs[i].hm <= p.last; i++) { const c = cs[i]; if (c.hm < p.first) continue;
      if (c.c > H) return { dir: 1, i, entry: c.c, sl: c.c - p.sl, tgt: c.c + p.sl * p.rr, levels: [{ y: H, label: 'PDH' }, { y: L, label: 'PDL' }] };
      if (c.c < L) return { dir: -1, i, entry: c.c, sl: c.c + p.sl, tgt: c.c - p.sl * p.rr, levels: [{ y: H, label: 'PDH' }, { y: L, label: 'PDL' }] }; }
    return null;
  },
  gapfill(day, p, prev) {
    if (!prev) return null; const cs = day.c, pc = prev.c[prev.c.length - 1].c, gap = (cs[0].o - pc) / pc * 100;
    if (Math.abs(gap) < p.gap) return null; const c1 = cs[1], dir = gap > 0 ? -1 : 1;
    if ((c1.c - c1.o) * dir <= 0) return null;
    const hi = Math.max(cs[0].h, cs[1].h), lo = Math.min(cs[0].l, cs[1].l);
    return { dir, i: 1, entry: c1.c, sl: dir < 0 ? hi + 3 : lo - 3, tgt: pc, levels: [{ y: pc, label: 'Kal ka close' }] };
  },
  ema(day, p) {
    const cs = day.c, k1 = 2 / (p.f + 1), k2 = 2 / (p.s + 1); let a = cs[0].c, b = cs[0].c, pa = a, pb = b;
    for (let i = 1; i < cs.length; i++) { pa = a; pb = b; a = cs[i].c * k1 + a * (1 - k1); b = cs[i].c * k2 + b * (1 - k2); cs[i].e1 = a; cs[i].e2 = b;
      if (cs[i].hm < p.first || cs[i].hm > p.last) continue;
      if (pa <= pb && a > b) return { dir: 1, i, entry: cs[i].c, sl: cs[i].c - p.sl, tgt: cs[i].c + p.sl * p.rr, ema: true };
      if (pa >= pb && a < b) return { dir: -1, i, entry: cs[i].c, sl: cs[i].c + p.sl, tgt: cs[i].c - p.sl * p.rr, ema: true }; }
    return null;
  },
  inside(day, p) {
    const cs = day.c;
    for (let m = 1; m < cs.length - 3; m++) { const M = cs[m]; if (M.hm < p.first || M.hm > p.last) continue; const I = cs[m + 1];
      if (!(I.h < M.h && I.l > M.l) || M.h - M.l < p.minR) continue;
      for (let i = m + 2; i < Math.min(cs.length, m + 8); i++) { const c = cs[i];
        if (c.c > M.h) { const r = c.c - M.l; return { dir: 1, i, entry: c.c, sl: M.l, tgt: c.c + r * p.rr, zone: { i0: m, i1: m + 1, hi: M.h, lo: M.l } }; }
        if (c.c < M.l) { const r = M.h - c.c; return { dir: -1, i, entry: c.c, sl: M.h, tgt: c.c - r * p.rr, zone: { i0: m, i1: m + 1, hi: M.h, lo: M.l } }; } }
      m += 1; }
    return null;
  },
  firstcandle(day, p) {
    const cs = day.c, R = cs.slice(0, 3), o = R[0].o, c = R[2].c, hi = Math.max(...R.map(x => x.h)), lo = Math.min(...R.map(x => x.l));
    if (Math.abs(c - o) < 5) return null; const dir = c > o ? 1 : -1;
    const sl = dir > 0 ? lo : hi; return { dir, i: 2, entry: c, sl, tgt: p.rr ? c + dir * Math.abs(c - sl) * p.rr : null, zone: { i0: 0, i1: 2, hi, lo } };
  },
};
function simulate(day, s) {
  const cs = day.c;
  for (let k = s.i + 1; k < cs.length; k++) {
    const c = cs[k];
    const hitSL = s.dir > 0 ? c.l <= s.sl : c.h >= s.sl, hitT = s.tgt != null && (s.dir > 0 ? c.h >= s.tgt : c.l <= s.tgt);
    if (hitSL) return { res: 'SL', exitIdx: k, exit: s.sl };
    if (hitT) return { res: 'TGT', exitIdx: k, exit: s.tgt };
    if (c.hm >= '15:15') return { res: 'TIME', exitIdx: k, exit: c.c };
  }
  const L = cs.length - 1; return { res: 'TIME', exitIdx: L, exit: cs[L].c };
}

const RRSAY = { 0.5: 'आधा', 0.75: 'तीन-चौथाई', 1: 'बराबर', 1.5: 'डेढ़ गुना', 2: 'दो गुना' };
function variants(st) {
  let out = [{}];
  for (const [k, vals] of Object.entries(st.vary || {})) out = out.flatMap(o => vals.map(v => ({ ...o, [k]: v })));
  return out.map(v => ({ ...st.p, ...v }));
}
function fill(str, p) {
  const tgt = p.sl && p.rr ? Math.round(p.sl * p.rr) : '';
  return String(str).replace(/\{rr\}/g, p.rr == null ? '—' : String(p.rr)).replace(/\{rrSay\}/g, p.rr == null ? 'कोई नहीं' : (RRSAY[p.rr] || p.rr + ' गुना'))
    .replace(/\{sl\}/g, p.sl).replace(/\{tgt\}/g, tgt).replace(/\{gap\}/g, p.gap);
}
function run(days, st, p) {
  const trades = [];
  for (let di = 0; di < days.length; di++) {
    const day = days[di], s = SIG[st.type](day, p, days[di - 1]); if (!s) continue;
    const r = simulate(day, s);
    const pts = (r.exit - s.entry) * s.dir - COST_PTS;
    trades.push({ d: day.d, dir: s.dir, entry: +s.entry.toFixed(1), sl: +s.sl.toFixed(1), tgt: s.tgt == null ? null : +s.tgt.toFixed(1), exit: +r.exit.toFixed(1), res: r.res, pts: +pts.toFixed(1), _day: day, _s: s, _r: r });
  }
  return trades;
}
function report(st, p, trades, days, src) {
  const W = trades.filter(t => t.pts > 0), Ls = trades.filter(t => t.pts <= 0);
  let streak = 0, maxL = 0; for (const t of trades) { streak = t.pts <= 0 ? streak + 1 : 0; maxL = Math.max(maxL, streak); }
  const sum = a => a.reduce((x, t) => x + t.pts, 0);
  const pick = (arr, f) => arr.slice().sort(f)[0];
  const tg = W.filter(t => t.res === 'TGT');
  const exWin = pick(tg.length ? tg : W, (a, b) => b.pts - a.pts);
  const lsl = Ls.filter(t => t.res === 'SL');
  const exLoss = pick(lsl.length ? lsl : Ls, (a, b) => Math.abs(a._r.exitIdx - a._s.i - 6) - Math.abs(b._r.exitIdx - b._s.i - 6));
  const ex = t => { if (!t) return null; const cs = t._day.c, e = Math.min(cs.length - 1, Math.max(t._r.exitIdx + 4, t._s.i + 10)); const s0 = 0, win = cs.slice(s0, e + 1).map(c => [c.o, c.h, c.l, c.c].map(v => +v.toFixed(1))); return { d: t.d, dir: t.dir, entry: t.entry, sl: t.sl, tgt: t.tgt, exit: t.exit, res: t.res, pts: t.pts, entryI: t._s.i - s0, exitI: t._r.exitIdx - s0, zone: t._s.zone || null, levels: t._s.levels || null, ema: t._s.ema ? cs.slice(s0, e + 1).map(c => [c.e1 ? +c.e1.toFixed(1) : null, c.e2 ? +c.e2.toFixed(1) : null]) : null, candles: win, times: [cs[s0].hm, cs[e].hm] }; };
  const setup = { ...st, p, rules: st.rules.map(r => fill(r, p)), rulesSay: fill(st.rulesSay, p) }; delete setup.vary;
  return {
    setup, src, from: days[0]?.d, to: days[days.length - 1]?.d, tradingDays: days.length, costPts: COST_PTS,
    n: trades.length, wins: W.length, losses: Ls.length, winPct: trades.length ? Math.round(W.length * 100 / trades.length) : 0,
    tgtHits: trades.filter(t => t.res === 'TGT').length, slHits: trades.filter(t => t.res === 'SL').length, timeExits: trades.filter(t => t.res === 'TIME').length,
    avgWin: W.length ? +(sum(W) / W.length).toFixed(1) : 0, avgLoss: Ls.length ? +(sum(Ls) / Ls.length).toFixed(1) : 0, net: +sum(trades).toFixed(0), maxLossStreak: maxL,
    exWin: ex(exWin), exLoss: ex(exLoss), trades: trades.map(({ _day, _s, _r, ...t }) => t),
  };
}
const MIN_WIN = 60, MIN_TRADES = 25;
(async () => {
  const idx = Math.max(1, Number(process.argv[2]) || 1), outF = process.argv[3] || 'bt.json';
  const to = Date.now() - LAG_DAYS * DAY, from = to - SPAN_DAYS * DAY;
  let cs, src;
  try { cs = await upstox(from, to); src = 'upstox'; } catch (e) { console.error('upstox failed:', e.message); cs = await yahoo(Math.max(from, Date.now() - 59 * DAY), to); src = 'yahoo'; }
  const days = byDay(cs);
  // only setups that pass: win% >= 60, net > 0 after costs, enough trades. Best variant = highest net.
  const pass = [];
  for (const st of SETUPS) {
    let best = null;
    for (const p of variants(st)) {
      const tr = run(days, st, p); if (tr.length < MIN_TRADES) continue;
      const w = tr.filter(t => t.pts > 0).length * 100 / tr.length, net = tr.reduce((x, t) => x + t.pts, 0);
      console.log(st.id, JSON.stringify(p), 'n=' + tr.length, 'win=' + w.toFixed(0) + '%', 'net=' + net.toFixed(0));
      if (w >= MIN_WIN && net > 0 && (!best || net > best.net)) best = { p, tr, net };
    }
    if (best) pass.push(report(st, best.p, best.tr, days, src));
  }
  console.log('PASS:', pass.map(x => x.setup.id + ' ' + x.winPct + '% net ' + x.net).join(' | ') || 'none');
  if (!pass.length) { console.error('NO_SETUP: koi setup 60% jeet + plus net pe paas nahi hua'); process.exit(3); }
  const out = pass[(idx - 1) % pass.length];
  fs.writeFileSync(outF, JSON.stringify(out, null, 1));
  console.log('CHOSEN', out.setup.id, out.winPct + '%', 'net', out.net, 'n', out.n);
})().catch(e => { console.error(e); process.exit(1); });
