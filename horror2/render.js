// Free horror short renderer (code-drawn scenes, no AI images).
// usage: node horror2/render.js <job>   — needs <job>/story.json (plan with lines/scenes) + <job>/a<i>.wav per line → <job>/out.mp4 + thumb.jpg
const fs = require('fs'), path = require('path'), { execFileSync, spawn } = require('child_process');
const { chromium } = require('playwright');
const CAP = require('../shorts/captions');
const FPS = 30, job = path.resolve(process.argv[2]), W = (p) => path.join(job, p);
const P = JSON.parse(fs.readFileSync(W('story.json'), 'utf8'));
const ff = (args) => execFileSync('ffmpeg', ['-y', '-v', 'error', ...args]);
const dur = (f) => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString().trim());
const FX = {
  N: { tempo: 1.22, af: 'highpass=f=70,equalizer=f=140:t=q:w=1:g=4,acompressor=threshold=-20dB:ratio=3:makeup=3,aecho=0.8:0.5:45|90:0.18|0.1' },
  F: { tempo: 1.14, af: 'acompressor=threshold=-20dB:ratio=3:makeup=3,aecho=0.8:0.4:30:0.12' },
  M: { tempo: 1.14, af: 'acompressor=threshold=-20dB:ratio=3:makeup=3,aecho=0.8:0.4:30:0.12' },
  G: { tempo: 1.05, af: 'asetrate=44100*0.88,aresample=44100,vibrato=f=4:d=0.15,aecho=0.8:0.75:140|280|420:0.4|0.28|0.18,equalizer=f=200:t=q:w=1:g=4' },
};
const segs = P.lines.map((l) => ({ ...l }));
let t = 1.5; const knocks = [], steps = [], rings = [], whispers = []; const parts = [];
segs.forEach((g, i) => {
  const fx = FX[g.who] || FX.N, out = W(`v${i}.wav`);
  ff(['-i', W(`a${i}.wav`), '-af', `aresample=44100,silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,atempo=${fx.tempo},${fx.af},loudnorm=I=-15:TP=-1.5`, '-ac', '1', '-ar', '44100', out]);
  g.pre = i === 0 ? 0 : (g.scene !== segs[i - 1].scene ? 0.55 : 0.3); if (g.fx === 'knock' || g.fx === 'footsteps' || g.fx === 'phone') g.pre += 0.2;
  t += g.pre; g.start = t; g.end = t + dur(out); t = g.end;
  parts.push({ f: out, at: g.start });
  if (g.fx === 'knock') [0.15, 0.6, 1.05].forEach((k) => knocks.push(g.end + k));
  if (g.fx === 'footsteps') for (let k = 0; k < 6; k++) steps.push(g.start + k * 0.55);
  if (g.fx === 'phone') rings.push(g.start - 0.2);
  if (g.fx === 'whisper') whispers.push(g.start);
  if (g.fx === 'knock') t += 1.2;
});
const last = segs[segs.length - 1], sting = last.end + 0.05, TOTAL = sting + 0.85 + 3.6;
const lateT = segs[Math.floor(segs.length * 0.66)].start;

