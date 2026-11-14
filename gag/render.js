// Original 2D physical-comedy gag short (no dialogue). usage: node gag/render.js <outdir>
const fs = require('fs'), path = require('path'), { execFileSync, spawn } = require('child_process');
const { chromium } = require('playwright');
const out = path.resolve(process.argv[2] || 'gagjob'); fs.mkdirSync(out, { recursive: true });
const W = p => path.join(out, p), ff = a => execFileSync('ffmpeg', ['-y', '-v', 'error', ...a]);
const FPS = 30, TOTAL = 10.0, B = { grab: 2.2, yank: 3.6, splat: 5.7, grin: 7.6 };
const src = (e, d, o) => ff(['-f', 'lavfi', '-i', `aevalsrc='${e}':s=44100:d=${d}`, '-ac', '1', o]);
// playful music: plucky marimba arpeggio C-F-G-C at 120bpm
const P = 0.5, prog = [[261.6, 329.6, 392], [349.2, 440, 523.3], [392, 493.9, 587.3], [261.6, 329.6, 392]];
const pick = j => `if(eq(ld(0),0),${prog[0][j]},if(eq(ld(0),1),${prog[1][j]},if(eq(ld(0),2),${prog[2][j]},${prog[3][j]})))`;
src(`st(0,mod(floor(t/(4*${P})),4));st(1,mod(floor(t/(${P}/2)),3));st(2,if(eq(ld(1),0),${pick(0)},if(eq(ld(1),1),${pick(1)},${pick(2)})));st(3,mod(t,${P}/2));0.22*sin(2*PI*ld(2)*t)*exp(-9*ld(3))+0.1*sin(4*PI*ld(2)*t)*exp(-14*ld(3))+0.18*sin(2*PI*${pick(0)}/4*t)*exp(-5*mod(t,${P}))`, TOTAL, W('mus_r.wav'));
ff(['-i', W('mus_r.wav'), '-af', `volume='if(between(t,${B.grab},${B.splat}),0.15,if(lt(t,${B.grin}),0.6,1))':eval=frame,afade=t=out:st=${TOTAL - 0.8}:d=0.8`, W('music.wav')]);
src(`0.5*(2*random(0)-1)*(0.55+0.45*sin(2*PI*22*t))*min(1,t*3)`, (B.yank - B.grab).toFixed(2), W('drum_r.wav'));
ff(['-i', W('drum_r.wav'), '-af', 'bandpass=f=220:w=300,volume=2.2', W('drum.wav')]);
src(`0.6*(2*random(0)-1)*exp(-3*t)`, 1.6, W('cym_r.wav')); ff(['-i', W('cym_r.wav'), '-af', 'highpass=f=5000,volume=1.1', W('cym.wav')]);
src(`0.35*(2*random(0)-1)*sin(PI*t/0.35)`, 0.35, W('wh_r.wav')); ff(['-i', W('wh_r.wav'), '-af', 'bandpass=f=1400:w=1600,volume=3', W('whoosh.wav')]);
src(`(0.5*(2*random(0)-1)*exp(-18*t)+0.25*sin(2*PI*2400*t)*exp(-12*t)+0.2*sin(2*PI*3300*t)*exp(-15*t))`, 0.8, W('crash_r.wav')); ff(['-i', W('crash_r.wav'), '-af', 'highpass=f=900,volume=1.4', W('crash.wav')]);
src(`0.9*sin(2*PI*(70*t+30*(1-exp(-20*t))))*exp(-10*t)+0.6*(2*random(0)-1)*exp(-14*t)`, 0.7, W('splat_r.wav')); ff(['-i', W('splat_r.wav'), '-af', 'lowpass=f=1300,volume=2.2', W('splat.wav')]);
src(`0.45*sin(2*PI*(300*t+500*t*t))*exp(-3*t)`, 0.6, W('boing_r.wav')); ff(['-i', W('boing_r.wav'), '-af', 'vibrato=f=12:d=0.4,volume=1.4', W('boing.wav')]);
src(`0.25*sin(2*PI*(220-120*t)*t)*exp(-0.8*t)`, 1.4, W('slo_r.wav')); ff(['-i', W('slo_r.wav'), '-af', 'volume=1.5', W('slomo.wav')]);
const sfx = [['music.wav', 0], ['drum.wav', B.grab], ['cym.wav', B.yank], ['whoosh.wav', B.yank], ['slomo.wav', B.yank + 0.3], ['crash.wav', 4.75], ['crash.wav', 5.15], ['splat.wav', B.splat], ['boing.wav', B.grin]];
const inputs = [], filt = [];
sfx.forEach(([f, at], i) => { inputs.push('-i', W(f)); filt.push(`[${i}:a]aresample=44100,adelay=${Math.round(at * 1000)}[x${i}]`); });
filt.push(sfx.map((_, i) => `[x${i}]`).join('') + `amix=inputs=${sfx.length}:normalize=0,alimiter=limit=0.95[a]`);
ff([...inputs, '-filter_complex', filt.join(';'), '-map', '[a]', '-t', String(TOTAL), '-ac', '2', '-c:a', 'aac', '-b:a', '192k', W('audio.m4a')]);
(async () => {
  const br = await chromium.launch(); const pg = await br.newPage({ viewport: { width: 1080, height: 1920 } });
  await pg.goto('file://' + path.join(__dirname, 'tpl.html')); await pg.evaluate(() => document.fonts.ready);
  const enc = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-i', W('audio.m4a'), '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-shortest', '-movflags', '+faststart', W('gag.mp4')], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let f = 0; f < TOTAL * FPS; f++) { await pg.evaluate(x => window.render(x), f / FPS); const b = await pg.screenshot({ type: 'jpeg', quality: 92 }); if (!enc.stdin.write(b)) await new Promise(r => enc.stdin.once('drain', r)); }
  enc.stdin.end(); await new Promise((r, j) => enc.on('close', c => c ? j(new Error('ffmpeg ' + c)) : r())); await br.close(); console.log('ok', W('gag.mp4'));
})().catch(e => { console.error(e); process.exit(1); });
