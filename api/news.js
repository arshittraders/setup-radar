// Real market news (last 7 days) for the indices and heavyweight stocks, via Upstox News API.
const { guard, up, IDX, send, fail } = require('./_u');
const STOCKS = {
  'NSE_EQ|INE002A01018': 'Reliance', 'NSE_EQ|INE040A01034': 'HDFC Bank', 'NSE_EQ|INE090A01021': 'ICICI Bank',
  'NSE_EQ|INE009A01021': 'Infosys', 'NSE_EQ|INE467B01029': 'TCS', 'NSE_EQ|INE062A01020': 'SBI',
  'NSE_EQ|INE154A01025': 'ITC', 'NSE_EQ|INE018A01030': 'L&T', 'NSE_EQ|INE397D01024': 'Airtel',
  'NSE_EQ|INE237A01028': 'Kotak Bank', 'NSE_EQ|INE238A01034': 'Axis Bank'
};
module.exports = guard(async (req, res) => {
  try {
    const names = { [IDX.nifty.key]: 'Nifty', [IDX.banknifty.key]: 'Bank Nifty', [IDX.sensex.key]: 'Sensex' };
    Object.assign(names, STOCKS);
    const j = await up('/v2/news', { category: 'instrument_keys', instrument_keys: Object.keys(names).join(','), page_size: 50 });
    const seen = new Set(), items = [];
    Object.entries(j.data || {}).forEach(([k, arr]) => (arr || []).forEach(n => {
      const h = String(n.heading || '').trim();
      if (!h || seen.has(h)) return;
      seen.add(h);
      items.push({ sym: names[k] || '', heading: h, summary: String(n.summary || '').slice(0, 400), link: n.article_link, t: Number(n.published_time) || 0 });
    }));
    items.sort((a, b) => b.t - a.t);
    send(res, 200, { ok: true, items: items.slice(0, 20) }, 's-maxage=120, stale-while-revalidate=300');
  } catch (e) { fail(res, e); }
});
