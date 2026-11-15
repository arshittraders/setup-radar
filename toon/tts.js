// Golu & Bunty voices via Gemini TTS (studio function, OIDC): one take per character → split per line. usage: node toon/tts.js <outdir>
const fs = require('fs'), path = require('path');
const { makeTakes } = require('./takes');
const out = process.argv[2] || 'tn'; fs.mkdirSync(out, { recursive: true });
const S = JSON.parse(fs.readFileSync(path.join(__dirname, 'script.json'), 'utf8'));
const FN = 'https://ceoehwleopykotddcxxk.supabase.co/functions/v1/studio';
const tok = async () => (await (await fetch(process.env.ACTIONS_ID_TOKEN_REQUEST_URL + '&audience=studio-worker', { headers: { Authorization: 'bearer ' + process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN } })).json()).value;
const tts = async (text, voice, style) => {
  const r = await fetch(FN, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + await tok() }, body: JSON.stringify({ action: 'w_tts', text, voice, style }) });
  const j = await r.json().catch(() => ({ error: 'bad json ' + r.status })); if (!j.pcm) throw new Error(JSON.stringify(j).slice(0, 200)); return j;
};
makeTakes(S.lines, S.voices, out, tts).catch((e) => { console.error(e); process.exit(1); });
