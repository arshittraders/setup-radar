// usage: OIDC=<token> node story/make.js story/haar/part1.json job
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const API = process.env.SHORTS_API || 'https://setup-radar.vercel.app/api/shorts';
const [storyF, outArg] = process.argv.slice(2);
const out = path.resolve(outArg || 'job'); fs.mkdirSync(path.join(out, 'img'), { recursive: true });
const S = JSON.parse(fs.readFileSync(storyF, 'utf8')), PAN = path.join(path.dirname(storyF), 'panels');
async function tts(text, voice, style) {
  for (let i = 1; ; i++) {
    const r = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + process.env.OIDC }, body: JSON.stringify({ action: 'tts', text, voice, style }) });
    const j = await r.json().catch(() => ({})); if (j.ok) return Buffer.from(j.mp3, 'base64');
    if (i >= 3) throw new Error('tts ' + JSON.stringify(j).slice(0, 300)); await new Promise(r => setTimeout(r, 4000 * i));
  }
}
(async () => {
  // panels: AI-upscaled copies (if the workflow made them) else lanczos 4x + sharpen
  const ids = new Set([...(S.hook ? [S.hook.panel] : []), ...S.segments.map(g => g.panel)]);
  for (const id of ids) {
    const dst = path.join(out, 'img', id + '.png');
    if (!fs.existsSync(dst)) execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', path.join(PAN, id + '.png'), '-vf', 'scale=iw*4:ih*4:flags=lanczos,unsharp=5:5:0.8', dst]);
  }
  if (!process.env.SKIP_TTS) for (let i = 0; i < S.segments.length; i++) { const g = S.segments[i], v = S.voices[g.who]; fs.writeFileSync(path.join(out, `a${i}.mp3`), await tts(g.text, v.voice, v.style)); }
  fs.writeFileSync(path.join(out, 'story.json'), JSON.stringify(S));
  execFileSync('node', [path.join(__dirname, 'render.js'), out], { stdio: 'inherit' });
})().catch(e => { console.error(e); process.exit(1); });
