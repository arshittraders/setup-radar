// Kanjoos 3D reel render. FULL=voice.mp3 SEGS=segs.json [F0= F1=] [MODE=audio] node render.js x bg.png out.mp4
// env GLB (served file name, default ku.glb), INS_DIR (folder with bill/fan/ac .png), TITLE
const fs = require('fs'), cp = require('child_process'), path = require('path');
const SFX = require(path.join(__dirname, '..', 'sfx', 'sfx.js'));
const [, BG, OUT] = process.argv.slice(2); const FPS = 30, SR = 44100;
const S = JSON.parse(fs.readFileSync(path.join(__dirname, 'script.json')));
const dur = f => +cp.execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${f}"`).toString();
const LEAD = 0.3, TAIL = 0.8;
const segs = JSON.parse(fs.readFileSync(process.env.SEGS));
const tl = segs.map((g, i) => ({ ...S[i], start: g[0] + LEAD, end: g[1] + LEAD, cap: S[i].cap || S[i].text }));
const total = dur(process.env.FULL) + LEAD + TAIL, N = Math.ceil(total * FPS);
// ---- audio: voice + CC0 sfx + code-made bouncy music bed (ducked under voice) ----
function buildAudio() {
  const raw = cp.execSync(`ffmpeg -v error -i "${process.env.FULL}" -ac 1 -ar ${SR} -f s16le -`, { maxBuffer: 1 << 28 });
  const n = Math.ceil(total * SR), voice = new Float32Array(n), mix = new Float32Array(n), off = Math.round(LEAD * SR);
  for (let i = 0; i < raw.length / 2 && i + off < n; i++) voice[i + off] = raw.readInt16LE(i * 2) / 32768;
  // envelope for ducking
  const env = new Float32Array(n); let e = 0; for (let i = 0; i < n; i++) { const a = Math.abs(voice[i]); e = a > e ? a : e * 0.9997; env[i] = e; }
  // music: 112 bpm pizzicato-ish pluck + soft bass, C major (I–vi–IV–V)
  const bpm = 112, beat = 60 / bpm, chords = [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]], hz = m => 440 * Math.pow(2, (m - 69) / 12);
  const note = (t0, f, d, g, harm) => { const s0 = Math.floor(t0 * SR), L = Math.floor(d * SR); for (let i = 0; i < L && s0 + i < n; i++) { const tt = i / SR, a = Math.exp(-tt * (harm ? 9 : 5)) * g;
    mix[s0 + i] += a * (Math.sin(2 * Math.PI * f * tt) + (harm ? 0.35 * Math.sin(4 * Math.PI * f * tt) + 0.15 * Math.sin(6 * Math.PI * f * tt) : 0)); } };
  for (let b = 0, t = 0; t < total; b++, t = b * beat / 2) { const ch = chords[Math.floor(b / 8) % 4], st = b % 8;
    if (st % 2 === 0) note(t, hz(ch[0] - 24), beat * 0.9, 0.16, false);
    const pat = [0, 2, 1, 2, 0, 1, 2, 1]; if (st !== 3 && st !== 7) note(t, hz(ch[pat[st]] + 12), beat * 0.45, 0.07, true); }
  for (let i = 0; i < n; i++) { const duck = 1 - Math.min(0.72, env[i] * 3); mix[i] *= 0.5 * duck; }
  // fade music in/out
  for (let i = 0; i < n; i++) { const t = i / SR; mix[i] *= Math.min(1, t / 0.4, (total - t) / 0.6); mix[i] += voice[i]; }
  tl.forEach((L, li) => (L.sfx || []).forEach((x, k) => SFX.place(mix, SR, L.start + (L.end - L.start) * x.at, x.cat, x.n ?? (li + k), x.g ?? 0.3, x.cat === 'whoosh' ? 0.25 : 0)));
  SFX.place(mix, SR, 0.05, 'whoosh', 0, 0.25, 0); // title
  let pk = 0; for (let i = 0; i < n; i++) pk = Math.max(pk, Math.abs(mix[i])); const buf = Buffer.alloc(n * 2), g = pk > 0.98 ? 0.98 / pk : 1;
  for (let i = 0; i < n; i++) buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, mix[i] * g)) * 32767), i * 2);
  fs.writeFileSync('mix.raw', buf); cp.execSync(`ffmpeg -v error -y -f s16le -ar ${SR} -ac 1 -i mix.raw -af loudnorm=I=-14:TP=-1.5 -ar ${SR} voice.wav`); fs.unlinkSync('mix.raw');
  // mouth amplitude per frame from the VOICE only
  const spf = SR / FPS, A = []; for (let k = 0; k < N; k++) { let s = 0, c = 0; for (let j = Math.floor(k * spf); j < Math.min(n, (k + 1) * spf); j++) { s += voice[j] * voice[j]; c++; } A.push(c ? Math.sqrt(s / c) : 0); }
  const mx = A.slice().sort((a, b) => a - b)[Math.floor(N * 0.97)] || 1; const B = A.map(a => Math.min(1, a / mx)); for (let k = 1; k < N; k++) B[k] = Math.max(B[k], B[k - 1] * 0.55); return B;
}
const A = buildAudio();
if (process.env.MODE === 'audio') { console.log('frames total', N); process.exit(0); }
(async () => { const { chromium } = require('playwright'); const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const pg = await br.newPage({ viewport: { width: 1080, height: 1920 } }); pg.on('pageerror', e => console.log('ERR', e.message));
  await pg.goto('http://localhost:8765/page.html'); await pg.waitForFunction('window.ready');
  const ins = {}; const ID = process.env.INS_DIR || 'ins'; for (const k of ['bill', 'fan', 'ac']) if (fs.existsSync(path.join(__dirname, ID, k + '.png'))) ins[k] = `/${ID}/${k}.png`;
  await pg.evaluate(c => setup(c), { glb: '/' + (process.env.GLB || 'ku.glb'), bg: '/' + BG, timeline: tl, inserts: ins, faceYaw: 0.25, mouth: [0, 0.065, 0.12], mscale: 560, title: process.env.TITLE || 'KANJOOS UNCLE', titleDur: 2.2 });
  const F0 = +(process.env.F0 || 0), F1 = Math.min(N, process.env.F1 ? +process.env.F1 : N), CH = !!process.env.F1;
  const ff = cp.spawn('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-', ...(CH ? [] : ['-i', 'voice.wav']), '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', ...(CH ? ['-an'] : ['-c:a', 'aac', '-b:a', '160k', '-shortest']), '-movflags', '+faststart', OUT], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let k = F0; k < F1; k++) { const u = await pg.evaluate(([a, b]) => frame(a, b), [k / FPS, A[k]]);
    if (!ff.stdin.write(Buffer.from(u.slice(23), 'base64'))) await new Promise(r => ff.stdin.once('drain', r)); if ((k - F0) % 60 == 0) console.log('frame', k, F0, F1, ((Date.now() - t0) / 1000).toFixed(0) + 's'); }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); await br.close(); console.log('done', OUT, total.toFixed(1) + 's', 'frames', F0, F1, 'of', N);
})();
