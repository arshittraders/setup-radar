// Render the horror short: <job>/story.json + <job>/a<i>.mp3 (one per segment) -> <job>/out.mp4 + thumb.jpg
const fs = require('fs'), path = require('path'), { execFileSync, spawn } = require('child_process');
const { chromium } = require('playwright');
const FPS = 30;
const job = path.resolve(process.argv[2]);
const S = JSON.parse(fs.readFileSync(path.join(job, 'story.json'), 'utf8'));
const ff = (args) => execFileSync('ffmpeg', ['-y', '-v', 'error', ...args]);
const dur = f => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString().trim());
const W = p => path.join(job, p);

const FX = {
  narr: 'highpass=f=70,equalizer=f=140:t=q:w=1:g=4,acompressor=threshold=-20dB:ratio=3:makeup=3,aecho=0.8:0.5:45|90:0.18|0.1',
  phone: 'highpass=f=320,lowpass=f=3300,acompressor=threshold=-22dB:ratio=4:makeup=5,aecho=0.8:0.4:20:0.15',
  ghost: 'asetrate=44100*0.86,aresample=44100,atempo=1.03,vibrato=f=4:d=0.15,aecho=0.8:0.75:140|280|420:0.4|0.28|0.18,equalizer=f=200:t=q:w=1:g=4',
  dry: 'acompressor=threshold=-20dB:ratio=3:makeup=3'
};
// voices -> processed wav, timeline
let t = 0; const knocks = []; const parts = [];
S.segments.forEach((g, i) => {
  const v = S.voices[g.who];
  const out = W(`v${i}.wav`);
  const tempo = { narr: 1.32, phone: 1.18, ghost: 1.12, dry: 1.1 }[v.fx] || 1.15;
  ff(['-i', W(`a${i}.mp3`), '-af', `aresample=44100,silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=stop_periods=-1:stop_duration=0.38:stop_threshold=-45dB,atempo=${tempo},${FX[v.fx] || FX.dry},loudnorm=I=-15:TP=-1.5`, '-ac', '1', '-ar', '44100', out]);
  t += g.pre || 0.3; g.start = t; g.end = t + dur(out); t = g.end;
  parts.push({ f: out, at: g.start });
  if (g.sfx_after === 'knock') { [0.15, 0.6, 1.05].forEach(k => knocks.push(g.end + k)); }
});
const last = S.segments[S.segments.length - 1];
const handT = last.start + (last.end - last.start) * 0.62, sting = last.end + 0.05, TOTAL = sting + 0.9 + 3.8;
const s2 = S.segments.find(g => g.scene === 2).start, s4 = S.segments.find(g => g.scene === 4).start;

// ---- sound design (all synthesized) ----
const src = (expr, d, out) => ff(['-f', 'lavfi', '-i', `aevalsrc='${expr}':s=44100:d=${d}`, '-ac', '1', out]);
src(`0.22*sin(2*PI*41*t)+0.16*sin(2*PI*43.3*t)+0.08*sin(2*PI*82.5*t)*(0.5+0.5*sin(2*PI*0.13*t))+0.05*sin(2*PI*311*t)*(0.5+0.5*sin(2*PI*0.07*t))`, TOTAL.toFixed(2), W('drone_raw.wav'));
ff(['-i', W('drone_raw.wav'), '-f', 'lavfi', '-i', `anoisesrc=c=brown:a=0.06:d=${TOTAL.toFixed(2)}`, '-filter_complex',
  `[0][1]amix=inputs=2:normalize=0,lowpass=f=900,volume='if(lt(t,${s4}),0.55,if(lt(t,${sting}),0.55+0.6*(t-${s4})/${(sting - s4).toFixed(2)},if(lt(t,${sting + 0.9}),0.15,0.4)))':eval=frame,afade=t=in:d=1.2,afade=t=out:st=${(TOTAL - 1.5).toFixed(2)}:d=1.5`, W('drone.wav')]);
