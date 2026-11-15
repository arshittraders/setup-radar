// Golu & Bunty funny reel renderer. usage: node toon/render.js <workdir with tn-<id>.mp3> [fontdir]
// writes <workdir>/out.mp4
const fs = require('fs'), path = require('path'), { execFileSync, spawn } = require('child_process');
const { chromium } = require('playwright');
const dir = path.resolve(process.argv[2] || 'tn'), FONTS = path.resolve(process.argv[3] || path.join(__dirname, 'fonts'));
const W = (p) => path.join(dir, p), ff = (a) => execFileSync('ffmpeg', ['-y', '-v', 'error', ...a]);
const S = JSON.parse(fs.readFileSync(fs.existsSync(path.join(dir, 'script.json')) ? path.join(dir, 'script.json') : path.join(__dirname, 'script.json'), 'utf8')), FPS = 30;
const dur = (f) => +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString().trim();

// ---------- voices: tighten, kid-like lift, loudness ----------
const PITCH = { G: 1.06, B: 1.04 }, TEMPO = { G: 1.17, B: 1.13 };
const lines = S.lines.filter((l) => l.who === 'G' || l.who === 'B');
for (const l of lines) {
  const p = PITCH[l.who], tp = TEMPO[l.who];
  ff(['-i', W(`tn-${l.id}.mp3`), '-af', `silenceremove=start_periods=1:start_threshold=-45dB:stop_periods=-1:stop_duration=0.3:stop_threshold=-45dB,aresample=44100,asetrate=${Math.round(44100 * p)},aresample=44100,atempo=${(tp / p).toFixed(4)},loudnorm=I=-15:TP=-1.5`, '-ac', '1', W(`v-${l.id}.wav`)]);
}
// laugh track: generated per run if laugh clips exist, else the saved asset
if (fs.existsSync(W('tn-lg1.mp3')) && fs.existsSync(W('tn-lg2.mp3')) && fs.existsSync(W('tn-lg3.mp3'))) ff(['-i', W('tn-lg1.mp3'), '-i', W('tn-lg2.mp3'), '-i', W('tn-lg3.mp3'), '-filter_complex',
  '[0]aresample=44100,volume=1[a];[1]aresample=44100,adelay=180,volume=0.9[b];[2]aresample=44100,adelay=350,volume=0.85[c];[a][b][c]amix=inputs=3:normalize=0,aecho=0.8:0.6:60|110:0.35|0.25,highpass=f=180,loudnorm=I=-18', '-ac', '1', '-t', '3.2', W('laugh.wav')]);
else ff(['-i', path.join(__dirname, 'assets', 'laugh.mp3'), '-ar', '44100', '-ac', '1', W('laugh.wav')]);
const LAUGH = Math.min(3.2, dur(W('laugh.wav')));

// ---------- timeline ----------
let t = 0.7; const T = [];
for (let i = 0; i < lines.length; i++) {
  const l = lines[i], d = dur(W(`v-${l.id}.wav`)), a = W(`v-${l.id}.wav`);
  const raw = fs.readFileSync(a), pcm = new Int16Array(raw.buffer, raw.byteOffset + 44, Math.floor((raw.length - 44) / 2));
  const env = []; const per = Math.round(44100 / FPS);
  for (let k = 0; k * per < pcm.length; k++) { let s = 0; const e = Math.min(pcm.length, (k + 1) * per); for (let j = k * per; j < e; j++) s += pcm[j] * pcm[j]; env.push(Math.sqrt(s / Math.max(1, e - k * per)) / 32768); }
  const mx = Math.max(...env) || 1;
  T.push({ ...l, t: +t.toFixed(3), d: +d.toFixed(3), env: env.map((x) => +Math.min(1, x / mx * 1.5).toFixed(2)) });
  const next = lines[i + 1];
  t += d + (l.laugh === 2 ? 1.5 : l.laugh ? 1.0 : 0.16) + (next && next.scene !== l.scene ? 0.35 : 0);
}
const TOTAL = +(t + 2.4).toFixed(2);
console.log('total', TOTAL);

// ---------- music + sfx (synthesized) ----------
const src = (e, d, o) => ff(['-f', 'lavfi', '-i', `aevalsrc='${e}':s=44100:d=${d}`, '-ac', '1', W(o)]);
const B = 60 / 116, prog = [[261.6, 329.6, 392], [220, 261.6, 329.6], [174.6, 220, 261.6], [196, 246.9, 293.7]];
const pk = (j) => `if(eq(ld(0),0),${prog[0][j]},if(eq(ld(0),1),${prog[1][j]},if(eq(ld(0),2),${prog[2][j]},${prog[3][j]})))`;
src(`st(0,mod(floor(t/(4*${B})),4));st(1,mod(t,${B}/2));st(2,mod(floor(t/(${B}/2)),4));` +
  `0.28*sin(2*PI*if(eq(ld(2),0),${pk(0)},if(eq(ld(2),1),${pk(1)},if(eq(ld(2),2),${pk(2)},${pk(1)})))*2*t)*exp(-12*ld(1))` +   // pizzicato
  `+0.25*sin(2*PI*${pk(0)}/2*t)*exp(-7*mod(t,${B}))` +                                                                       // bouncy bass
  `+0.12*(2*random(0)-1)*exp(-45*ld(1))` +                                                                                      // shaker
  `+0.35*sin(2*PI*(55+60*exp(-25*mod(t,2*${B})))*mod(t,2*${B}))*exp(-10*mod(t,2*${B}))`, TOTAL, 'mus_r.wav');                  // soft kick
