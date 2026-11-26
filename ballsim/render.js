// Render one Physics Royale video. usage: node ballsim/render.js <out.mp4> [format] [seed]
// formats: country (circle battle) · floors (neon towers race) · rings (break free) · breakout (brick ASMR) · hex (1 escape = 2 balls) · mix (random)
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('child_process');
const fs = require('fs'), path = require('path');
const OUT = path.resolve(process.argv[2] || 'ball.mp4'), FPS = 30, SR = 44100; let SEED = Number(process.argv[4]) || 0;
const HM = process.env.HMODE ? { mode: Number(process.env.HMODE) } : {};
const FORMATS = ['country', 'floors', 'rings', 'breakout', 'hex', 'overflow', 'lastin', 'grow', 'takeover', 'plinko', 'race', 'quizgrid', 'quiztrack', 'quizmissing', 'quizflag', 'hypno', 'follow', 'oddone'];
let FMT = process.argv[3] || 'country'; if (!FORMATS.includes(FMT)) FMT = FORMATS[Math.floor(Math.random() * FORMATS.length)];
const PAGE = FMT === 'country' ? 'sim.html' : FMT + '.html';

function synth(events, dur) {   // all sound made in code: ticks, thuds, pops, win fanfare, soft pad
  const N = Math.ceil(dur * SR), a = new Float32Array(N);
  const add = (t0, len, fn) => { const s = Math.floor(t0 * SR); for (let i = 0; i < len * SR && s + i < N; i++) a[s + i] += fn(i / SR); };
  let seed = 1; const rn = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
  // soft ambient pad (two detuned sines, very quiet)
  for (let i = 0; i < N; i++) { const t = i / SR; a[i] += 0.025 * Math.sin(2 * Math.PI * 110 * t) * (0.6 + 0.4 * Math.sin(t * 0.5)) + 0.02 * Math.sin(2 * Math.PI * 164.8 * t); }
  let lastTick = -1;
  for (const e of events) {
    const t = e.f / FPS;
    if (e.k === 'pad') { const roots = [[220, 277.2, 329.6], [196, 246.9, 293.7], [174.6, 220, 261.6], [196, 261.6, 329.6]][e.n % 4]; add(t, 4.4, (x) => { const env = Math.min(1, x / 1.2) * Math.min(1, (4.4 - x) / 1.2); return 0.07 * env * roots.reduce((s, f) => s + Math.sin(2 * Math.PI * f * x) + 0.3 * Math.sin(2 * Math.PI * f * 2 * x + Math.sin(x * 3)), 0) * (0.8 + 0.2 * Math.sin(x * 4)); }); continue; }
    if (e.k === 'chime') { const f = 880 * Math.pow(2, [0, 3, 5, 7, 10][e.n % 5] / 12); add(t, 1.6, (x) => 0.05 * Math.sin(2 * Math.PI * f * x) * Math.exp(-x * 2.2)); continue; }
    if (e.k === 'note') { const f = 523.25 * Math.pow(2, [0, 2, 4, 7, 9][e.n % 5] / 12 + Math.floor(e.n / 5) / 2); add(t, 0.5, (x) => 0.2 * (Math.sin(2 * Math.PI * f * x) + 0.3 * Math.sin(4 * Math.PI * f * x)) * Math.exp(-x * 7)); continue; }
    if (e.k === 'swoosh') { const L = 0.18 + 0.32 * (e.d || 1); let lp = 0; add(t, L, (x) => { lp += 0.18 * (rn() - lp); const env = Math.sin(Math.PI * Math.min(1, x / L)); return 0.22 * lp * env * env; }); continue; }
    if (e.k === 'hit' && e.soft) { add(t, 0.08, (x) => 0.2 * Math.sin(2 * Math.PI * 220 * x) * Math.exp(-x * 40)); continue; }
    if (e.k === 'tick') { if (t - lastTick < 0.035) continue; lastTick = t; const f = 900 * (e.p || 1); add(t, 0.06, (x) => 0.16 * Math.sin(2 * Math.PI * f * x) * Math.exp(-x * 70)); }
    else if (e.k === 'hit') add(t, 0.14, (x) => 0.35 * (Math.sin(2 * Math.PI * (140 - 300 * x) * x) * Math.exp(-x * 25) + 0.4 * rn() * Math.exp(-x * 60)));
    else if (e.k === 'pop') add(t, 0.5, (x) => 0.5 * (rn() * Math.exp(-x * 12) * 0.6 + Math.sin(2 * Math.PI * (300 + 500 * Math.exp(-x * 8)) * x) * Math.exp(-x * 9)));
    else if (e.k === 'win') [523.3, 659.3, 784, 1046.5].forEach((f, i) => add(t + 0.4 + i * 0.14, 0.9, (x) => 0.22 * Math.sin(2 * Math.PI * f * x) * Math.exp(-x * 3) * (1 + 0.3 * Math.sin(2 * Math.PI * 6 * x))));
  }
  let mx = 0; for (const v of a) mx = Math.max(mx, Math.abs(v)); const g = mx > 0.95 ? 0.95 / mx : 1;
  const buf = Buffer.alloc(44 + N * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 2, 4); buf.write('WAVEfmt ', 8); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(N * 2, 40);
  for (let i = 0; i < N; i++) buf.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(a[i] * g * 32767))), 44 + i * 2);
  return buf;
}