// sound design (synth) + real CC0 sounds from sfx library where available
const src = (expr, d, out) => ff(['-f', 'lavfi', '-i', `aevalsrc='${expr}':s=44100:d=${d}`, '-ac', '1', out]);
src(`0.22*sin(2*PI*41*t)+0.16*sin(2*PI*43.3*t)+0.08*sin(2*PI*82.5*t)*(0.5+0.5*sin(2*PI*0.13*t))+0.05*sin(2*PI*311*t)*(0.5+0.5*sin(2*PI*0.07*t))`, TOTAL.toFixed(2), W('drone_raw.wav'));
ff(['-i', W('drone_raw.wav'), '-f', 'lavfi', '-i', `anoisesrc=c=brown:a=0.05:d=${TOTAL.toFixed(2)}`, '-filter_complex', `[0][1]amix=inputs=2:normalize=0,lowpass=f=900,volume='if(lt(t,${lateT.toFixed(2)}),0.5,if(lt(t,${sting.toFixed(2)}),0.5+0.5*(t-${lateT.toFixed(2)})/${Math.max(1, sting - lateT).toFixed(2)},0.3))':eval=frame,afade=t=in:d=1.2,afade=t=out:st=${(TOTAL - 1.5).toFixed(2)}:d=1.5`, W('drone.wav')]);
src(`0.9*sin(2*PI*(80*t+40*(1-exp(-30*t))))*exp(-22*t)+0.35*(2*random(0)-1)*exp(-70*t)`, 0.45, W('knock_raw.wav'));
ff(['-i', W('knock_raw.wav'), '-af', 'lowpass=f=1500,aecho=0.8:0.6:60:0.25,volume=1.6', W('knock.wav')]);
src(`0.6*(2*random(0)-1)*exp(-40*t)+0.5*sin(2*PI*70*t)*exp(-30*t)`, 0.3, W('step_raw.wav'));
ff(['-i', W('step_raw.wav'), '-af', 'lowpass=f=700,aecho=0.8:0.5:80:0.3,volume=1.4', W('step.wav')]);
src(`0.25*(sin(2*PI*440*t)+sin(2*PI*480*t))*if(lt(mod(t,3),1.6),1,0)`, 3.2, W('ring.wav'));
src(`0.15*(2*random(0)-1)*sin(PI*t/2)`, 2, W('whisp_raw.wav'));
ff(['-i', W('whisp_raw.wav'), '-af', 'bandpass=f=2500:w=1800,tremolo=f=7:d=0.7,aecho=0.8:0.7:200:0.4,volume=2', W('whisper.wav')]);
src(`0.9*sin(2*PI*55*t)*exp(-14*t)+0.7*sin(2*PI*50*(t-0.22))*exp(-14*(t-0.22))*gte(t,0.22)`, 0.8, W('beat.wav'));
src(`(0.18*sin(2*PI*220*t)+0.18*sin(2*PI*233.1*t)+0.15*sin(2*PI*311.1*t)+0.15*sin(2*PI*466.2*t)+0.12*sin(2*PI*69.3*t)+0.25*(2*random(0)-1))*exp(-1.6*t)`, 3.0, W('sting_raw.wav'));
ff(['-i', W('sting_raw.wav'), '-af', 'aecho=0.8:0.8:90|180:0.4|0.3,volume=2.2,alimiter=limit=0.95', W('sting.wav')]);
src(`0.12*(2*random(0)-1)*sin(PI*t/1.1)`, 1.1, W('whoosh_raw.wav'));
ff(['-i', W('whoosh_raw.wav'), '-af', 'bandpass=f=900:w=700,volume=2.5', W('whoosh.wav')]);
try { const LIB = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'sfx', 'library.json'), 'utf8')); let SEED = 0; for (const ch of String(P.title || '')) SEED = (SEED * 31 + ch.charCodeAt(0)) >>> 0;
  for (const [name, cat, k] of [['whoosh', 'whoosh', 0], ['sting', 'horror', 1], ['beat', 'heart', 0]]) { const a = LIB.filter((x) => x.cat === cat); if (a.length) ff(['-i', path.join(__dirname, '..', a[(SEED + k) % a.length].file), '-ar', '44100', '-ac', '1', W(name + '.wav')]); }
} catch (e) { console.log('sfx lib skipped', e.message); }
const sfx = [{ f: W('drone.wav'), at: 0 }, { f: W('whoosh.wav'), at: Math.max(0, sting - 0.6) }, { f: W('sting.wav'), at: sting }];
knocks.forEach((k) => sfx.push({ f: W('knock.wav'), at: k })); steps.forEach((k) => sfx.push({ f: W('step.wav'), at: k }));
rings.forEach((k) => sfx.push({ f: W('ring.wav'), at: Math.max(0, k - 1.5) })); whispers.forEach((k) => sfx.push({ f: W('whisper.wav'), at: Math.max(0, k - 0.6) }));
for (let b = lateT; b < sting - 0.3; b += 0.85) sfx.push({ f: W('beat.wav'), at: b });
// shot-change whooshes (soft)
segs.forEach((g, i) => { if (i && g.scene !== segs[i - 1].scene) sfx.push({ f: W('whoosh.wav'), at: Math.max(0, g.start - 0.6), v: 0.35 }); });
const all = parts.concat(sfx), inputs = [], filt = [];
all.forEach((p, i) => { inputs.push('-i', p.f); filt.push(`[${i}:a]aresample=44100,aformat=channel_layouts=mono,volume=${p.v || 1},adelay=${Math.round(p.at * 1000)}[x${i}]`); });
filt.push(all.map((_, i) => `[x${i}]`).join('') + `amix=inputs=${all.length}:normalize=0,alimiter=limit=0.95[a]`);
ff([...inputs, '-filter_complex', filt.join(';'), '-map', '[a]', '-t', TOTAL.toFixed(2), '-ac', '2', '-c:a', 'aac', '-b:a', '192k', W('audio.m4a')]);

(async () => {
  for (let i = 0; i < segs.length; i++) { const g = segs[i]; g.sub = g.text; try { g.words = await CAP.wordTimes(W(`v${i}.wav`), String(g.text).replace(/["“”]/g, '')); } catch (e) { console.log('words', e.message); } }
  const br = await chromium.launch(); const pg = await br.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  await pg.goto('file://' + path.join(__dirname, 'tpl.html')); await pg.evaluate(() => document.fonts.ready);
  await pg.addScriptTag({ content: CAP.CLIENT });
  await pg.evaluate((d) => window.setup(d), { segs, knocks, scenes: P.scenes, title: P.title, question: P.question, brand: P.brand || '' });
  const enc = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-i', W('audio.m4a'), '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-maxrate', '6M', '-bufsize', '12M', '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-shortest', '-movflags', '+faststart', W('out.mp4')], { stdio: ['pipe', 'inherit', 'inherit'] });
  const frames = Math.ceil(TOTAL * FPS), thumbF = Math.round(0.9 * FPS);
  for (let f = 0; f < frames; f++) {
    await pg.evaluate((x) => window.render(x), f / FPS);
    const buf = await pg.screenshot({ type: 'jpeg', quality: 88 });
    if (!enc.stdin.write(buf)) await new Promise((r) => enc.stdin.once('drain', r));
    if (f === thumbF) fs.writeFileSync(W('thumb.jpg'), buf);
  }
  enc.stdin.end(); await new Promise((r, j) => enc.on('close', (c) => (c ? j(new Error('ffmpeg ' + c)) : r()))); await br.close();
  console.log('rendered', TOTAL.toFixed(1) + 's');
})().catch((e) => { console.error(e); process.exit(1); });
