// One call returns spot + futures quote (volume, OI, order-book pressure) for all three indices.
const { guard, up, IDX, futKey, byToken, send, fail } = require('./_u');
module.exports = guard(async (req, res) => {
  try {
    const ks = Object.keys(IDX), fk = {};
    await Promise.all(ks.map(async k => { try { fk[k] = await futKey(k); } catch (e) { fk[k] = null; } }));
    const keys = [];
    ks.forEach(k => { keys.push(IDX[k].key); if (fk[k]) keys.push(fk[k]); });
    const t = byToken(await up('/v2/market-quote/quotes', { instrument_key: keys.join(',') }));
    const out = { ok: true, t: Date.now(), ix: {} };
    ks.forEach(k => {
      const s = t[IDX[k].key], f = fk[k] && t[fk[k]];
      if (!s) return;
      out.ix[k] = {
        spot: s.last_price, open: s.ohlc && s.ohlc.open, high: s.ohlc && s.ohlc.high, low: s.ohlc && s.ohlc.low, prev: s.ohlc && s.ohlc.close,
        fut: f ? { key: fk[k], ltp: f.last_price, vol: f.volume, avg: f.average_price, oi: f.oi, tbq: f.total_buy_quantity, tsq: f.total_sell_quantity } : null
      };
    });
    send(res, 200, out, 's-maxage=1, stale-while-revalidate=3');
  } catch (e) { fail(res, e); }
});
