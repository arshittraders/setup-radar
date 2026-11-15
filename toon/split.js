// Split one long TTS take (all lines of one character, separated by pauses) into k clips at the k-1 longest silences.
const { execFileSync, spawnSync } = require('child_process');
function splitTake(file, k, outFiles) {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-i', file, '-af', 'silencedetect=noise=-38dB:d=0.18', '-f', 'null', '-'], { encoding: 'utf8' });
  const log = (r.stderr || '') + (r.stdout || '');
  const dur = +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString().trim();
  const sil = []; let st = null;
  for (const m of log.matchAll(/silence_(start|end): ([\d.]+)/g)) { if (m[1] === 'start') st = +m[2]; else if (st != null) { sil.push({ s: st, e: +m[2] }); st = null; } }
  const inner = sil.filter((x) => x.s > 0.15 && x.e < dur - 0.15).sort((a, b) => (b.e - b.s) - (a.e - a.s)).slice(0, k - 1).sort((a, b) => a.s - b.s);
  if (inner.length < k - 1) throw new Error(`split: ${inner.length + 1} parts mile, ${k} chahiye`);
  const cuts = [0, ...inner.map((x) => (x.s + x.e) / 2), dur];
  for (let i = 0; i < k; i++) execFileSync('ffmpeg', ['-y', '-v', 'error', '-ss', cuts[i].toFixed(3), '-to', cuts[i + 1].toFixed(3), '-i', file, '-b:a', '128k', outFiles[i]]);
  return cuts;
}
module.exports = { splitTake };
