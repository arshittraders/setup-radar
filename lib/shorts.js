// Daily shorts content engine (called only by this repo's GitHub Actions, verified with GitHub OIDC).
// POST {action:'script', kind:'lesson'|'candle', day}  -> {ok, script}
// POST {action:'news'}                                  -> {ok, script, sources}
// POST {action:'tts', text}                             -> {ok, mp3 (base64)}
const crypto = require('crypto');
const { send } = require('../api/_u');
const CUR = require('../shorts/curriculum.json');

const OAI = process.env.OPENAI_BASE || 'https://api.openai.com';
const REPO = 'arshittraders/setup-radar';
const AUD = 'setup-radar-shorts';

// ---------- GitHub OIDC verification ----------
let jwks = null, jwksAt = 0;
async function verifyGh(req) {
  const h = String(req.headers.authorization || '');
  const tok = h.startsWith('Bearer ') ? h.slice(7) : '';
  const p = tok.split('.');
  if (p.length !== 3) return false;
  const dec = s => JSON.parse(Buffer.from(s, 'base64url').toString('utf8'));
  const head = dec(p[0]), body = dec(p[1]);
  if (!jwks || Date.now() - jwksAt > 3600e3) {
    const r = await fetch('https://token.actions.githubusercontent.com/.well-known/jwks');
    jwks = (await r.json()).keys || []; jwksAt = Date.now();
  }
  const k = jwks.find(x => x.kid === head.kid);
  if (!k || head.alg !== 'RS256') return false;
  const ok = crypto.verify('RSA-SHA256', Buffer.from(p[0] + '.' + p[1]), crypto.createPublicKey({ key: k, format: 'jwk' }), Buffer.from(p[2], 'base64url'));
  const now = Date.now() / 1000;
  return ok && body.iss === 'https://token.actions.githubusercontent.com' && body.aud === AUD &&
    body.repository === REPO && body.exp > now && body.nbf <= now + 60;
}

// ---------- OpenAI ----------
async function chat(sys, user) {
  const r = await fetch(OAI + '/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + process.env.OPENAI_API_KEY },
    body: JSON.stringify({
      model: process.env.SHORTS_MODEL || 'gpt-4o', temperature: 0.7,
      response_format: { type: 'json_object' },
      messages: [{ role: 'system', content: sys }, { role: 'user', content: user }]
    })
  });
  const j = await r.json();
  if (!r.ok) throw new Error('OpenAI ' + r.status + ': ' + JSON.stringify(j).slice(0, 200));
  return JSON.parse(j.choices[0].message.content);
}
async function tts(text) {
  const r = await fetch(OAI + '/v1/audio/speech', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + process.env.OPENAI_API_KEY },
    body: JSON.stringify({
      model: process.env.OPENAI_TTS_MODEL || 'gpt-4o-mini-tts', voice: process.env.SHORTS_VOICE || 'onyx',
      input: text.slice(0, 1200), response_format: 'mp3',
      instructions: 'Ek josheela, garam-dil, bharosemand male teacher. Energy upar, muskurahat wali awaaz, YouTube Shorts jaisi tez par saaf raftaar. Hindi saaf bolo, English trading shabd (call, put, candle, support) English mein saaf bolo.'
    })
  });
  if (!r.ok) throw new Error('TTS ' + r.status + ': ' + (await r.text()).slice(0, 200));
  return Buffer.from(await r.arrayBuffer()).toString('base64');
}

// ---------- prompts ----------
const RULES = `Tum "Setup Radar" YouTube/Instagram channel ke liye 40-50 second ke Shorts likhte ho. Audience: Hindi bolne wale naye trader/learner (18-35).
TONE (sabse zaroori): josh bhara, motivate karne wala, dost jaisa. Kabhi darana nahi. "barbaad", "sab doob jayega", "khatarnaak", "90% log haarte hain" jaisi dar wali baatein bilkul nahi. Risk ki baat ho to positive tarike se: "smart trader pehle apna bachav sochta hai".
COMPLIANCE: sirf shiksha. Koi buy/sell tip, target, stock recommendation, "itna kamao", profit guarantee nahi. Kisi bhi aaj ke trade ka sujhav nahi.
FORMAT: JSON do:
{"title": "YouTube title, max 70 chars, Hinglish, end mein #shorts",
 "caption": "Insta/FB caption: 2-3 chhoti Hinglish lines + 6-8 relevant hashtags (#stockmarket #optionstrading #nifty #trading #sharemarket waghera)",
 "scenes": [ {"say": "Bolne wala text: Hindi Devanagari mein, English trading words Roman mein (jaise 'Call option', 'support'), 1-2 chhote vaakya", "show": "Screen ka bada text: Roman Hinglish, max 6 shabd", "sub": "Chhota supporting text Roman Hinglish, max 10 shabd (ya khaali)"} ]}
SCENES: 5-6 scenes. Pehla scene = zabardast HOOK (sawal ya chaunkane wali baat, 1 vaakya). Beech mein seedhi samajh + ek aasaan desi example (chai, cricket, sabzi mandi jaisa). Aakhri scene = ek motivating line (CTA mat likho, wo hum khud jodenge). Kul "say" 85-105 shabd.`;

function pad(n) { return String(n).padStart(2, '0'); }

