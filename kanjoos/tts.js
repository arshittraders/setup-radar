// Kanjoos Uncle voice lines: node kanjoos/tts.js <outdir> (runs in Actions, OIDC → /api/shorts tts)
const fs = require('fs'), path = require('path');
const out = process.argv[2] || 'ku'; fs.mkdirSync(out, { recursive: true });
const S = JSON.parse(fs.readFileSync(path.join(__dirname, 'script.json'), 'utf8'));
(async () => {
  const tk = await (await fetch(process.env.ACTIONS_ID_TOKEN_REQUEST_URL + '&audience=setup-radar-shorts', { headers: { Authorization: 'bearer ' + process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN } })).json();
  for (let i = 0; i < S.length; i++) {
    const r = await fetch('https://setup-radar.vercel.app/api/shorts', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tk.value }, body: JSON.stringify({ action: 'tts', text: S[i].text, voice: process.env.KU_VOICE || 'ash', style: 'kanjoos_uncle' }) });
    const j = await r.json(); if (!j.mp3) throw new Error(JSON.stringify(j).slice(0, 300));
    fs.writeFileSync(path.join(out, `ku-${i}.mp3`), Buffer.from(j.mp3, 'base64')); console.log('line', i);
  }
})().catch(e => { console.error(e); process.exit(1); });
