// Render a 1080x1920 short from <job>/script.json + <job>/a0.mp3.. + <job>/outro.mp3 -> <job>/out.mp4
// usage: node shorts/render.js <jobdir>
const fs = require('fs'), path = require('path'), { execFileSync, spawn } = require('child_process');
const { chromium } = require('playwright');
const CAP = require('./captions');
const FPS = 30, GAP = 0.12, LEAD = 0.15, BPM = 124;
const SPEED = Number(process.env.VOICE_SPEED || 1.22), PITCH = Number(process.env.VOICE_PITCH || 0.95);

const job = path.resolve(process.argv[2]);
const S = JSON.parse(fs.readFileSync(path.join(job, 'script.json'), 'utf8'));
const dur = f => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString().trim());

// punchy voice: slightly deeper, faster, bass boost, compressed, trimmed silence
function prep(src, dst) {
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', src, '-af',
    `silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=stop_periods=-1:stop_duration=0.32:stop_threshold=-42dB,` +
    `aresample=44100,asetrate=${Math.round(44100 * PITCH)},aresample=44100,atempo=${(SPEED / PITCH).toFixed(4)},` +
    `equalizer=f=110:t=q:w=1:g=5,equalizer=f=3200:t=q:w=1.2:g=3,acompressor=threshold=-20dB:ratio=4:attack=4:release=80:makeup=4,loudnorm=I=-14:TP=-1.5`,
    '-ar', '44100', '-ac', '1', dst]);
  return dst;
}

let t = LEAD; const parts = [];
S.scenes.forEach((s, i) => { const f = prep(path.join(job, `a${i}.mp3`), path.join(job, `v${i}.wav`)), d = dur(f); s.start = t; s.end = t + d + GAP; parts.push({ f, at: t }); t = s.end; });
const of = prep(path.join(job, 'outro.mp3'), path.join(job, 'vo.wav'));
S.outro = { start: t }; parts.push({ f: of, at: t + 0.25 }); t += dur(of) + 1.2;
const TOTAL = t;
S.scenes[S.scenes.length - 1].end = S.outro.start;
S.bpm = BPM;

// music (synth, varies by day) ducked under the voice
const mus = path.join(job, 'music.wav');
execFileSync('node', [path.join(__dirname, 'music.js'), TOTAL.toFixed(2), mus, String(Number(S.day) || new Date().getDate())]);
const inputs = [], filt = [];
parts.forEach((p, i) => { inputs.push('-i', p.f); filt.push(`[${i}:a]adelay=${Math.round(p.at * 1000)}|${Math.round(p.at * 1000)}[v${i}]`); });
const n = parts.length;
inputs.push('-i', mus);
filt.push(parts.map((_, i) => `[v${i}]`).join('') + `amix=inputs=${n}:normalize=0,aformat=channel_layouts=stereo,asplit=2[vo][sc]`);
filt.push(`[${n}:a]volume=0.42[m]`);
filt.push(`[m][sc]sidechaincompress=threshold=0.04:ratio=5:attack=15:release=250[md]`);
filt.push(`[vo][md]amix=inputs=2:normalize=0,alimiter=limit=0.95[a]`);
execFileSync('ffmpeg', ['-y', '-v', 'error', ...inputs, '-filter_complex', filt.join(';'), '-map', '[a]', '-t', TOTAL.toFixed(2), '-c:a', 'aac', '-b:a', '192k', path.join(job, 'audio.m4a')]);

(async () => {
  for (let i = 0; i < S.scenes.length; i++) { const sc = S.scenes[i]; sc.words = await CAP.wordTimes(path.join(job, `v${i}.wav`), sc.say || ''); }
  fs.copyFileSync(path.join(__dirname, '..', 'icon-512.png'), path.join(__dirname, 'icon.png'));
  const br = await chromium.launch();
  const pg = await br.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  await pg.goto('file://' + path.join(__dirname, 'tpl.html'));
  await pg.evaluate(() => document.fonts.ready);
  await pg.addScriptTag({ content: CAP.CLIENT });
  await pg.evaluate(d => window.setup(d), S);
  const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-i', path.join(job, 'audio.m4a'), '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p',
    '-c:a', 'copy', '-shortest', '-movflags', '+faststart', path.join(job, 'out.mp4')], { stdio: ['pipe', 'inherit', 'inherit'] });
  const frames = Math.ceil(TOTAL * FPS);
  for (let f = 0; f < frames; f++) {
    await pg.evaluate(x => window.render(x), f / FPS);
    const buf = await pg.screenshot({ type: 'jpeg', quality: 90 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (f === Math.round(1.2 * FPS)) fs.writeFileSync(path.join(job, 'thumb.jpg'), buf);
  }
  ff.stdin.end();
  await new Promise((r, j) => ff.on('close', c => c ? j(new Error('ffmpeg ' + c)) : r()));
  await br.close();
  console.log('rendered', job, TOTAL.toFixed(1) + 's', frames, 'frames');
})().catch(e => { console.error(e); process.exit(1); });
