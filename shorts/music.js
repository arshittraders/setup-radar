// Generates an upbeat 124 BPM royalty-free backing track (synth: kick, clap, hats, bass, pluck arp) with ffmpeg.
// usage: node shorts/music.js <seconds> <out.wav> [variant]
const { execFileSync } = require('child_process');
const [secArg, out, vArg] = process.argv.slice(2);
const SEC = Number(secArg) || 50;
const BPM = 124, P = (60 / BPM).toFixed(5); // beat
const V = Number(vArg) || 0;
// 4 progressions, picked by variant (day) so tracks vary
const PROG = [
  [[55, 440, 523.25, 659.25], [43.65, 349.23, 440, 523.25], [65.41, 523.25, 659.25, 783.99], [49, 392, 493.88, 587.33]], // Am F C G
  [[65.41, 523.25, 659.25, 783.99], [49, 392, 493.88, 587.33], [55, 440, 523.25, 659.25], [43.65, 349.23, 440, 523.25]], // C G Am F
  [[73.42, 587.33, 698.46, 880], [58.27, 466.16, 587.33, 698.46], [43.65, 349.23, 440, 523.25], [65.41, 523.25, 659.25, 783.99]], // Dm Bb F C
  [[41.2, 329.63, 392, 493.88], [65.41, 523.25, 659.25, 783.99], [49, 392, 493.88, 587.33], [73.42, 587.33, 698.46, 880]] // Em C G D
][V % 4];
// chord index c = mod(floor(t/(4P)),4)  -> st(0,c)
const pick = j => `if(eq(ld(0),0),${PROG[0][j]},if(eq(ld(0),1),${PROG[1][j]},if(eq(ld(0),2),${PROG[2][j]},${PROG[3][j]})))`;
const C = `st(0,mod(floor(t/(4*${P})),4))`;
const kick = `st(1,mod(t,${P}));1.4*sin(2*PI*(48*ld(1)+4.4*(1-exp(-26*ld(1)))))*exp(-8*ld(1))`;
const clap = `st(1,mod(t-${P},2*${P}));if(lt(t,${P}),0,0.32*(2*random(1)-1)*exp(-22*ld(1)))`;
const hats = `0.14*(2*random(2)-1)*exp(-70*mod(t+${P}/2,${P}))+0.05*(2*random(3)-1)*exp(-110*mod(t,${P}/4))`;
const bass = `${C};st(2,${pick(0)});st(1,mod(t,${P}/2));0.34*(sin(2*PI*ld(2)*t)+0.35*sin(4*PI*ld(2)*t))*min(1,ld(1)*60)*exp(-5*ld(1))*min(1,mod(t,${P})*12)`;
const arp = `${C};st(3,mod(floor(t/(${P}/4)),4));st(2,if(eq(ld(3),0),${pick(1)},if(eq(ld(3),1),${pick(2)},if(eq(ld(3),2),${pick(3)},${pick(2)}))));st(1,mod(t,${P}/4));0.075*(sin(2*PI*ld(2)*t)+0.4*sin(4*PI*ld(2)*t))*exp(-13*ld(1))`;
const pad = `${C};0.025*(sin(2*PI*${pick(1)}*t)+sin(2*PI*${pick(2)}*t)+sin(2*PI*${pick(3)}*t))*(0.7+0.3*sin(2*PI*t/(${P}*2)))`;
const parts = [kick, clap, hats, bass, arp, pad];
const args = ['-y', '-v', 'error'];
parts.forEach(e => args.push('-f', 'lavfi', '-i', `aevalsrc='${e}':s=44100:d=${SEC}`));
const fade = Math.max(0, SEC - 1.5).toFixed(2);
args.push('-filter_complex',
  parts.map((_, i) => `[${i}:a]`).join('') + `amix=inputs=${parts.length}:normalize=0,highpass=f=30,acompressor=threshold=-14dB:ratio=3:attack=10:release=120,volume=0.9,` +
  `aecho=0.8:0.5:${Math.round(P * 750)}:0.12,afade=t=in:d=0.3,afade=t=out:st=${fade}:d=1.5,loudnorm=I=-15:TP=-1.5,alimiter=limit=0.9[a]`,
  '-map', '[a]', '-ac', '2', out);
execFileSync('ffmpeg', args);
module.exports = { BPM };
