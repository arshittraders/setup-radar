// timeline + voice track + music, then frames → mp4.  node build.js [testTimes]
const { chromium } = require('playwright'); const SFX = require('/home/claude/setup-radar/sfx/sfx.js'); const { spawn, execFileSync } = require('child_process'); const fs = require('fs'), path = require('path');
const FPS = 30, SR = 44100, EP = process.argv[2], D = __dirname + '/' + EP, TEST = process.argv[3];
const OUT = { he01: 'history-ek-min-01-qutub', he02: 'history-ek-min-02-konark', he03: 'history-ek-min-03-taj', gg05: 'gupt-gyan-05-dwarka', gg06: 'gupt-gyan-06-iron-pillar', gg07: 'gupt-gyan-07-roswell', gg08: 'gupt-gyan-08-stonehenge' }[EP];
fs.mkdirSync(D + '/proc', { recursive: true });
const lines = JSON.parse(fs.readFileSync((EP.startsWith('he') ? '/home/claude/setup-radar/heb/eps.json' : '/home/claude/setup-radar/ggb/eps.json'), 'utf8'))[EP];
lines.forEach((_, i) => { const n = String(i).padStart(2, '0'); execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', `${__dirname}/v/${EP}_l${n}.mp3`, '-af', 'silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse', '-ar', '44100', '-ac', '1', `${D}/proc/l${n}.wav`]); });
const dur = (f) => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString());
let t = 0.6; const T = []; const parts = [];
lines.forEach((tx, i) => { const f = `${D}/proc/l${String(i).padStart(2, '0')}.wav`, d = dur(f); const gap = i === lines.length - 2 ? 0.9 : 0.45;
  T.push({ start: i ? t - gap * 0.5 : 0, vstart: t, vend: t + d, text: tx }); parts.push([f, t]); t += d + gap; });
const TOTAL = +(T[T.length - 1].vend + 2.6).toFixed(2);
T.forEach((s, i) => (s.end = i < T.length - 1 ? T[i + 1].start : TOTAL));
fs.writeFileSync(D + '/T.json', JSON.stringify(T));
console.log('total', TOTAL, T.map((s) => s.start.toFixed(2) + '-' + s.vend.toFixed(2)).join(' '));
function wav(a) { const N = a.length, b = Buffer.alloc(44 + N * 2); b.write('RIFF', 0); b.writeUInt32LE(36 + N * 2, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(SR, 24); b.writeUInt32LE(SR * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(N * 2, 40);
  let mx = 0; for (const v of a) mx = Math.max(mx, Math.abs(v)); const g = mx > .95 ? .95 / mx : 1; for (let i = 0; i < N; i++) b.writeInt16LE(Math.round(a[i] * g * 32767), 44 + i * 2); return b; }
function music() { if (!EP.startsWith('he')) return musicDark();
  const N = Math.ceil(TOTAL * SR), a = new Float32Array(N); let sd = 5; const rn = () => ((sd = (sd * 16807) % 2147483647) / 2147483647) * 2 - 1;
  const add = (t0, len, fn) => { const s = Math.floor(t0 * SR); for (let i = 0; i < len * SR && s + i < N; i++) if (s + i >= 0) a[s + i] += fn(i / SR); };
  const BPM = 112, B = 60 / BPM, bars = Math.ceil(TOTAL / (B * 4)) + 1;
  const chords = [[146.8, 185, 220], [130.8, 164.8, 196], [116.5, 146.8, 174.6], [130.8, 164.8, 196]];   // D, C, Bb, C  (bright, heroic)
  for (let br = 0; br < bars; br++) { const t0 = br * 4 * B, ch = chords[br % 4];
    for (let k = 0; k < 4; k++) { const tk = t0 + k * B; add(tk, .35, (x) => .42 * Math.sin(2 * Math.PI * (55 + 90 * Math.exp(-x * 30)) * x) * Math.exp(-x * 9));            // kick
      if (k % 2) add(tk, .18, (x) => .16 * rn() * Math.exp(-x * 22));                                                                                                         // snare-ish
      add(tk + B / 2, .05, (x) => .05 * rn() * Math.exp(-x * 90)); add(tk, .04, (x) => .035 * rn() * Math.exp(-x * 120));                                                    // hats
      add(tk, B * .9, (x) => .07 * Math.sin(2 * Math.PI * ch[0] / 2 * x) * Math.exp(-x * 2.2));                                                                               // bass
      [0, 1, 2].forEach((n, m) => add(tk + m * B / 3, B / 3, (x) => .045 * Math.sin(2 * Math.PI * ch[n] * 2 * x) * Math.exp(-x * 7)));                                        // pluck arp
    }
    add(t0, 4 * B, (x) => .022 * (Math.sin(2 * Math.PI * ch[1] * x) + Math.sin(2 * Math.PI * ch[2] * x)) * Math.min(1, x * 2));                                              // pad
  }
  T.forEach((s, i) => { if (i) { if (!SFX.place(a, SR, s.start, 'whoosh', i, .55, .35)) add(s.start - .3, .35, (x) => .12 * rn() * (x / .35));
    if (!SFX.place(a, SR, s.start, i === T.length - 1 ? 'impact' : 'drum', i, i === T.length - 1 ? .6 : .3)) add(s.start, 1.2, (x) => .25 * Math.sin(2 * Math.PI * (45 + 40 * Math.exp(-x * 8)) * x) * Math.exp(-x * 3)); } });
  SFX.place(a, SR, 0.05, 'riser', 1, .25); SFX.place(a, SR, TOTAL - 1.4, 'ding', 2, .35);   // intro lift + outro ding
  for (let i = 0; i < N; i++) { const tt = i / SR; a[i] *= Math.min(1, tt / 1.5) * Math.min(1, (TOTAL - tt) / 1.5); }
  return a; }
function musicDark() { // dark cinematic bed: low drone + pad + boom hits on cuts + riser before the VS + heartbeat under the reveal
  const N = Math.ceil(TOTAL * SR), a = new Float32Array(N); let sd = 9; const rn = () => ((sd = (sd * 16807) % 2147483647) / 2147483647) * 2 - 1;
  const add = (t0, len, fn) => { const s = Math.floor(t0 * SR); for (let i = 0; i < len * SR && s + i < N; i++) if (s + i >= 0) a[s + i] += fn(i / SR); };
  for (let i = 0; i < N; i++) { const tt = i / SR, env = Math.min(1, tt / 3) * Math.min(1, (TOTAL - tt) / 2);
    a[i] += env * (0.10 * Math.sin(2 * Math.PI * 55 * tt) + 0.06 * Math.sin(2 * Math.PI * 82.4 * tt + Math.sin(tt * .3)) + 0.035 * Math.sin(2 * Math.PI * 110.6 * tt) * (0.5 + 0.5 * Math.sin(tt * .7)) + 0.025 * Math.sin(2 * Math.PI * 164.8 * tt) * (0.5 + 0.5 * Math.sin(tt * .45 + 1))); }
  let lp = 0; const boom = (t0, g = 1) => { add(t0, 2.2, (x) => g * 0.55 * Math.sin(2 * Math.PI * (38 + 60 * Math.exp(-x * 6)) * x) * Math.exp(-x * 1.8)); add(t0 - .35, .45, (x) => { lp += .06 * (rn() - lp); return g * .5 * lp * Math.sin(Math.PI * x / .45); }); };
  T.forEach((s, i) => { if (i) { boom(s.start, i === T.length - 1 ? 1.1 : .55); SFX.place(a, SR, s.start, 'whoosh', i + 3, .45, .35); SFX.place(a, SR, s.start, i === T.length - 1 ? 'gong' : 'impact', i, i === T.length - 1 ? .5 : .35); } });
  SFX.place(a, SR, 0.1, 'horror', 1, .3);
  const r0 = T[T.length - 1].start - 2.2; add(r0, 2.2, (x) => 0.12 * (x / 2.2) * (Math.sin(2 * Math.PI * (200 + 500 * x * x) * x) + .6 * rn()));
  const s6 = T[6].start; for (let k = 0; k < 6; k++) { add(s6 + k * .8, .25, (x) => .35 * Math.sin(2 * Math.PI * 50 * x) * Math.exp(-x * 18)); add(s6 + k * .8 + .22, .25, (x) => .25 * Math.sin(2 * Math.PI * 46 * x) * Math.exp(-x * 18)); }
  T.forEach((s, i) => { if (i === 6) [0, .5, 1].forEach((o, j) => add(s.vstart + .8 + o, 1.6, (x) => .12 * Math.sin(2 * Math.PI * [1318, 1568, 1975][j] * x) * Math.exp(-x * 2.5))); });
  return a; }
function voice() { const N = Math.ceil(TOTAL * SR), a = new Float32Array(N); for (const [f, t0] of parts) { const raw = execFileSync('ffmpeg', ['-v', 'error', '-i', f, '-f', 's16le', '-ac', '1', '-ar', String(SR), '-'], { maxBuffer: 1 << 28 }); const s = Math.floor(t0 * SR); for (let i = 0; i < raw.length / 2 && s + i < N; i++) a[s + i] += raw.readInt16LE(i * 2) / 32768; } return a; }
(async () => {
  const br = await chromium.launch(); const pg = await br.newPage({ viewport: { width: 1080, height: 1920 } });
  await pg.goto('file://' + D + '/s.html'); await pg.evaluate((T) => (window.T = T), T); await pg.evaluate(() => document.fonts.ready);
  if (TEST) { for (const tt of TEST.split(',').map(Number)) { await pg.evaluate((x) => window.render(x), tt); await pg.screenshot({ path: `${D}/f_${tt}.jpg`, type: 'jpeg', quality: 70 }); } await br.close(); return; }
  const vid = D + '/v.mp4'; const enc = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', vid], { stdio: ['pipe', 'inherit', 'inherit'] });
  const NF = Math.round(TOTAL * FPS); for (let f = 0; f < NF; f++) { await pg.evaluate((x) => window.render(x), f / FPS); const img = await pg.screenshot({ type: 'jpeg', quality: 90 }); if (!enc.stdin.write(img)) await new Promise((r) => enc.stdin.once('drain', r)); }
  enc.stdin.end(); await new Promise((r) => enc.on('close', r)); await br.close();
  fs.writeFileSync(D + '/m.wav', wav(music())); fs.writeFileSync(D + '/vo.wav', wav(voice()));
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', vid, '-i', D + '/vo.wav', '-i', D + '/m.wav', '-filter_complex',
    (EP.startsWith('he') ? '[1:a]highpass=f=130,equalizer=f=3000:t=q:w=1.2:g=3,loudnorm=I=-14:TP=-1.2,asplit[v1][v2];[2:a]volume=0.7[m];' : '[1:a]loudnorm=I=-14:TP=-1.2,asplit[v1][v2];[2:a]volume=0.55[m];') + '[m][v1]sidechaincompress=threshold=0.04:ratio=5:attack=15:release=350[md];[v2][md]amix=inputs=2:normalize=0:duration=first[a]',
    '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', __dirname + '/../' + OUT + '.mp4']);
  console.log('done');
})().catch((e) => { console.error(e); process.exit(1); });
