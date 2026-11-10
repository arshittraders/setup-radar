// Is the market open right now? Uses IST clock + Upstox holidays (+ raw exchange status for reference).
const { up, send, ISTDATE } = require('./_u');
module.exports = async (req, res) => {
  const ist = new Date(Date.now() + 5.5 * 3600e3), day = ist.getUTCDay(), mins = ist.getUTCHours() * 60 + ist.getUTCMinutes();
  const out = { ok: true, date: ISTDATE(), weekend: day === 0 || day === 6, session: mins >= 555 && mins < 930, holiday: null, status: null };
  try {
    const h = await up('/v2/market/holidays/' + out.date);
    const d = (h.data && (Array.isArray(h.data) ? h.data[0] : h.data)) || null;
    if (d && Array.isArray(d.closed_exchanges) && d.closed_exchanges.some(x => /NSE|NFO/i.test(String(x)))) out.holiday = d.description || 'Holiday';
  } catch (e) {}
  try { const s = await up('/v2/market/status/NSE'); out.status = s.data || null; } catch (e) {}
  out.open = !out.weekend && !out.holiday && out.session;
  send(res, 200, out, 's-maxage=30, stale-while-revalidate=60');
};