async function lessonScript(day) {
  const l = CUR.lessons[day - 1];
  if (!l) throw new Error('lesson day out of range');
  const src = l.src ? l.src.join('\n') : l.k.join('\n');
  const out = await chat(RULES, `SERIES: "90 din ka F&O + Trading course" — Lesson ${day}/90.\nTOPIC: ${l.t}\nCONTENT (isi se banao, galat fact mat jodo):\n${src}\nTitle mein "Lesson ${day}/90" zaroor ho.`);
  return { kind: 'lesson', day, topic: l.t, badge: 'LESSON ' + pad(day) + ' / 90', ...out };
}
async function candleScript(day) {
  const c = CUR.candles[day - 1];
  if (!c) throw new Error('candle day out of range');
  const src = c.src ? c.src.join('\n') : c.k.join('\n');
  const bias = { bull: 'tezi (bullish)', bear: 'mandi (bearish)', neutral: 'neutral / faisle ki ghadi' }[c.bias] || 'neutral';
  const out = await chat(RULES, `SERIES: "90 Candles in 90 Days" — Candle ${day}/90.\nPATTERN: ${c.t} (${bias})\nCONTENT (isi se banao):\n${src}\nScreen par is pattern ki candle animation chalegi, isliye scene 2 mein shakal ka varnan karo ("dekho, ..."). Ek scene mein pushti (confirmation) ki baat karo. Title mein "Candle ${day}/90" zaroor ho.`);
  return { kind: 'candle', day, topic: c.t, bias: c.bias, shape: c.shape, badge: 'CANDLE ' + pad(day) + ' / 90', ...out };
}

// ---------- news ----------
function rssItems(xml, max) {
  const out = [];
  for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const g = t => ((m[1].match(new RegExp('<' + t + '>([\\s\\S]*?)</' + t + '>')) || [])[1] || '').replace(/<!\[CDATA\[|\]\]>/g, '').trim();
    const dt = Date.parse(g('pubDate'));
    if (dt && Date.now() - dt > 30 * 3600e3) continue;
    out.push({ h: g('title').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"'), t: dt });
    if (out.length >= max) break;
  }
  return out;
}
const NEWSQ = {
  NIFTY: 'Sensex Nifty today', GOLD: 'gold price India today', CRUDE: 'crude oil price today',
  RUPEE: 'rupee dollar today', GLOBAL: 'US stock market Dow Nasdaq', RBI: 'RBI OR inflation OR GDP India economy'
};
async function newsScript() {
  const src = {};
  await Promise.all(Object.entries(NEWSQ).map(async ([k, q]) => {
    try {
      const r = await fetch('https://news.google.com/rss/search?q=' + encodeURIComponent(q + ' when:1d') + '&hl=en-IN&gl=IN&ceid=IN:en');
      src[k] = rssItems(await r.text(), 6);
    } catch (e) { src[k] = []; }
  }));
  const d = new Date(Date.now() + 5.5 * 3600e3);
  const date = d.toISOString().slice(0, 10);
  const nice = d.getUTCDate() + ' ' + ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getUTCMonth()];
  const list = Object.entries(src).map(([k, a]) => k + ':\n' + a.map(x => '- ' + x.h).join('\n')).join('\n\n');
  const out = await chat(RULES + `
NEWS SHORT ke extra rules: sirf neeche diye headlines ke facts use karo, apni taraf se koi number ya khabar mat banao. Agar kisi category mein kaam ki khabar nahi to use chhod do. 4 sabse kaam ki khabrein chuno (gold, crude, Nifty/Sensex ko pehle priority). Har khabar ek scene. Koi bhavishyavani nahi ("kal badhega" nahi). Har scene mein "tag" field bhi do: GOLD / CRUDE / NIFTY / RUPEE / GLOBAL / ECONOMY. Pehla scene hook: "Aaj ki 4 badi market khabrein, 40 second mein!" jaisa. Aakhri scene positive line: "Khabar padho, samjho, aur seekhte raho" jaisa.`,
    `Aaj ki tareekh: ${nice} ${d.getUTCFullYear()}.\nHEADLINES (pichhle 24 ghante):\n${list}\nTitle format: "Market News ${nice} | ... #shorts"`);
  return { script: { kind: 'news', day: date, topic: 'Market News', badge: 'MARKET NEWS · ' + nice.toUpperCase(), ...out }, sources: src };
}

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') return send(res, 405, { ok: false });
    if (!(await verifyGh(req))) return send(res, 403, { ok: false, error: 'forbidden' });
    if (!process.env.OPENAI_API_KEY) return send(res, 503, { ok: false, error: 'OPENAI_API_KEY missing' });
    let b = req.body;
    if (typeof b === 'string') b = JSON.parse(b || '{}');
    b = b || {};
    if (b.action === 'tts') return send(res, 200, { ok: true, mp3: await tts(String(b.text || '')) });
    if (b.action === 'news') return send(res, 200, { ok: true, ...(await newsScript()) });
    if (b.action === 'script') {
      const day = Math.max(1, Math.min(90, Number(b.day) || 1));
      const script = b.kind === 'candle' ? await candleScript(day) : await lessonScript(day);
      return send(res, 200, { ok: true, script });
    }
    send(res, 400, { ok: false, error: 'bad action' });
  } catch (e) { send(res, 502, { ok: false, error: String(e.message || e) }); }
};
