// Golu & Bunty voices via IndicF5 clone of the approved first-two-line voices (studio/voices/golu|bunty).
// usage: node toon/f5.js <dir with script.json>  → writes <dir>/tn-<id>.mp3
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
function f5Takes(lines, dir, py, log = console.log, cast = 'gb') {
  const VO = cast === 'tt' ? { G: 'tiklu', B: 'jugnu' } : { G: 'golu', B: 'bunty' };
  const items = lines.map((l) => ({ i: l.id, text: l.text.trim(), voice: VO[l.who], out: `f5-${l.id}.wav` }));
  fs.writeFileSync(path.join(dir, 'f5toon.json'), JSON.stringify(items));
  execFileSync(py, [path.join(__dirname, '..', 'studio', 'tts_f5.py'), path.join(dir, 'f5toon.json'), dir], { stdio: 'inherit', timeout: 60 * 60e3 });
  for (const l of lines) execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', path.join(dir, `f5-${l.id}.wav`), '-b:a', '128k', path.join(dir, `tn-${l.id}.mp3`)]);
  log('f5 toon voices ok', lines.length);
}
module.exports = { f5Takes };
if (require.main === module) {
  const dir = path.resolve(process.argv[2]); const S = JSON.parse(fs.readFileSync(path.join(dir, 'script.json'), 'utf8'));
  f5Takes(S.lines, dir, process.env.F5_PY || 'python3');
}
