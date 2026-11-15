// One Gemini TTS call per character (consistent voice), then split into per-line clips tn-<id>.mp3.
// tts(text, voice, style) → {pcm, mime}
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const { splitTake } = require('./split');
async function makeTakes(lines, voices, out, tts, log = console.log) {
  for (const who of ['G', 'B']) {
    const L = lines.filter((l) => l.who === who); if (!L.length) continue;
    const v = voices[who];
    const text = L.map((l) => l.text.trim()).join('\n\n... ...\n\n');
    const style = v.style.replace('Say exactly:', `Read these ${L.length} separate lines in the same voice. After every line take a clear full one-second pause. Do not read the dots. Lines:`);
    let ok = false, err = '';
    for (let attempt = 1; attempt <= 3 && !ok; attempt++) {
      try {
        const j = await tts(text, v.voice, style);
        const raw = path.join(out, `take-${who}.pcm`), wav = path.join(out, `take-${who}.wav`);
        fs.writeFileSync(raw, Buffer.from(j.pcm, 'base64'));
        const rate = (/rate=(\d+)/.exec(j.mime || '') || [0, 24000])[1];
        execFileSync('ffmpeg', ['-y', '-v', 'error', '-f', 's16le', '-ar', String(rate), '-ac', '1', '-i', raw, wav]);
        splitTake(wav, L.length, L.map((l) => path.join(out, `tn-${l.id}.mp3`)));
        ok = true; log('take', who, L.length, 'lines ok');
      } catch (e) { err = String(e.message || e).slice(0, 200); log('take retry', who, err); await new Promise((r) => setTimeout(r, 10000 * attempt)); }
    }
    if (!ok) throw new Error('take ' + who + ': ' + err);
  }
}
module.exports = { makeTakes };
