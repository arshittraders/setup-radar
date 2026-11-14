const fs = require('fs'), path = require('path'), { execFileSync, spawn } = require('child_process');
const { chromium } = require('playwright');
const W = p => path.join(__dirname, p), ff = a => execFileSync('ffmpeg', ['-y', '-v', 'error', ...a]);
const TL = JSON.parse(fs.readFileSync(W('tl.json'))), L = TL.lines, T = TL.total, FPS = 30;
const at = i => L[i].t;
// gags: camera + stickers + sfx
const G = [
  { t: 0, sfx: 'whoosh' }, { t: 0.05, flash: 0.6, sfx: 'boom' },
  { t: at(1) + 1.5, zoom: 1.25, len: 1.0, st: '🤣', x: 700, y: 330, sfx: 'boing' },
  { t: at(2), zoom: 1.12, len: 2.2, st: '🤔', x: 760, y: 300, len2: 2, sfx: 'scratch' },
  { t: at(2) + 2.6, tag: 'KAAND ALERT 🚨', x: 150, y: 420, bg: '#ff4d4d', len: 1.6, sfx: 'pop' },
  { t: at(3) + 3.4, zoom: 1.2, len: 1.0, tag: 'PRO ✅', x: 600, y: 360, bg: '#38e07b', sfx: 'ding' },
  { t: at(4) + 1.6, st: '😂', x: 120, y: 360, sfx: 'boing' },
  { t: at(5) + 1.4, st: '😇', x: 720, y: 280, sfx: 'pop' },
  { t: at(6) + 1.7, zoom: 1.35, len: 1.3, gray: true, st: '💀', x: 760, y: 300, sfx: 'vine' },
  { t: at(7), shake: 26, len: 2.2, flash: 0.9, sfx: 'boom' }, { t: at(7) + 0.2, st: '🔥', x: 80, y: 330, len: 2.4 }, { t: at(7) + 0.5, st: '🎆', x: 760, y: 300, len: 2.2, sfx: 'pop' },
  { t: at(8), st: '🏃💨', fly: true, x: 0, y: 380, len: 2.2, sfx: 'whoosh' }, { t: at(8), shake: 10, len: 1.5 },
  { t: T - 1.6, sfx: 'ding' }
];
G.forEach(g => { if (g.st && !g.len) g.len = 1.4; });
// ---------- audio ----------
const src = (e, d, o) => ff(['-f', 'lavfi', '-i', `aevalsrc='${e}':s=44100:d=${d}`, '-ac', '1', W(o)]);
const SFX = {
  whoosh: () => { src('0.5*(2*random(0)-1)*sin(PI*t/0.45)', 0.45, 'w_r.wav'); ff(['-i', W('w_r.wav'), '-af', 'bandpass=f=1200:w=1800,volume=3', W('whoosh.wav')]); },
  boom: () => { src('0.9*sin(2*PI*(45+60*exp(-8*t))*t)*exp(-2.5*t)+0.5*(2*random(0)-1)*exp(-6*t)', 1.6, 'b_r.wav'); ff(['-i', W('b_r.wav'), '-af', 'lowpass=f=900,volume=2.2', W('boom.wav')]); },
  boing: () => { src('0.5*sin(2*PI*(260*t+700*t*t))*exp(-3*t)', 0.55, 'bo_r.wav'); ff(['-i', W('bo_r.wav'), '-af', 'vibrato=f=14:d=0.5,volume=1.6', W('boing.wav')]); },
  scratch: () => { src('0.6*(2*random(0)-1)*(0.5+0.5*sin(2*PI*18*t))', 0.5, 's_r.wav'); ff(['-i', W('s_r.wav'), '-af', 'bandpass=f=2200:w=1500,volume=2', W('scratch.wav')]); },
  pop: () => { src('0.8*sin(2*PI*(900-700*t)*t)*exp(-30*t)', 0.2, 'p_r.wav'); ff(['-i', W('p_r.wav'), '-af', 'volume=1.6', W('pop.wav')]); },
  ding: () => { src('0.4*sin(2*PI*1568*t)*exp(-4*t)+0.25*sin(2*PI*2093*t)*exp(-5*t)', 1.0, 'd_r.wav'); ff(['-i', W('d_r.wav'), '-af', 'volume=1.2', W('ding.wav')]); },
  vine: () => { src('0.95*sin(2*PI*(55+25*exp(-10*t))*t)*exp(-1.6*t)', 1.8, 'v_r.wav'); ff(['-i', W('v_r.wav'), '-af', 'acrusher=bits=8:mix=0.25,lowpass=f=600,volume=3', W('vine.wav')]); },
};
Object.values(SFX).forEach(f => f());
// bouncy music 112 bpm, drop at line 7
const B = 60 / 112, drop = at(7);
const prog = [[130.8, 164.8, 196], [110, 130.8, 164.8], [87.3, 110, 130.8], [98, 123.5, 146.8]];
const pk = j => `if(eq(ld(0),0),${prog[0][j]},if(eq(ld(0),1),${prog[1][j]},if(eq(ld(0),2),${prog[2][j]},${prog[3][j]})))`;
src(`st(0,mod(floor(t/(4*${B})),4));st(1,mod(t,${B}));st(2,mod(t,${B}/2));st(3,mod(floor(t/(${B}/2)),3));` +
  `0.55*sin(2*PI*(50+70*exp(-30*ld(1)))*ld(1))*exp(-9*ld(1))` +                                  // kick
  `+0.18*(2*random(0)-1)*exp(-40*ld(2))*gte(mod(t,${B}),${B}/2-0.001)` +                          // offbeat hat
  `+0.30*(2*random(1)-1)*exp(-18*mod(t+${B},2*${B}))*lt(mod(t+${B},2*${B}),0.2)` +                 // clap 2&4
  `+0.30*sin(2*PI*${pk(0)}/2*t)*exp(-6*ld(2))` +                                                  // pluck bass
  `+0.16*sin(2*PI*if(eq(ld(3),0),${pk(0)},if(eq(ld(3),1),${pk(1)},${pk(2)}))*2*t)*exp(-10*ld(2))` + // marimba arp
  `+gte(t,${drop})*0.12*(2*mod(${pk(0)}*t,1)-1)*exp(-4*ld(2))`, T, 'mus_r.wav');                  // saw lead after drop
