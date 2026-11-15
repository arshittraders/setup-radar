// voice lines for toon/script.json via Gemini TTS (studio function, OIDC). usage: node toon/tts.js <outdir>
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const out = process.argv[2] || 'tn'; fs.mkdirSync(out, { recursive: true });
const S = JSON.parse(fs.readFileSync(path.join(__dirname, 'script.json'), 'utf8'));
const FN = 'https://ceoehwleopykotddcxxk.supabase.co/functions/v1/studio';
(async () => {
  const tok = async () => (await (await fetch(process.env.ACTIONS_ID_TOKEN_REQUEST_URL + '&audience=studio-worker', { headers: { Authorization: 'bearer ' + process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN } })).json()).value;
  for (const l of S.lines.filter(x => !process.env.ONLY || process.env.ONLY.split(',').includes(x.who))) {
    const v = S.voices[l.who]; let j;
    for (let i = 1; i <= 5; i++) {
      const r = await fetch(FN, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + await tok() }, body: JSON.stringify({ action: 'w_tts', text: l.text, voice: v.voice, style: v.style }) });
      j = await r.json().catch(() => ({ error: 'bad json ' + r.status })); if (j.pcm) break; console.log('retry', l.id, JSON.stringify(j).slice(0, 200)); await new Promise(r => setTimeout(r, 12000 * i));
    }
    if (!j.pcm) { if (l.who.startsWith('L')) { console.log('skip laugh', l.id); continue; } throw new Error(JSON.stringify(j).slice(0, 300)); }
    const raw = path.join(out, `${l.id}.pcm`); fs.writeFileSync(raw, Buffer.from(j.pcm, 'base64'));
    const rate = /rate=(\d+)/.exec(j.mime || '') ? +/rate=(\d+)/.exec(j.mime)[1] : 24000;
    execFileSync('ffmpeg', ['-y', '-v', 'error', '-f', 's16le', '-ar', String(rate), '-ac', '1', '-i', raw, '-b:a', '128k', path.join(out, `tn-${l.id}.mp3`)]);
    console.log('line', l.id, j.model); await new Promise(r => setTimeout(r, 6500));
  }
})().catch(e => { console.error(e); process.exit(1); });