(async () => {
  const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] }); const pg = await br.newPage({ viewport: { width: 1080, height: 1920 } });
  await pg.goto('file://' + path.join(__dirname, PAGE)); await pg.evaluate(([b, k]) => { window.BRAND = b; window.SKIN = k; }, [process.env.BRAND || '', Number(process.env.SKIN || 0)]); await pg.addScriptTag({ path: path.join(__dirname, 'theme.js') }); await pg.addScriptTag({ path: path.join(__dirname, 'kintext.js') });
  await pg.evaluate(async () => { if (window.FONTS) await window.FONTS; await document.fonts.ready; });
  const [D0, D1] = await pg.evaluate(() => window.DUR || [35, 55]);
  if (!SEED) for (let k = 0; k < 40; k++) {   // pick a seed whose video lasts D0-D1 s and ends properly (dry run, no drawing)
    const sd = 1 + Math.floor(Math.random() * 1e6); await pg.evaluate((s) => window.init(s), { seed: sd, n: 7, ...HM });
    const r = await pg.evaluate((max) => { let f = 0, r; for (; f < max; f++) { r = window.frame(true); if (r.done) break; } return { f, ok: r.ok !== false }; }, FPS * 80);
    const sec = r.f / FPS; console.log('try', sd, sec.toFixed(1), r.ok);
    if (sec >= D0 && sec <= D1 + 5 && (r.ok || k > 25)) { SEED = sd; break; } SEED = sd;
  }
  await pg.evaluate((s) => window.init(s), { seed: SEED, n: 7, ...HM });
  const vid = OUT.replace(/\.mp4$/, '.v.mp4');
  const enc = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', vid], { stdio: ['pipe', 'inherit', 'inherit'] });
  const events = []; let f = 0, HOOK_F = null;
  for (; f < FPS * 80; f++) {
    const r = await pg.evaluate(() => window.frame());
    events.push(...r.ev); if (HOOK_F === null && r.ph >= 3) HOOK_F = f;   // overflow: first frame of "STILL SPLITTING!" (the packed arena)
    const ok = enc.stdin.write(Buffer.from(r.img.split(',')[1], 'base64')); if (!ok) await new Promise((x) => enc.stdin.once('drain', x));
    if (r.done) break;
  }
  enc.stdin.end(); await new Promise((r) => enc.on('close', r)); await br.close();
  let dur = (f + 1) / FPS; const wav = OUT.replace(/\.mp4$/, '.wav'); fs.writeFileSync(wav, synth(events, dur));
  // OVERFLOW hook: open with a 2 s glimpse of the packed arena (looks like the maximum)… then cut back to 1 ball. The real ending goes way beyond it.
  if (FMT === 'overflow' && HOOK_F !== null) {
    const tp = Math.max(0, HOOK_F / FPS + 0.4).toFixed(2), te = (Number(tp) + 2).toFixed(2), tmp = OUT.replace(/\.mp4$/, '.h.mp4'), tw = OUT.replace(/\.mp4$/, '.h.wav');
    execFileSync('ffmpeg', ['-y', '-v', 'error', '-ss', tp, '-t', '2', '-i', vid, '-i', vid, '-ss', tp, '-t', '2', '-i', wav, '-i', wav, '-filter_complex',   // separate inputs → no huge frame buffering
      `[0:v]setpts=PTS-STARTPTS,fade=t=out:st=1.8:d=0.2:color=white[hv];[1:v]fade=t=in:st=0:d=0.25:color=white[mv];[hv][mv]concat=n=2:v=1:a=0[v];` +
      `[2:a]asetpts=PTS-STARTPTS,afade=t=out:st=1.7:d=0.3[ha];[ha][3:a]concat=n=2:v=0:a=1[a]`,
      '-map', '[v]', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', tmp, '-map', '[a]', tw]);
    fs.renameSync(tmp, vid); fs.renameSync(tw, wav); dur += 2; console.log('overflow hook from', tp);
  }
  // 2.6 s end card: freeze last frame, dim it, ask for a comment + follow (this is what turns viewers into followers)
  const END = 2.6, D = dur.toFixed(2), FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
  const L = FMT === 'country' ? ['COMMENT YOUR COUNTRY', 'IT JOINS THE NEXT BATTLE', 'FOLLOW FOR TOMORROW'] : FMT === 'overflow' ? ['DID YOU GUESS THE NUMBER?', 'COMMENT YOUR GUESS', 'FOLLOW FOR PART 2'] : ['quizgrid', 'quiztrack', 'quizmissing', 'quizflag'].includes(FMT) ? ['DID YOU GET IT?', 'COMMENT YOUR ANSWER', 'FOLLOW FOR DAILY TESTS'] : ['lastin', 'race', 'takeover', 'plinko'].includes(FMT) ? ['WAS IT YOUR PICK?', 'COMMENT YOUR PICK', 'FOLLOW FOR THE REMATCH'] : ['DID YOU GUESS RIGHT?', 'COMMENT YOUR PICK', 'FOLLOW FOR PART 2'];
  let ding = null; try { const LIB = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'sfx', 'library.json'), 'utf8')).filter((x) => x.cat === 'ding'); if (LIB.length) ding = path.join(__dirname, '..', LIB[SEED % LIB.length].file); } catch (e) {}
  const dt = (t, y, size, col) => `drawtext=fontfile=${FONT}:text='${t}':fontsize=${size}:fontcolor=${col}:x=(w-text_w)/2:y=${y}:enable='gte(t,${D})'`;
  const vf = `[0:v]tpad=stop_mode=clone:stop_duration=${END},drawbox=x=0:y=1470:w=iw:h=450:color=black@0.8:t=fill:enable='gte(t,${D})',${dt(L[0], 1510, 62, 'white')},${dt(L[1], 1595, 50, '0xffd23f')},drawbox=x=110:y=1690:w=860:h=125:color=0xff2d55@1:t=fill:enable='gte(t,${D})',${dt(L[2], 1724, 60, 'white')}[v]`;
  const af = ding ? `[1:a]apad=pad_dur=${END}[a1];[2:a]adelay=${Math.round(dur * 1000)}|${Math.round(dur * 1000)},volume=0.6[a2];[a1][a2]amix=inputs=2:duration=first:normalize=0[a]` : `[1:a]apad=pad_dur=${END}[a]`;
  const OWN_END = ['follow', 'oddone'].includes(FMT);   // these pages draw their own question/CTA ending
  try {
    if (OWN_END) throw new Error('own ending');
    execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', vid, '-i', wav, ...(ding ? ['-i', ding] : []), '-filter_complex', vf + ';' + af, '-map', '[v]', '-map', '[a]', '-t', (dur + END).toFixed(2), '-c:v', 'libx264', '-preset', 'medium', '-crf', '21', '-maxrate', '5500k', '-bufsize', '11M', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', OUT]);
  } catch (e) { if (!OWN_END) console.log('end card failed, plain mux', e.message);
    execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', vid, '-i', wav, '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-shortest', '-movflags', '+faststart', OUT]); }
  fs.unlinkSync(vid); fs.unlinkSync(wav);
  console.log('done', OUT, 'format', FMT, 'seed', SEED, 'sec', dur.toFixed(1), 'events', events.length);
})().catch((e) => { console.error(e); process.exit(1); });
