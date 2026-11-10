// Today's 1-minute candles: index price + futures volume/OI/VWAP (basis-adjusted to index).
const { guard, up, IDX, futKey, send, fail } = require('./_u');
const rows = j => ((j && j.data && j.data.candles) || []).slice().reverse(); // API gives newest first
module.exports = guard(async (req, res) => {
  try {
    const ix = (req.query && req.query.ix) || 'nifty';
    if (!IDX[ix]) return send(res, 400, { ok: false, error: 'ix galat' });
    const path = k => '/v2/historical-candle/intraday/' + encodeURIComponent(k) + '/1minute';
    let fk = null; try { fk = await futKey(ix); } catch (e) {}
    const [a, b] = await Promise.all([up(path(IDX[ix].key)), fk ? up(path(fk)).catch(() => null) : null]);
    const idx = rows(a), fut = b ? rows(b) : [];
    const fm = new Map(fut.map(c => [String(c[0]).slice(0, 16), c]));
    let pv = 0, vv = 0; const out = [];
    idx.forEach(c => {
      const f = fm.get(String(c[0]).slice(0, 16));
      let v = 0, oi = 0, vw = null;
      if (f) {
        v = f[5] || 0; oi = f[6] || 0;
        const tp = (f[2] + f[3] + f[4]) / 3; pv += tp * v; vv += v;
        if (vv > 0) vw = pv / vv - (f[4] - c[4]);
      }
      out.push({ t: c[0], o: c[1], h: c[2], l: c[3], c: c[4], v, oi, vw });
    });
    send(res, 200, { ok: true, ix, candles: out }, 's-maxage=20, stale-while-revalidate=40');
  } catch (e) { fail(res, e); }
});