const speech = T.map((l) => `between(t,${l.t},${(l.t + l.d).toFixed(2)})`).join('+');
ff(['-i', W('mus_r.wav'), '-af', `lowpass=f=6500,volume='if(${speech},0.22,0.6)':eval=frame,afade=t=in:d=0.4,afade=t=out:st=${TOTAL - 1.2}:d=1.2,loudnorm=I=-21`, W('music.wav')]);
src('0.55*sin(2*PI*(260*t+700*t*t))*exp(-3*t)', 0.55, 'bo_r.wav'); ff(['-i', W('bo_r.wav'), '-af', 'vibrato=f=14:d=0.5,volume=1.4', W('boing.wav')]);
src('0.8*sin(2*PI*(180*t))*exp(-25*t)+0.5*(2*random(0)-1)*exp(-30*t)', 0.25, 'tom1.wav'); src('0.8*sin(2*PI*(130*t))*exp(-22*t)+0.5*(2*random(0)-1)*exp(-30*t)', 0.3, 'tom2.wav');
src('0.5*(2*random(0)-1)*exp(-4*t)', 1.1, 'cym_r.wav'); ff(['-i', W('cym_r.wav'), '-af', 'highpass=f=6000,volume=1.2', W('cym.wav')]);
ff(['-i', W('tom1.wav'), '-i', W('tom2.wav'), '-i', W('cym.wav'), '-filter_complex', '[0]volume=1.2[a];[1]adelay=170,volume=1.2[b];[2]adelay=420[c];[a][b][c]amix=inputs=3:normalize=0', W('rimshot.wav')]);
src('0.4*sin(2*PI*(400*t+900*t*t-600*t*t*t))', 0.9, 'sl_r.wav'); ff(['-i', W('sl_r.wav'), '-af', 'afade=t=out:st=0.6:d=0.3,volume=1.2', W('slide.wav')]);
src('0.4*(2*random(0)-1)*sin(PI*t/0.4)', 0.4, 'wh_r.wav'); ff(['-i', W('wh_r.wav'), '-af', 'bandpass=f=1400:w=1800,volume=3', W('whoosh.wav')]);
src('0.4*sin(2*PI*1568*t)*exp(-4*t)+0.25*sin(2*PI*2093*t)*exp(-5*t)', 1.0, 'ding.wav');
const parts = [['music.wav', 0, 1]];
T.forEach((l) => {
  parts.push([`v-${l.id}.wav`, l.t, 1.15]);
  if (l.sfx) parts.push([l.sfx + '.wav', l.sfx === 'whoosh' ? Math.max(0, l.t - 0.25) : l.t + l.d - (l.sfx === 'rimshot' ? 0.05 : 0.1), 0.6]);
  if (l.laugh) parts.push(['laugh.wav', l.t + l.d + 0.08, l.laugh === 2 ? 0.7 : 0.42]);
});
const inp = [], fl = [];
parts.forEach(([f, at, v], i) => { inp.push('-i', W(f)); fl.push(`[${i}:a]aresample=44100,aformat=channel_layouts=mono,volume=${v},adelay=${Math.round(at * 1000)}[x${i}]`); });
fl.push(parts.map((_, i) => `[x${i}]`).join('') + `amix=inputs=${parts.length}:normalize=0,alimiter=limit=0.95[a]`);
ff([...inp, '-filter_complex', fl.join(';'), '-map', '[a]', '-t', String(TOTAL), '-ac', '2', '-c:a', 'aac', '-b:a', '192k', W('audio.m4a')]);
console.log('audio ok');

// ---------- frames ----------
(async () => {
  const tpl = fs.readFileSync(path.join(__dirname, 'tpl.html'), 'utf8').replace(/FONTDIR/g, 'file://' + FONTS);
  fs.writeFileSync(path.join(__dirname, '_page.html'), tpl);
  const br = await chromium.launch(); const pg = await br.newPage({ viewport: { width: 1080, height: 1920 } });
  await pg.goto('file://' + path.join(__dirname, '_page.html')); await pg.evaluate(() => document.fonts.ready);
  await pg.evaluate((d) => window.setup(d), { lines: T, total: TOTAL, hook: 0.7, title: S.title });
  const only = process.argv[4] ? process.argv[4].split(',').map(Number) : null;
  const enc = only ? null : spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-i', W('audio.m4a'), '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-shortest', '-movflags', '+faststart', W('out.mp4')], { stdio: ['pipe', 'inherit', 'inherit'] });
  const N = Math.round(TOTAL * FPS);
  for (let f = 0; f < N; f++) {
    if (only && !only.includes(f)) continue;
    await pg.evaluate((x) => window.render(x), f / FPS);
    const b = await pg.screenshot({ type: 'jpeg', quality: 90 });
    if (only) fs.writeFileSync(W(`chk-${f}.jpg`), b); else if (!enc.stdin.write(b)) await new Promise((r) => enc.stdin.once('drain', r));
  }
  if (enc) { enc.stdin.end(); await new Promise((r) => enc.on('close', r)); }
  await br.close(); fs.unlinkSync(path.join(__dirname, '_page.html')); console.log('done', W('out.mp4'));
})().catch((e) => { console.error(e); process.exit(1); });
