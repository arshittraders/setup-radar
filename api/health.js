const { guard, up, send, IDX, futKey, byToken, futCache } = require('./_u');
module.exports = guard(async (req, res) => {
  const out = { ok: false, token: !!process.env.UPSTOX_TOKEN, steps: {} };
  try {
    const key = IDX.nifty.key;
    const q = await up('/v2/market-quote/quotes', { instrument_key: key });
    const v = byToken(q)[key] || Object.values(q.data || {})[0];
    out.steps.quote = v ? 'ok · Nifty ' + v.last_price : 'khali jawab';
    try { const fk = await futKey('nifty'); out.steps.futures = 'ok · ' + fk + (futCache.nifty ? ' (' + futCache.nifty.sym + ')' : ''); }
    catch (e) { out.steps.futures = 'fail · ' + e.message; }
    out.ok = !!v;
  } catch (e) { out.error = String(e.message || e); }
  send(res, out.ok ? 200 : 503, out);
});
