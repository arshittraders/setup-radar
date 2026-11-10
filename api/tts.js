// Natural male Hindi voice via OpenAI TTS. POST {text} -> audio/mpeg
const { send } = require('./_u');
const limited = require('./_rl');
const OAI = process.env.OPENAI_BASE || 'https://api.openai.com';
module.exports = async (req, res) => {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return send(res, 503, { ok: false, error: 'OPENAI_API_KEY set nahi hai' });
  if (limited(req, 'tts', 60, 10 * 60e3)) return send(res, 429, { ok: false, error: 'rate limit' });
  try {
    let body = req.body;
    if (typeof body === 'string') body = JSON.parse(body || '{}');
    const text = String((body && body.text) || '').trim().slice(0, 600);
    if (!text) return send(res, 400, { ok: false, error: 'text khali hai' });
    const r = await fetch(OAI + '/v1/audio/speech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
      body: JSON.stringify({
        model: process.env.OPENAI_TTS_MODEL || 'gpt-4o-mini-tts',
        voice: process.env.OPENAI_VOICE || 'onyx',
        input: text, response_format: 'mp3',
        instructions: 'Bol rahe ho ek shaant, bharosemand male teacher ki tarah. Saaf Hindi (Devanagari), dheemi aur samajhne laayak raftaar, English shabd bhi saaf bolo.'
      })
    });
    if (!r.ok) { const t = await r.text(); return send(res, 502, { ok: false, error: 'OpenAI ' + r.status + ': ' + t.slice(0, 200) }); }
    const buf = Buffer.from(await r.arrayBuffer());
    res.statusCode = 200;
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-store');
    res.end(buf);
  } catch (e) { send(res, 502, { ok: false, error: String(e.message || e) }); }
};
