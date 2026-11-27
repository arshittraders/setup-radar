const { chromium } = require('playwright'); const SFX = require('/home/claude/setup-radar/sfx/sfx.js'); const { spawn, execSync } = require('child_process'); const fs = require('fs');
const EP = process.argv[2], D = __dirname, SR = 44100, A0 = '/home/claude/setup-radar/toon/assets';
const EPS = JSON.parse(fs.readFileSync('/home/claude/setup-radar/tgb/eps.json')), BOARD = EPS[EP].board;
const LINES = EPS[EP].lines.map((s, i) => { const [who, text] = s.split('|'); return { i, who, text }; });
const EMO = { tg02: ['😤','🤓','😏','💯','🔋'], tg03: ['🐢','🤒','🌍','🏃','⏰'], tg04: ['🌳','🚗','☕','🍎','🍱'], tg05: ['👷','🤝','🎂','🙈','📜'], tg06: ['🤥','🐱','🔄','🔥','🇬🇧'], tg07: ['🤓','🌳','🩴','🤒','🍬'], tg08: ['☔','💸','📵','📓','🗺️'], tg09: ['😰','💰','🚌','🎥','🏃'], tg10: ['🤓','🤳','📺','📶','🪫'], tg11: ['🐕','🤝','✍️','😇','🐓'], tg12: ['🤒','✍️','🌬️','💪','📅'], tg13: ['🐄','⛽','📋','📱','👨'], tg14: ['🥟','👬','🤷','🙏','♾️'], tg15: ['📱','👷','📉','🤝','🎬'], tg16: ['💸','🐢','🔥','🌙','📱'], tg17: ['🥪','⏰','🍅','🏆','📸'], tg18: ['🛍️','📝','😭','💰','🙈'], tg19: ['📶','🤑','⏳','💍','😁'], tg20: ['📯','🟡','👮','🦓','🗺️'], tg21: ['🍽️','✉️','💃','👵','📸'] }[EP];
const META = { 1: { emoji: EMO[0], mood: 'smug', pose: 'talk' }, 3: { emoji: EMO[1], mood: 'smug', pose: 'talk' }, 5: { emoji: EMO[2], mood: 'happy', pose: 'point' }, 7: { emoji: EMO[3], mood: 'happy', pose: 'talk' }, 9: { emoji: EMO[4], mood: 'smug', pose: 'shrug' }, 10: { mood: 'happy', pose: 'wave' } };
const LM = { 0: 'shock', 2: 'smug', 4: 'smile', 6: 'smile', 8: 'shock' };
const P_ = D + '/p_' + EP; fs.mkdirSync(P_, { recursive: true }); fs.copyFileSync('/home/claude/setup-radar/motion/kinetic.js', D + '/kinetic.js');
const dur = f => +execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 ${f}`).toString();
let t = 0.5; const L = [];
for (const l of LINES) {
  const src = `${D}/v/${EP}_l${String(l.i).padStart(2, '0')}.mp3`, out = `${P_}/l${l.i}.wav`;
  const af = 'silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse' + (l.who === 'T' ? ',asetrate=24000*1.07,aresample=44100,atempo=0.98' : ',aresample=44100');
  execSync(`ffmpeg -v error -y -i ${src} -af "${af}" -ar 44100 -ac 1 ${out}`);
  const d = dur(out); L.push({ ...l, ...(META[l.i] || {}), lmood: LM[l.i], s: t, e: t + d });
  t += d + (l.who === 'T' && META[l.i]?.emoji ? 1.25 : 0.35);
}
const TOTAL = t + 0.8;
const wav = f => { const b = fs.readFileSync(f); let o = 12; while (b.toString('ascii', o, o + 4) !== 'data') o += 8 + b.readUInt32LE(o + 4); const len = b.readUInt32LE(o + 4) / 2, a = new Float32Array(len); for (let i = 0; i < len; i++) a[i] = b.readInt16LE(o + 8 + i * 2) / 32768; return a; };
const dec = f => { execSync(`ffmpeg -v error -y -i ${f} -ar 44100 -ac 1 ${P_}/tmp.wav`); return wav(`${P_}/tmp.wav`); };
const n = Math.ceil(TOTAL * SR), A = new Float32Array(n), M = new Float32Array(n);
const put = (arr, t0, s, g = 1) => { const o = Math.floor(t0 * SR); for (let i = 0; i < s.length && o + i < n; i++) arr[o + i] += s[i] * g; };
const AMP = {};
for (const l of L) { const s = wav(`${P_}/l${l.i}.wav`); put(A, l.s, s, 1); if (l.who === 'T') { const fr = []; for (let f = 0; f * SR / 30 < s.length; f++) { let m = 0; for (let k = Math.floor(f * SR / 30); k < Math.min(s.length, (f + 1) * SR / 30); k++) m = Math.max(m, Math.abs(s[k])); fr.push(m); } const mx = Math.max(...fr) || 1; AMP[l.i] = fr.map(v => v / mx); } }
const laugh = dec(`${A0}/laugh.mp3`), big = dec(`${A0}/sfx/bighasi.mp3`), huh = dec(`${A0}/sfx/huh.mp3`), yay = dec(`${A0}/sfx/yay.mp3`);
const tone = (t0, d, f, g, dc = 6) => { const o = Math.floor(t0 * SR); for (let i = 0; i < d * SR && o + i < n; i++) { const tt = i / SR; A[o + i] += Math.sin(2 * Math.PI * (typeof f === 'function' ? f(tt) : f) * tt) * g * Math.exp(-tt * dc); } };
const rim = t0 => { tone(t0, .12, 180, .35, 30); tone(t0 + .12, .12, 200, .3, 30); let sd = 9; const o = Math.floor((t0 + .26) * SR); for (let i = 0; i < .5 * SR; i++) { sd = (sd * 16807) % 2147483647; A[o + i] += ((sd / 2147483647) * 2 - 1) * .18 * Math.exp(-i / SR * 6); } };
const boing = t0 => tone(t0, .6, tt => 180 + 120 * Math.sin(tt * 40) * Math.exp(-tt * 4) + tt * 60, .3, 3.5);
const P = L.filter(l => l.emoji);
P.forEach((l, k) => { if (!SFX.place(A, SR, l.e + .05, k % 2 ? 'boing' : 'drum', k, .5)) (k % 2 ? boing : rim)(l.e + .05); SFX.place(A, SR, l.e + .02, 'pop', k, .35); put(A, l.e + .2, k === P.length - 1 ? big : laugh, k === P.length - 1 ? .7 : .55); });
put(A, L[8].e + .05, huh, .5); put(A, L[10].s - .1, yay, .35); SFX.place(A, SR, 0.45, 'whoosh', 2, .4, .35); SFX.place(A, SR, L[10].s - .15, 'ding', 1, .4); SFX.place(A, SR, 0.2, 'magic', 1, .25);
// bouncy ukulele-ish background
const hz = m => 440 * Math.pow(2, (m - 69) / 12), bt = 60 / 120 / 2, prog = [[60, 64, 67], [65, 69, 72], [67, 71, 74], [60, 64, 67]];
for (let k = 0; k * bt < TOTAL; k++) { const ch = prog[Math.floor(k / 8) % 4], f = hz(ch[[0, 1, 2, 1][k % 4]] + 12), o = Math.floor(k * bt * SR); for (let i = 0; i < .35 * SR && o + i < n; i++) { const tt = i / SR; M[o + i] += (Math.sin(2 * Math.PI * f * tt) + .4 * Math.sin(4 * Math.PI * f * tt)) * .05 * Math.exp(-tt * 10); } if (k % 4 === 0) { const fb = hz(ch[0] - 24); for (let i = 0; i < .4 * SR && o + i < n; i++) { const tt = i / SR; M[o + i] += Math.sin(2 * Math.PI * fb * tt) * .1 * Math.exp(-tt * 6); } } }
for (let i = 0; i < n; i++) { const sp = L.some(l => i >= l.s * SR && i < l.e * SR); A[i] += M[i] * (sp ? .45 : 1); }
let pk = 0; for (const v of A) pk = Math.max(pk, Math.abs(v)); const buf = Buffer.alloc(44 + n * 2);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write('WAVEfmt ', 8); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(n * 2, 40);
for (let i = 0; i < n; i++) buf.writeInt16LE(Math.round(A[i] / pk * .95 * 32767), 44 + i * 2); fs.writeFileSync(`${P_}/mix.wav`, buf);
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto('file://' + D + '/tg.html'); await p.evaluate(async (o) => { window.L = o.L; window.AMP = o.AMP; window.BOARD = o.BOARD; await document.fonts.ready; window.render(0.1); await new Promise(r => setTimeout(r, 300)); }, { L, AMP, BOARD });
  if (process.argv[3]) { for (const tt of process.argv[3].split(',').map(Number)) { await p.evaluate(t => window.render(t), tt); await p.screenshot({ path: `${P_}/f_${tt}.jpg`, type: 'jpeg', quality: 70 }); } await b.close(); console.log('test', TOTAL.toFixed(1)); return; }
  const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', '30', '-i', '-', '-i', `${P_}/mix.wav`, '-af', 'loudnorm=I=-14:TP=-1.5', '-c:v', 'libx264', '-preset', 'medium', '-crf', '21', '-maxrate', '6M', '-bufsize', '12M', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-shortest', '-movflags', '+faststart', `${D}/../tingu-${EP.slice(2)}.mp4`], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let i = 0; i < TOTAL * 30; i++) { await p.evaluate(t => window.render(t), i / 30); const im = await p.screenshot({ type: 'jpeg', quality: 88 }); if (!ff.stdin.write(im)) await new Promise(r => ff.stdin.once('drain', r)); }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); await b.close(); console.log('done', TOTAL.toFixed(1));
})();
