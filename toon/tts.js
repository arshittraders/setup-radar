// voice lines for toon/script.json via /api/shorts (OIDC). usage: node toon/tts.js <outdir>
const fs = require('fs'), path = require('path');
const out = process.argv[2] || 'tn'; fs.mkdirSync(out, { recursive: true });
const S = JSON.parse(fs.readFileSync(path.join(__dirname, 'script.json'), 'utf8'));
(async () => {
  const tk = await (await fetch(process.env.ACTIONS_ID_TOKEN_REQUEST_URL + '&audience=setup-radar-shorts', { headers: { Authorization: 'bearer ' + process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN } })).json();
  let usd = 0;
  for (const l of S.lines) {
    const v = S.voices[l.who];
    const r = await fetch('https://setup-radar.vercel.app/api/shorts', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tk.value }, body: JSON.stringify({ action: 'tts', text: l.text, voice: v.voice, style: v.style }) });
    const j = await r.json(); if (!j.mp3) throw new Error(JSON.stringify(j).slice(0, 300));
    usd += (j.cost && j.cost.usd) || 0;
    fs.writeFileSync(path.join(out, `tn-${l.id}.mp3`), Buffer.from(j.mp3, 'base64')); console.log('line', l.id);
  }
  console.log('cost usd', usd.toFixed(4));
})().catch(e => { console.error(e); process.exit(1); });
