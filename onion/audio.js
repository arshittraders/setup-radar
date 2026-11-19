// ASMR soundtrack for the onion video, all synthesized. usage: node audio.js out.wav
require('./tl.js'); const fs = require('fs'); const SR = 44100, N = Math.ceil(TL.TOTAL * SR), A = new Float32Array(N);
let sd = 3; const rn = () => ((sd = (sd * 16807) % 2147483647) / 2147483647) * 2 - 1;
const add = (t0, len, fn) => { const s = Math.floor(t0 * SR); for (let i = 0; i < len * SR && s + i < N; i++) if (s + i >= 0) A[s + i] += fn(i / SR); };
// one-pole filters for noise colour
function burst(t0, len, g, hp = 0.6, dec = 60) { let lp = 0, prev = 0; add(t0, len, (x) => { const w = rn(); lp += hp * (w - lp); const h = w - lp; prev = h; return g * h * Math.exp(-x * dec); }); }
function chop(t0, g = 1) { burst(t0, 0.07, 0.55 * g, 0.35, 55);                      // crisp crunch
  burst(t0 + 0.012, 0.05, 0.3 * g, 0.75, 80);
  add(t0 + 0.03, 0.12, (x) => 0.55 * g * Math.sin(2 * Math.PI * (210 - 500 * x) * x) * Math.exp(-x * 38)); } // board thock
function thud(t0) { add(t0, 0.35, (x) => 0.8 * Math.sin(2 * Math.PI * (95 - 80 * x) * x) * Math.exp(-x * 12)); burst(t0, .08, .25, .2, 40); }
function pop(t0) { add(t0, 0.25, (x) => 0.35 * Math.sin(2 * Math.PI * (600 + 900 * Math.exp(-x * 20)) * x) * Math.exp(-x * 14)); }
function whoosh(t0, len = .45) { let lp = 0; add(t0, len, (x) => { lp += 0.08 * (rn() - lp); return 0.5 * lp * Math.sin(Math.PI * x / len); }); }
// soft warm pad underneath (very quiet)
for (let i = 0; i < N; i++) { const t = i / SR, env = Math.min(1, t / 2) * Math.min(1, (TL.TOTAL - t) / 2); A[i] += env * (0.018 * Math.sin(2 * Math.PI * 130.8 * t) + 0.014 * Math.sin(2 * Math.PI * 196 * t + Math.sin(t * .3)) + 0.01 * Math.sin(2 * Math.PI * 261.6 * t) * (0.5 + 0.5 * Math.sin(t * .4))); }
for (const r of TL.rounds) {
  whoosh(r.tEnter, .4); thud(r.tEnter + TL.ENTER * 0.6); if (r.follower) pop(r.t0 + .05);
  let last = -1; for (let k = 1; k <= r.N; k++) { const t = TL.cutTime(r, k); if (t - last < 0.028) continue; const gap = last < 0 ? 1 : t - last; last = t; chop(t, Math.min(1, 0.45 + gap * 2.2)); }
  // crumble: grains falling + landing, density follows release rate
  const t0 = r.tCol, t1 = r.tCol + r.Tcol * 0.78 + 0.8, dens = Math.min(900, 60 + Math.sqrt(Math.min(r.real, 4e6)) * 0.6);
  let s2 = 7 + r.i; const u = () => ((s2 = (s2 * 16807) % 2147483647) / 2147483647);
  for (let k = 0; k < dens * (t1 - t0); k++) { const t = t0 + 0.35 + u() * (t1 - t0 - 0.35); const f = 1800 + u() * 4200, g = 0.06 + u() * 0.12;
    add(t, 0.02, (x) => g * Math.sin(2 * Math.PI * f * x) * Math.exp(-x * 260) + g * 0.6 * rn() * Math.exp(-x * 400)); }
  let lp = 0; add(t0 + .3, t1 - t0, (x) => { lp += 0.15 * (rn() - lp); const e = Math.sin(Math.PI * Math.min(1, x / (t1 - t0))); return 0.18 * lp * e; });
  if (r.follower) { pop(r.tHold + .45); [523.3, 659.3, 784, 1046.5].forEach((f, i) => add(r.tHold + .5 + i * .12, .8, (x) => .14 * Math.sin(2 * Math.PI * f * x) * Math.exp(-x * 3.5))); }
}
let mx = 0; for (const v of A) mx = Math.max(mx, Math.abs(v)); const g = 0.92 / mx;
const b = Buffer.alloc(44 + N * 2); b.write('RIFF', 0); b.writeUInt32LE(36 + N * 2, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(SR, 24); b.writeUInt32LE(SR * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(N * 2, 40);
for (let i = 0; i < N; i++) b.writeInt16LE(Math.round(A[i] * g * 32767), 44 + i * 2); fs.writeFileSync(process.argv[2] || 'a.wav', b); console.log('audio', TL.TOTAL.toFixed(1));
