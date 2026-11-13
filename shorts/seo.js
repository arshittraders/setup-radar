// Captions, titles and hashtags tuned for organic reach.
// Instagram allows max 5 hashtags per post (since Dec 2025) → 5 targeted tags; keywords go in the first caption line (IG search reads captions).
// YouTube: keyword-first title + #shorts, 3 hashtags shown above the title.
const tagify = s => '#' + String(s || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]/g, '');
const IG_HANDLE = process.env.IG_HANDLE || '@setupradarkiwtech';

const NEWS_TAG = { GOLD: '#goldprice', CRUDE: '#crudeoil', NIFTY: '#nifty50', SENSEX: '#sensex', RUPEE: '#rupee', GLOBAL: '#globalmarkets', ECONOMY: '#indianeconomy', RBI: '#rbi' };

function build(S) {
  const kind = S.kind, d = Number(S.day) || 0, topic = String(S.topic || '').trim();
  const pts = (S.scenes || []).slice(1, 4).map(s => '✅ ' + String(s.show || '').trim()).filter(x => x.length > 3);
  let seo, ask, tagsIg, tagsYt, ytTitle;
  if (kind === 'lesson') {
    seo = `${topic} | F&O Course Hindi 📈 Lesson ${d}/90`;
    ask = 'Samajh aaya? Comment mein ✅ likho, next lesson aur aasaan banayenge 👇';
    tagsIg = ['#optionstrading', '#stockmarketindia', '#tradingforbeginners', '#sharemarket', '#setupradar'];
    tagsYt = ['#shorts', '#optionstrading', '#stockmarket'];
    ytTitle = `${topic} | Lesson ${d}/90 | F&O Trading Hindi`;
  } else if (kind === 'candle') {
    seo = `${topic} Candlestick Pattern kya hai? 🕯️ Candle ${d}/90 (Hindi)`;
    ask = `Chart par ${topic} dekha hai kabhi? Comment karo 👇`;
    const t = tagify(topic.split(/\s+/).length > 2 ? topic.split(/\s+/).slice(0, 2).join('') : topic);
    tagsIg = ['#candlestickpatterns', '#priceaction', '#stockmarketindia', t.length > 3 ? t : '#technicalanalysis', '#setupradar'];
    tagsYt = ['#shorts', '#candlestickpatterns', '#priceaction'];
    ytTitle = `${topic} Candlestick Pattern | Candle ${d}/90 | Hindi`;
  } else {
    const date = String(S.badge || '').split('·').pop().trim();
    const tg = [...new Set((S.scenes || []).map(s => NEWS_TAG[String(s.tag || '').toUpperCase()]).filter(Boolean))];
    seo = `Aaj ki Share Market News 📰 ${date} | Nifty, Gold, Crude Oil`;
    ask = 'Aapke hisaab se aaj ki sabse badi khabar kaunsi hai? Comment karo 👇';
    tagsIg = ['#stockmarketnews', '#sharemarketnews', ...tg.slice(0, 2), '#setupradar'].slice(0, 5);
    while (tagsIg.length < 5) tagsIg.splice(tagsIg.length - 1, 0, ['#nifty50', '#stockmarketindia'][tagsIg.length % 2]);
    tagsYt = ['#shorts', '#stockmarketnews', '#nifty50'];
    ytTitle = `Share Market News ${date} | Nifty, Gold, Crude | Hindi`;
  }
  const follow = kind === 'news' ? `🔔 Roz subah market news ke liye Follow karo ${IG_HANDLE}` : `📌 Save karo, kaam aayega! Follow karo: 90 din ka FREE course, roz 1 baje lesson + 7 baje candle`;
  const body = [seo, '', ...pts, '', ask, follow, '📲 Free app: Setup Radar (link in bio)', '⚠️ Sirf shiksha ke liye. Investment advice nahi.'].join('\n');
  const caption_ig = body + '\n\n' + tagsIg.join(' ');
  const caption_fb = body + '\n\n' + tagsIg.join(' ');
  const yt_title = (ytTitle.length > 88 ? ytTitle.slice(0, 88) : ytTitle) + ' #shorts';
  const yt_desc = body.replace(follow, '🔔 Subscribe karo: roz F&O lesson, candle pattern aur market news (Hindi)') + '\n\n' + [...tagsYt, ...tagsIg.slice(0, 3)].filter((x, i, a) => a.indexOf(x) === i).join(' ');
  return { title: yt_title, caption: caption_ig, caption_ig, caption_fb, yt_title, yt_desc, hashtags: tagsIg };
}
module.exports = { build };
