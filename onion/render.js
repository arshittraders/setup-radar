// node render.js <f0> <f1> <out.mp4>   renders frames [f0,f1) at 30fps
const { chromium } = require('playwright'); const { spawn } = require('child_process');
const [F0, F1, OUT] = [+process.argv[2], +process.argv[3], process.argv[4]];
(async () => { const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } }); p.on('pageerror', (e) => console.log('ERR', e.message));
  await p.goto('file://' + __dirname + '/index.html'); await p.waitForFunction(() => window.READY, null, { timeout: 120000 });
  const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', '30', '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', OUT], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let f = F0; f < F1; f++) { await p.evaluate((t) => window.render(t), f / 30); const im = await p.screenshot({ type: 'jpeg', quality: 94 }); if (!ff.stdin.write(im)) await new Promise((r) => ff.stdin.once('drain', r)); if (f % 50 === 0) console.log(f, ((Date.now() - t0) / (f - F0 + 1)).toFixed(0), 'ms/f'); }
  ff.stdin.end(); await new Promise((r) => ff.on('close', r)); await b.close(); console.log('done', OUT); })();
