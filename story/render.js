// Image-panel story short: <job>/story.json + <job>/a<i>.mp3 + panels in <job>/img/<ID>.png -> <job>/out.mp4
const fs = require('fs'), path = require('path'), { execFileSync, spawn } = require('child_process');
const { chromium } = require('playwright');
const CAP = require('../shorts/captions');
const FPS = 30, job = path.resolve(process.argv[2]), W = p => path.join(job, p);
const S = JSON.parse(fs.readFileSync(W('story.json'), 'utf8'));
const ff = a => execFileSync('ffmpeg', ['-y', '-v', 'error', ...a]);
const dur = f => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString().trim());
const FX = {
  narr: 'highpass=f=70,equalizer=f=140:t=q:w=1:g=4,acompressor=threshold=-20dB:ratio=3:makeup=3,aecho=0.8:0.5:45|90:0.18|0.1',
  dry: 'acompressor=threshold=-20dB:ratio=3:makeup=3',
  ghost: 'asetrate=44100*0.9,aresample=44100,vibrato=f=4:d=0.12,aecho=0.8:0.75:140|280|420:0.4|0.28|0.18,equalizer=f=220:t=q:w=1:g=3'
};
const hookEnd = S.hook ? S.hook.dur : 0;
let t = hookEnd + 0.15; const parts = [], slams = [], sfxAt = [];
S.segments.forEach((g, i) => {
  const v = S.voices[g.who], out = W(`v${i}.wav`);
  const tempo = v.fx === 'narr' ? (S.scenes ? 1.2 : ((S.mood || 'horror') === 'horror' ? 1.28 : 1.15)) : (S.scenes ? 1.08 : 1.1);
  ff(['-i', W(`a${i}.mp3`), '-af', `aresample=44100,silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=stop_periods=-1:stop_duration=0.38:stop_threshold=-45dB,atempo=${tempo},${FX[v.fx] || FX.narr},loudnorm=I=-15:TP=-1.5`, '-ac', '1', '-ar', '44100', out]);
  t += g.pre || 0.3; g.start = t; g.end = t + dur(out); t = g.end;
  parts.push({ f: out, at: g.start });
  if (g.sfx === 'slam') [0.0, 0.42, 0.8].forEach(k => slams.push(g.start + 0.6 + k));
  if (g.sfx) sfxAt.push({ k: g.sfx, at: g.sfx === 'stinger' ? g.end + 0.05 : g.start });
});
const last = S.segments[S.segments.length - 1], sting = last.end + 0.05, TOTAL = sting + 1.6 + 3.6;
S.segments.forEach(g => { g.ghost = (S.voices[g.who] || {}).fx === 'ghost'; });

const src = (e, d, o) => ff(['-f', 'lavfi', '-i', `aevalsrc='${e}':s=44100:d=${d}`, '-ac', '1', o]);
src(`0.2*sin(2*PI*41*t)+0.15*sin(2*PI*43.4*t)+0.07*sin(2*PI*82*t)*(0.5+0.5*sin(2*PI*0.11*t))+0.04*sin(2*PI*622*t)*(0.5+0.5*sin(2*PI*0.05*t))`, TOTAL.toFixed(2), W('dr.wav'));
ff(['-i', W('dr.wav'), '-f', 'lavfi', '-i', `anoisesrc=c=brown:a=0.05:d=${TOTAL.toFixed(2)}`, '-filter_complex', `[0][1]amix=inputs=2:normalize=0,lowpass=f=1000,volume='if(lt(t,${sting}),0.5+0.5*t/${sting.toFixed(2)},if(lt(t,${(sting + 1.2).toFixed(2)}),0.1,0.35))':eval=frame,afade=t=out:st=${(TOTAL - 1.5).toFixed(2)}:d=1.5`, W('drone.wav')]);
src(`(0.9*sin(2*PI*(55*t+60*(1-exp(-25*t))))*exp(-9*t)+0.5*(2*random(0)-1)*exp(-40*t))`, 1.2, W('slam_r.wav'));
ff(['-i', W('slam_r.wav'), '-af', 'lowpass=f=1200,aecho=0.8:0.85:180|360:0.45|0.3,volume=1.8,alimiter=limit=0.95', W('slam.wav')]);
src(`(0.18*sin(2*PI*220*t)+0.18*sin(2*PI*233.1*t)+0.15*sin(2*PI*311.1*t)+0.15*sin(2*PI*466.2*t)+0.12*sin(2*PI*69.3*t)+0.25*(2*random(0)-1))*exp(-1.6*t)`, 3.0, W('st_r.wav'));
ff(['-i', W('st_r.wav'), '-af', 'aecho=0.8:0.8:90|180:0.4|0.3,volume=2.2,alimiter=limit=0.95', W('stinger.wav')]);
src(`0.1*sin(2*PI*(1800+600*sin(2*PI*3*t))*t)*exp(-1.8*t)+0.08*sin(2*PI*2637*t)*exp(-2.5*t)`, 2.0, W('sh_r.wav'));
ff(['-i', W('sh_r.wav'), '-af', 'aecho=0.8:0.6:60|120:0.3|0.2,volume=1.2', W('shimmer.wav')]);
src(`0.35*sin(2*PI*480*t)*exp(-6*mod(t,0.55))*lt(t,1.1)*(0.6+0.4*sin(2*PI*7*t))`, 1.3, W('owl_r.wav'));
ff(['-i', W('owl_r.wav'), '-af', 'lowpass=f=900,aecho=0.8:0.7:300:0.3,volume=0.9', W('owl.wav')]);
src(`0.14*(2*random(0)-1)*sin(PI*t/0.9)`, 0.9, W('wh_r.wav'));
ff(['-i', W('wh_r.wav'), '-af', 'bandpass=f=800:w=700,volume=2.8', W('whoosh.wav')]);

