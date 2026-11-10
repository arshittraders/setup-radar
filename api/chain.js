// Real option chain for the nearest expiry, trimmed to what the app needs.
const { up, IDX, send, fail, ISTDATE } = require('./_u');
const expCache = {};
async function nearestExpiry(ix) {
  const c = expCache[ix], today = ISTDATE();
  if (c && c.day === today && c.exp >= today) return c.exp;
  try {
    const j = await up('/v2/option/contract', { instrument_key: IDX[ix].key });
    const ds = [...new Set((j.data || []).map(x => String(x.expiry).slice(0, 10)))].filter(d => d >= today).sort();
    if (ds.length) { expCache[ix] = { day: today, exp: ds[0] }; return ds[0]; }
  } catch (e) {}
  return 'current_week';
}
module.exports = async (req, res) => {
  try {
    const ix = (req.query && req.query.ix) || 'nifty';
    if (!IDX[ix]) return send(res, 400, { ok: false, error: 'ix galat' });
    const expiry = (req.query && req.query.expiry) || await nearestExpiry(ix);
    const j = await up('/v2/option/chain', { instrument_key: IDX[ix].key, expiry_date: expiry });
    const d = j.data || [];
    const md = o => (o && o.market_data) || {}, gk = o => (o && o.option_greeks) || {};
    const rowsOut = d.map(r => ({
      K: r.strike_price,
      cl: md(r.call_options).ltp, pl: md(r.put_options).ltp,
      coi: md(r.call_options).oi, poi: md(r.put_options).oi,
      cprev: md(r.call_options).prev_oi, pprev: md(r.put_options).prev_oi,
      cvol: md(r.call_options).volume, pvol: md(r.put_options).volume,
      civ: gk(r.call_options).iv, piv: gk(r.put_options).iv
    })).sort((a, b) => a.K - b.K);
    send(res, 200, { ok: true, ix, expiry: (d[0] && d[0].expiry) || expiry, spot: d[0] && d[0].underlying_spot_price, pcr: d[0] && d[0].pcr, rows: rowsOut }, 's-maxage=3, stale-while-revalidate=10');
  } catch (e) { fail(res, e); }
};
