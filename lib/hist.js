// ~1 month of 15-minute index candles (for Candle Lab backtests).
// Owner-only by default (same x-live-pass guard as live data). Set HIST_PUBLIC=1 to let every user see it
// (check your market-data provider's redistribution terms first). Without data the app uses a labelled demo series.
const { guard, up, IDX, send, fail, ISTDATE } = require('../api/_u');
const handler = async (req, res) => {
  try {
    const ix = new URL(req.url, 'http://x').searchParams.get('ix') || 'nifty';
    if (!IDX[ix]) return send(res, 400, { ok: false, error: 'ix galat' });
    const to = ISTDATE(), from = new Date(Date.parse(to) - 31 * 864e5).toISOString().slice(0, 10);
    const j = await up('/v3/historical-candle/' + encodeURIComponent(IDX[ix].key) + '/minutes/15/' + to + '/' + from);
    const rows = ((j && j.data && j.data.candles) || []).slice().reverse();
    const candles = rows.map(c => ({ t: c[0], o: c[1], h: c[2], l: c[3], c: c[4] }));
    send(res, 200, { ok: true, ix, tf: 15, from, to, candles }, process.env.HIST_PUBLIC === '1' ? 's-maxage=21600, stale-while-revalidate=43200' : 'no-store');
  } catch (e) { fail(res, e); }
};
module.exports = process.env.HIST_PUBLIC === '1' ? handler : guard(handler);
