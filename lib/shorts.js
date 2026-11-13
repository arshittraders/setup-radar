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
const deva = t => { const s = String(t || ''); const d = (s.match(/[\u0900-\u097F]/g) || []).length; const l = (s.match(/[A-Za-z]/g) || []).length; return d > 0 && l < d * 0.3; };
// script with retry until spoken lines are Devanagari
async function chatScript(sys, user) {
  let out;
  for (let i = 0; i < 3; i++) {
    out = await chat(sys, user + (i ? '\nDHYAN: pichhli baar "say" Roman mein tha. Har "say" Devanagari mein likho.' : ''));
    if (Array.isArray(out.scenes) && out.scenes.length >= 3 && out.scenes.every(x => deva(x.say))) return out;
  }
  return out;
}
const VOICES = ['alloy','ash','ballad','coral','echo','fable','onyx','nova','sage','shimmer','verse'];
const STYLES = {
  warm: 'Ek josheela, garam-dil, bharosemand male teacher. Energy upar, muskurahat wali awaaz, YouTube Shorts jaisi tez par saaf raftaar. Hindi saaf bolo, English trading shabd (call, put, candle, support) English mein saaf bolo.',
  bass: 'Tum ek high-energy Indian YouTube Shorts host ho, jaise cricket commentator ya motivational speaker jab sabse zyada josh mein ho. Gehri, bhaari, bass wali mardana awaaz. BAHUT TEZ raftaar, lagatar flow, shabdon ke beech koi lamba pause nahi, har line punchy aur upar jaati hui, zaroori shabdon par zor. Awaaz mein muskaan aur excitement. Hindi saaf, English trading shabd English mein.',
  horror_narr: 'Tum ek Hindi horror kahani sunane wale narrator ho, jaise raat ko radio par darawni kahani. Gehri, dheemi, rahasyamay awaaz, aadhi phusphusahat. Har vaakya ke beech suspense wala thahrav, "..." par ruk kar saans lo. Dar aur bechaini mehsoos ho. Robotic bilkul nahi.',
  horror_mom: 'Tum ek budhi Indian maa ho jo phone par bahut ghabrayi hui aur rote hue apne bete ko bachane ki koshish kar rahi hai. Kaanpti, bheegi, dheemi awaaz, beech beech mein sisakna. Pyaar aur dar dono.',
  horror_fake: 'Tum ek bhoot ho jo maa ki nakal kar raha hai. Upar se meethi, pyaar bhari awaaz, lekin andar se thandi aur darawni. Bahut dheere, khinchte hue shabd, halki si muskurahat jo dara de.',
  horror_rohan: 'Tum ek 22 saal ka ladka ho jo bahut dara hua hai aur ghabraahat mein zor se chillata hai. Kaanpti, tez saans wali awaaz, dar se tooti hui.',
  horror_girl: 'Ek jawaan ladki ki aatma jo gusse aur dard mein hai. Thandi, khokhli, kaanpti awaaz, dheere dheere bolti hai, aakhri shabdon par achanak zor aur gussa. Darawni lekin saaf.',
  story_narr: 'Ek garam-dil, bhaavuk Hindi kahani sunane wale narrator ho, jaise dadi-nani ki kahani ya audio-book. Saaf, bhaav bhari awaaz, suspense par thahrav, robotic bilkul nahi.',
  char_f: 'Ek jawaan Indian ladki, bhaav ke saath, kahani ke hisaab se dar, khushi ya gussa saaf jhalke.',
  char_m: 'Ek jawaan Indian ladka, bhaav ke saath, kahani ke hisaab se josh, dar ya gussa saaf jhalke.',
  char_old_f: 'Ek budhi Indian aurat, garam aur thodi kaanpti awaaz, bhaav bhari.',
  char_old_m: 'Ek budha Indian aadmi ya sadhu, gehri, thahri hui, rahasyamay awaaz.',
  char_child: 'Ek chhota Indian bachcha, masoom aur bhaav bhari awaaz.',
  horror_whisper: 'Ek maa bahut dheere, phusphusa kar, dar se kaanpte hue apne bete ko chetavni de rahi hai. Lagbhag sirf saans aur phusphusahat.'
};
async function tts(text, voice, style) {
  const r = await fetch(OAI + '/v1/audio/speech', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + process.env.OPENAI_API_KEY },
    body: JSON.stringify({
      model: process.env.OPENAI_TTS_MODEL || 'gpt-4o-mini-tts', voice: VOICES.includes(voice) ? voice : (process.env.SHORTS_VOICE || 'onyx'),
      input: text.slice(0, 1200), response_format: 'mp3',
      instructions: STYLES[style] || STYLES.bass
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
 "scenes": [ {"say": "Bolne wala text: Hindi Devanagari mein, English trading words Roman mein (jaise 'Call option', 'support'), 1-2 chhote vaakya", "show": "Screen ka bada text: Roman Hinglish, max 6 shabd", "sub": "Chhota supporting text Roman Hinglish, max 10 shabd (ya khaali)", "emoji": "scene se juda 1 emoji"} ]}
"say" HAMESHA Devanagari lipi mein ho (Roman Hindi bilkul nahi), sirf English trading shabd Roman mein. Example say: "दोस्तों, क्या आप जानते हो कि Call option आखिर होता क्या है?"
SCENES: 5-6 scenes. Pehla scene = zabardast HOOK (sawal ya chaunkane wali baat, 1 vaakya). Beech mein seedhi samajh + ek aasaan desi example (chai, cricket, sabzi mandi jaisa). Aakhri scene = ek motivating line (CTA mat likho, wo hum khud jodenge). Kul "say" 70-85 shabd (video 40 second se chhota rahe, retention ke liye). Pehli line 8 shabd se kam, seedha curiosity jagaye.`;

function pad(n) { return String(n).padStart(2, '0'); }

async function lessonScript(day) {
  const l = CUR.lessons[day - 1];
  if (!l) throw new Error('lesson day out of range');
  const src = l.src ? l.src.join('\n') : l.k.join('\n');
  const out = await chatScript(RULES, `SERIES: "90 din ka F&O + Trading course" — Lesson ${day}/90.\nTOPIC: ${l.t}\nCONTENT (isi se banao, galat fact mat jodo):\n${src}\nTitle mein "Lesson ${day}/90" zaroor ho.`);
  return { kind: 'lesson', day, topic: l.t, badge: 'LESSON ' + pad(day) + ' / 90', ...out };
}
async function candleScript(day) {
  const c = CUR.candles[day - 1];
  if (!c) throw new Error('candle day out of range');
  const src = c.src ? c.src.join('\n') : c.k.join('\n');
  const bias = { bull: 'tezi (bullish)', bear: 'mandi (bearish)', neutral: 'neutral / faisle ki ghadi' }[c.bias] || 'neutral';
  const out = await chatScript(RULES, `SERIES: "90 Candles in 90 Days" — Candle ${day}/90.\nPATTERN: ${c.t} (${bias})\nCONTENT (isi se banao):\n${src}\nScreen par is pattern ki candle animation chalegi, isliye scene 2 mein shakal ka varnan karo ("dekho, ..."). Ek scene mein pushti (confirmation) ki baat karo. Title mein "Candle ${day}/90" zaroor ho.`);
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
  const out = await chatScript(RULES + `
NEWS SHORT ke extra rules: sirf neeche diye headlines ke facts use karo, apni taraf se koi number ya khabar mat banao. Agar kisi category mein kaam ki khabar nahi to use chhod do. 4 sabse kaam ki khabrein chuno (gold, crude, Nifty/Sensex ko pehle priority). Har khabar ek scene. Koi bhavishyavani nahi ("kal badhega" nahi). Har scene mein "tag" field bhi do: GOLD / CRUDE / NIFTY / RUPEE / GLOBAL / ECONOMY. Pehla scene hook: "Aaj ki 4 badi market khabrein, 40 second mein!" jaisa. Aakhri scene positive line: "Khabar padho, samjho, aur seekhte raho" jaisa.`,
    `Aaj ki tareekh: ${nice} ${d.getUTCFullYear()}.\nHEADLINES (pichhle 24 ghante):\n${list}\nTitle format: "Market News ${nice} | ... #shorts"`);
  return { script: { kind: 'news', day: date, topic: 'Market News', badge: 'MARKET NEWS · ' + nice.toUpperCase(), ...out }, sources: src };
}


// ---------- Story Studio: storyboard panels + story -> scene plan (vision) ----------
async function chatVision(sys, content) {
  const r = await fetch(OAI + '/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + process.env.OPENAI_API_KEY },
    body: JSON.stringify({ model: process.env.STUDIO_MODEL || 'gpt-4o', temperature: 0.4, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: sys }, { role: 'user', content }] }) });
  const j = await r.json(); if (!r.ok) throw new Error('OpenAI ' + r.status + ': ' + JSON.stringify(j).slice(0, 200));
  return JSON.parse(j.choices[0].message.content);
}
const CAST_VOICE = (c, mood) => {
  const g = String(c.gender || 'f')[0], age = String(c.age || 'young');
  if (c.ghost) return g === 'm' ? { voice: 'onyx', style: 'horror_fake', fx: 'ghost' } : { voice: 'shimmer', style: 'horror_girl', fx: 'ghost' };
  if (age === 'child') return { voice: 'nova', style: 'char_child', fx: 'dry' };
  if (age === 'old') return g === 'm' ? { voice: 'ash', style: 'char_old_m', fx: 'dry' } : { voice: 'coral', style: 'char_old_f', fx: 'dry' };
  return g === 'm' ? { voice: 'echo', style: 'char_m', fx: 'dry' } : { voice: 'shimmer', style: 'char_f', fx: 'dry' };
};
async function storyPlan(b) {
  const mood = b.mood === 'horror' ? 'horror' : 'story';
  const panels = (b.panels || []).slice(0, 40);
  const sys = `Tum ek expert YouTube Shorts story director ho. Tumhe ek storyboard ke numbered panels (images) aur ek Hindi kahani milegi. Kahani ko 40-60 second ke vertical short mein badalna hai jahan har scene par ek panel image dikhegi (Ken-Burns camera move ke saath) aur Hindi voiceover chalega.
RULES:
- Kahani ka koi hissa mat chhodo, mat badlo; sirf bolne layak tod do. Dialogue us character ki awaaz mein ho.
- 8-14 segments. Har segment 1-2 chhote vaakya. "text" Devanagari mein, suspense ke liye "..." daal sakte ho. "sub" wahi line saaf punctuation ke saath (dialogue ho to double quotes mein).
- Har segment ke liye sabse matching panel id chuno (sirf diye gaye ids). Title/text/banner wale panels mat chuno. Ek hi panel lagatar 2 se zyada baar nahi. Kahani ke flow ke hisaab se visuals badalte rahein.
- "who": "N" narrator ke liye. Kahani mein jo bhi line quotes ("...") mein kisi character ki boli hui hai, uska segment ALAG rakho aur "who" us character ki cast key ho (narrator nahi). Cast mein har bolne wala character zaroor ho; bhoot/aatma/chudail ke liye "ghost": true.
- "move": in | out | panL | panR | snap (snap sirf darawne reveal par). "sfx" (optional): owl | shimmer | slam | stinger (stinger sirf aakhri twist par). "flicker": true darawni jagah. "shake": true jhatke par.
- "hook_panel": sabse chaunkane wala panel (pehle 1 second flash ke liye).
- caption: 2 chhoti Hinglish (Roman) lines + engagement sawaal. hashtags: theek 5, Roman/English lowercase jo log search karte hain (jaise #horrorstory #hindihorror #bhootkikahani #scarystories #hindikahani) — Devanagari hashtags nahi. yt_title: max 70 chars + #shorts.
JSON: {"title":"Hindi title (2-4 shabd)","part":"भाग 1 ya khaali","next":"agle bhaag ki ek line ya follow line","hook_panel":"P..","cast":[{"key":"RIYA","gender":"f","age":"young|old|child","ghost":false}],"segments":[{"panel":"P..","move":"in","who":"N","text":"...","sub":"...","sfx":"","flicker":false,"shake":false}],"caption":"...","hashtags":["#.."],"yt_title":"..."}`;
  const content = [{ type: 'text', text: `MOOD: ${mood}\nTITLE (optional): ${b.title || ''}\nPART: ${b.part || ''}\nKAHANI:\n${String(b.story || '').slice(0, 6000)}\n\nPanels neeche hain, har image se pehle uski id:` }];
  panels.forEach(p => { content.push({ type: 'text', text: p.id }); content.push({ type: 'image_url', image_url: { url: 'data:image/jpeg;base64,' + p.b64, detail: 'low' } }); });
  const ids = new Set(panels.map(p => p.id));
  let out;
  for (let i = 0; i < 2; i++) {
    out = await chatVision(sys, content);
    const segs = (out.segments || []).filter(g => ids.has(g.panel) && g.text);
    if (segs.length >= 4 && segs.every(g => deva(g.text))) { out.segments = segs; break; }
  }
  if (!out || !(out.segments || []).length) throw new Error('plan fail');
  const voices = { N: mood === 'horror' ? { voice: b.narrator || 'onyx', style: 'horror_narr', fx: 'narr' } : { voice: b.narrator || 'onyx', style: 'story_narr', fx: 'narr' } };
  (out.cast || []).forEach(c => { if (c && c.key) voices[c.key] = CAST_VOICE(c, mood); });
  out.segments.forEach(g => { if (!voices[g.who]) g.who = 'N'; g.pre = g.pre || 0.3; });
  if (!ids.has(out.hook_panel)) out.hook_panel = out.segments[out.segments.length - 1].panel;
  return { title: out.title || b.title || 'कहानी', part: out.part || b.part || '', next: out.next || 'Follow karo, agla bhaag jaldi!', mood, voices,
    hook: mood === 'horror' ? { panel: out.hook_panel, dur: 1.1 } : null, segments: out.segments,
    caption: out.caption || '', hashtags: (out.hashtags || []).slice(0, 5), yt_title: out.yt_title || (out.title + ' #shorts') };
}

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') return send(res, 405, { ok: false });
    if (!(await verifyGh(req))) return send(res, 403, { ok: false, error: 'forbidden' });
    if (!process.env.OPENAI_API_KEY) return send(res, 503, { ok: false, error: 'OPENAI_API_KEY missing' });
    let b = req.body;
    if (typeof b === 'string') b = JSON.parse(b || '{}');
    b = b || {};
    if (b.action === 'tts') return send(res, 200, { ok: true, mp3: await tts(String(b.text || ''), b.voice, b.style) });
    if (b.action === 'news') return send(res, 200, { ok: true, ...(await newsScript()) });
    if (b.action === 'plan') return send(res, 200, { ok: true, plan: await storyPlan(b) });
    if (b.action === 'script') {
      const day = Math.max(1, Math.min(90, Number(b.day) || 1));
      const script = b.kind === 'candle' ? await candleScript(day) : await lessonScript(day);
      return send(res, 200, { ok: true, script });
    }
    send(res, 400, { ok: false, error: 'bad action' });
  } catch (e) { send(res, 502, { ok: false, error: String(e.message || e) }); }
};