src(`0.32*(2*gte(sin(2*PI*165*t),0)-1)*if(lt(mod(t,0.9),0.42),1,0)`, Math.max(0.5, s2 - 0.05).toFixed(2), W('buzz_raw.wav'));
ff(['-i', W('buzz_raw.wav'), '-af', 'lowpass=f=600,volume=0.5', W('buzz.wav')]);
src(`0.9*sin(2*PI*(80*t+40*(1-exp(-30*t))))*exp(-22*t)+0.35*(2*random(0)-1)*exp(-70*t)`, 0.45, W('knock_raw.wav'));
ff(['-i', W('knock_raw.wav'), '-af', 'lowpass=f=1500,aecho=0.8:0.6:60:0.25,volume=1.6', W('knock.wav')]);
src(`0.9*sin(2*PI*55*t)*exp(-14*t)+0.7*sin(2*PI*50*(t-0.22))*exp(-14*(t-0.22))*gte(t,0.22)`, 0.8, W('beat.wav'));
src(`(0.18*sin(2*PI*220*t)+0.18*sin(2*PI*233.1*t)+0.15*sin(2*PI*311.1*t)+0.15*sin(2*PI*466.2*t)+0.12*sin(2*PI*69.3*t)+0.25*(2*random(0)-1))*exp(-1.6*t)`, 3.0, W('sting_raw.wav'));
ff(['-i', W('sting_raw.wav'), '-af', 'aecho=0.8:0.8:90|180:0.4|0.3,volume=2.2,alimiter=limit=0.95', W('sting.wav')]);
src(`0.12*(2*random(0)-1)*sin(PI*t/1.1)`, 1.1, W('whoosh_raw.wav'));
ff(['-i', W('whoosh_raw.wav'), '-af', 'bandpass=f=900:w=700,volume=2.5', W('whoosh.wav')]);
src(`0.25*(2*random(0)-1)*exp(-200*mod(t,1))`, Math.max(0.5, s2).toFixed(2), W('tick_raw.wav'));
ff(['-i', W('tick_raw.wav'), '-af', 'highpass=f=2500,volume=0.6', W('tick.wav')]);

const sfx = [{ f: W('drone.wav'), at: 0 }, { f: W('tick.wav'), at: 0 }, { f: W('buzz.wav'), at: 0.2 }, { f: W('whoosh.wav'), at: handT - 0.5 }, { f: W('sting.wav'), at: sting }];
knocks.forEach(k => sfx.push({ f: W('knock.wav'), at: k }));
for (let b = s4; b < sting - 0.3; b += 0.85) sfx.push({ f: W('beat.wav'), at: b });

const all = parts.concat(sfx); const inputs = [], filt = [];
all.forEach((p, i) => { inputs.push('-i', p.f); filt.push(`[${i}:a]aresample=44100,aformat=channel_layouts=mono,adelay=${Math.round(p.at * 1000)}[x${i}]`); });
filt.push(all.map((_, i) => `[x${i}]`).join('') + `amix=inputs=${all.length}:normalize=0,alimiter=limit=0.95[a]`);
ff([...inputs, '-filter_complex', filt.join(';'), '-map', '[a]', '-t', TOTAL.toFixed(2), '-ac', '2', '-c:a', 'aac', '-b:a', '192k', W('audio.m4a')]);

(async () => {
  const br = await chromium.launch();
  const pg = await br.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  await pg.goto('file://' + path.join(__dirname, 'tpl.html'));
  await pg.evaluate(() => document.fonts.ready);
  await pg.evaluate(d => window.setup(d), { segs: S.segments, knocks });
  const enc = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-i', W('audio.m4a'), '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-shortest', '-movflags', '+faststart', W('out.mp4')], { stdio: ['pipe', 'inherit', 'inherit'] });
  const frames = Math.ceil(TOTAL * FPS), thumbF = Math.round((handT + 0.75) * FPS);
  for (let f = 0; f < frames; f++) {
    await pg.evaluate(x => window.render(x), f / FPS);
    const buf = await pg.screenshot({ type: 'jpeg', quality: 90 });
    if (!enc.stdin.write(buf)) await new Promise(r => enc.stdin.once('drain', r));
    if (f === thumbF) fs.writeFileSync(W('thumb.jpg'), buf);
  }
  enc.stdin.end();
  await new Promise((r, j) => enc.on('close', c => c ? j(new Error('ffmpeg ' + c)) : r()));
  await br.close();
  console.log('rendered', TOTAL.toFixed(1) + 's');
})().catch(e => { console.error(e); process.exit(1); });