const HORROR = (S.mood || 'horror') === 'horror';
const sfx = HORROR ? [{ f: W('drone.wav'), at: 0 }, { f: W('whoosh.wav'), at: 0 }, ...(S.hook ? [{ f: W('stinger.wav'), at: 0.08 }] : [])] : [];
if (!HORROR) { execFileSync('node', [path.join(__dirname, '..', 'shorts', 'music.js'), TOTAL.toFixed(2), W('music.wav'), String(S.title.length)]); ff(['-i', W('music.wav'), '-af', 'volume=0.18,lowpass=f=5000', W('music_lo.wav')]); sfx.push({ f: W('music_lo.wav'), at: 0 }); }
slams.forEach(x => sfx.push({ f: W('slam.wav'), at: x }));
sfxAt.forEach(s => { if (s.k !== 'slam' && fs.existsSync(W(s.k + '.wav'))) sfx.push({ f: W(s.k + '.wav'), at: s.at }); });
const all = parts.concat(sfx), inputs = [], filt = [];
all.forEach((p, i) => { inputs.push('-i', p.f); filt.push(`[${i}:a]aresample=44100,aformat=channel_layouts=mono,adelay=${Math.round(p.at * 1000)}${p.f.endsWith('stinger.wav') && p.at < 1 ? ',volume=0.45' : ''}[x${i}]`); });
filt.push(all.map((_, i) => `[x${i}]`).join('') + `amix=inputs=${all.length}:normalize=0,alimiter=limit=0.95[a]`);
ff([...inputs, '-filter_complex', filt.join(';'), '-map', '[a]', '-t', TOTAL.toFixed(2), '-ac', '2', '-c:a', 'aac', '-b:a', '192k', W('audio.m4a')]);

// shots
const img = id => 'file://' + (fs.existsSync(W(`img/${id}.png`)) ? W(`img/${id}.png`) : path.join(path.dirname(W('story.json')), id + '.png'));
const shots = [];
if (S.hook) shots.push({ src: img(S.hook.panel), start: 0, end: hookEnd, move: 'in', hook: true });
S.segments.forEach((g, i) => {
  const prev = S.segments[i - 1];
  if (prev && prev.panel === g.panel) { shots[shots.length - 1].end = g.end; return; }
  shots.push({ src: img(g.panel), start: Math.max(hookEnd, g.start - Math.min(0.3, g.pre || 0.3)), end: g.end, move: g.move, shake: g.shake, flicker: g.flicker });
});
shots.forEach((s, i) => { if (shots[i + 1]) s.end = shots[i + 1].start; else s.end = sting + 0.9; });

(async () => {
  for (let i = 0; i < S.segments.length; i++) { const g = S.segments[i]; g.words = await CAP.wordTimes(W(`v${i}.wav`), String(g.sub || g.text).replace(/["“”]/g, '')); }
  const br = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const pg = await br.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  await pg.goto('file://' + path.join(__dirname, 'tpl.html'));
  await pg.evaluate(() => document.fonts.ready);
  await pg.addScriptTag({ content: CAP.CLIENT });
  await pg.evaluate(d => window.setup(d), { shots, segs: S.segments, slams, sting, hookEnd, title: S.title, part: S.part, next: S.next, horror: (S.mood || 'horror') === 'horror' });
  await pg.waitForTimeout(800);
  const enc = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-i', W('audio.m4a'), '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-shortest', '-movflags', '+faststart', W('out.mp4')], { stdio: ['pipe', 'inherit', 'inherit'] });
  const frames = Math.ceil(TOTAL * FPS), thumbF = Math.round((last.start + 0.6) * FPS);
  for (let f = 0; f < frames; f++) {
    await pg.evaluate(x => window.render(x), f / FPS);
    const buf = await pg.screenshot({ type: 'jpeg', quality: 90 });
    if (!enc.stdin.write(buf)) await new Promise(r => enc.stdin.once('drain', r));
    if (f === thumbF) fs.writeFileSync(W('thumb.jpg'), buf);
  }
  enc.stdin.end(); await new Promise((r, j) => enc.on('close', c => c ? j(new Error('ffmpeg ' + c)) : r()));
  await br.close(); console.log('rendered', TOTAL.toFixed(1) + 's');
})().catch(e => { console.error(e); process.exit(1); });
