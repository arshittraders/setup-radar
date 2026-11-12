// Render a 1080x1920 short from <job>/script.json + <job>/a0.mp3.. + <job>/outro.mp3 -> <job>/out.mp4
// usage: node shorts/render.js <jobdir>
const fs = require('fs'), path = require('path'), { execFileSync, spawn } = require('child_process');
const { chromium } = require('playwright');
const FPS = 30, GAP = 0.3, LEAD = 0.5;

const job = path.resolve(process.argv[2]);
const S = JSON.parse(fs.readFileSync(path.join(job, 'script.json'), 'utf8'));
const dur = f => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString().trim());

// timeline
let t = LEAD; const parts = [];
S.scenes.forEach((s, i) => { const f = path.join(job, `a${i}.mp3`), d = dur(f); s.start = t; s.end = t + d + GAP; parts.push({ f, at: t }); t = s.end; });
const od = dur(path.join(job, 'outro.mp3'));
S.outro = { start: t }; parts.push({ f: path.join(job, 'outro.mp3'), at: t + 0.4 }); t += od + 1.4;
const TOTAL = t;
S.scenes[S.scenes.length - 1].end = S.outro.start;

// audio: voice parts placed on timeline + soft generated pad
const inputs = [], filt = [];
parts.forEach((p, i) => { inputs.push('-i', p.f); filt.push(`[${i}:a]adelay=${Math.round(p.at * 1000)}|${Math.round(p.at * 1000)},aresample=44100[v${i}]`); });
const n = parts.length;
const pad = `aevalsrc='0.035*sin(2*PI*220*t)+0.028*sin(2*PI*277.18*t)+0.028*sin(2*PI*329.63*t)+0.02*sin(2*PI*440*t)*(0.6+0.4*sin(2*PI*0.2*t))+0.015*sin(2*PI*554.37*t)*(0.5+0.5*sin(2*PI*0.5*t))':s=44100:d=${TOTAL.toFixed(2)}`;
filt.push(`${pad},lowpass=f=1800,volume=0.9,afade=t=in:d=1,afade=t=out:st=${(TOTAL - 1.5).toFixed(2)}:d=1.5[bg]`);
filt.push(parts.map((_, i) => `[v${i}]`).join('') + `amix=inputs=${n}:normalize=0,volume=1.6[vo]`);
filt.push(`[vo][bg]amix=inputs=2:normalize=0,alimiter=limit=0.95[a]`);
execFileSync('ffmpeg', ['-y', '-v', 'error', ...inputs, '-filter_complex', filt.join(';'), '-map', '[a]', '-t', TOTAL.toFixed(2), '-c:a', 'aac', '-b:a', '160k', path.join(job, 'audio.m4a')]);

(async () => {
  fs.copyFileSync(path.join(__dirname, '..', 'icon-512.png'), path.join(__dirname, 'icon.png'));
  const br = await chromium.launch();
  const pg = await br.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  await pg.goto('file://' + path.join(__dirname, 'tpl.html'));
  await pg.evaluate(() => document.fonts.ready);
  await pg.evaluate(d => window.setup(d), S);
  const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-i', path.join(job, 'audio.m4a'), '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p',
    '-c:a', 'copy', '-shortest', '-movflags', '+faststart', path.join(job, 'out.mp4')], { stdio: ['pipe', 'inherit', 'inherit'] });
  const frames = Math.ceil(TOTAL * FPS);
  for (let f = 0; f < frames; f++) {
    await pg.evaluate(x => window.render(x), f / FPS);
    const buf = await pg.screenshot({ type: 'jpeg', quality: 90 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (f === Math.round(2.5 * FPS)) fs.writeFileSync(path.join(job, 'thumb.jpg'), buf);
  }
  ff.stdin.end();
  await new Promise((r, j) => ff.on('close', c => c ? j(new Error('ffmpeg ' + c)) : r()));
  await br.close();
  console.log('rendered', job, TOTAL.toFixed(1) + 's', frames, 'frames');
})().catch(e => { console.error(e); process.exit(1); });