const speech = L.map(l => `between(t,${l.t},${(l.t + l.d).toFixed(2)})`).join('+');
ff(['-i', W('mus_r.wav'), '-af', `lowpass=f=7000,volume='if(between(t,${at(2)},${at(2) + 1.1}),0.05,if(${speech},0.28,0.75))':eval=frame,afade=t=out:st=${T - 1}:d=1,loudnorm=I=-20`, W('music.wav')]);
const parts = [['music.wav', 0, 1], ...L.map(l => [`v${l.i}.wav`, l.t, 1.15]), ...G.filter(g => g.sfx).map(g => [g.sfx + '.wav', g.t, 0.55])];
const inp = [], fl = [];
// original game audio, low
inp.push('-i', W('src.mp4')); fl.push(`[0:a]atrim=0:${T},volume=0.10,aresample=44100,aformat=channel_layouts=mono[x0]`);
parts.forEach(([f, t, v], i) => { inp.push('-i', W(f)); fl.push(`[${i + 1}:a]aresample=44100,aformat=channel_layouts=mono,volume=${v},adelay=${Math.round(t * 1000)}[x${i + 1}]`); });
fl.push(Array.from({ length: parts.length + 1 }, (_, i) => `[x${i}]`).join('') + `amix=inputs=${parts.length + 1}:normalize=0,alimiter=limit=0.95,apad[a]`);
ff([...inp, '-filter_complex', fl.join(';'), '-map', '[a]', '-t', String(T), '-ac', '2', '-c:a', 'aac', '-b:a', '192k', W('audio.m4a')]);
console.log('audio ok', T);
(async () => {
  const br = await chromium.launch(); const pg = await br.newPage({ viewport: { width: 1080, height: 1920 } });
  await pg.goto('file://' + W('tpl.html')); await pg.evaluate(() => document.fonts.ready);
  await pg.evaluate(([tl, g]) => window.setup(tl, g), [TL, G]);
  const enc = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-i', W('audio.m4a'), '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-shortest', '-movflags', '+faststart', W('out.mp4')], { stdio: ['pipe', 'inherit', 'inherit'] });
  const N = Math.round(T * FPS), only = process.argv[2] ? process.argv[2].split(',').map(Number) : null;
  for (let f = 0; f < N; f++) {
    if (only && !only.includes(f)) continue;
    await pg.evaluate(x => window.render(x), f / FPS);
    await pg.waitForFunction(() => document.getElementById('g').complete);
    const b = await pg.screenshot({ type: 'jpeg', quality: 90 });
    if (only) fs.writeFileSync(W(`chk-${f}.jpg`), b); else if (!enc.stdin.write(b)) await new Promise(r => enc.stdin.once('drain', r));
  }
  enc.stdin.end(); await new Promise(r => enc.on('close', r)); await br.close(); console.log('done');
})().catch(e => { console.error(e); process.exit(1); });
