// Shared CC0 sound-effect helper for all Studio builders (library built by sfx/build_lib.py from Openverse, CC0 only).
// const SFX = require('/home/claude/setup-radar/sfx/sfx.js'); SFX.place(float32Buf, SR, timeSec, 'whoosh', seed, gain)
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..'); let LIB = null; const cache = {};
const lib = () => LIB || (LIB = fs.existsSync(__dirname + '/library.json') ? JSON.parse(fs.readFileSync(__dirname + '/library.json', 'utf8')) : []);
function decode(file, SR) {
  const k = file + '@' + SR; if (cache[k]) return cache[k];
  const raw = execFileSync('ffmpeg', ['-v', 'error', '-i', path.join(ROOT, file), '-f', 's16le', '-ac', '1', '-ar', String(SR), '-'], { maxBuffer: 1 << 27 });
  const a = new Float32Array(raw.length / 2); for (let i = 0; i < a.length; i++) a[i] = raw.readInt16LE(i * 2) / 32768; return (cache[k] = a);
}
function pick(cat, n = 0) { const L = lib().filter((x) => x.cat === cat); return L.length ? L[((n % L.length) + L.length) % L.length].file : null; }
// mix a sound into buf at time t (sec). lead = seconds of the sound placed BEFORE t (whooshes peak late, so they should start early). returns duration or 0
function place(buf, SR, t, cat, n = 0, gain = 0.5, lead = 0) {
  const f = pick(cat, n); if (!f) return 0; const s = decode(f, SR); const st = Math.floor((t - lead) * SR);
  for (let i = 0; i < s.length && st + i < buf.length; i++) if (st + i >= 0) buf[st + i] += s[i] * gain; return s.length / SR;
}
module.exports = { lib, pick, place, decode };
