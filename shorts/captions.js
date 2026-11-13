// Word-level timings for karaoke captions.
// Whisper (via /api/shorts align) gives word times for the processed voice clip; our own display words are then
// mapped onto that timeline by character position, so spelling differences between Whisper and the script don't matter.
// Falls back to an even spread if Whisper is unavailable.
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const API = process.env.SHORTS_API || 'https://setup-radar.vercel.app/api/shorts';

async function token() {
  const u = process.env.ACTIONS_ID_TOKEN_REQUEST_URL, t = process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN;
  if (u && t) { try { const r = await fetch(u + '&audience=setup-radar-shorts', { headers: { Authorization: 'bearer ' + t } }); const j = await r.json(); if (j.value) return j.value; } catch (_) { } }
  return process.env.OIDC || process.env.OIDC_V || '';
}
const clean = w => String(w || '').replace(/["“”'‘’.,!?…।:;()\-–—]/g, '');
const len = w => Math.max(1, [...clean(w)].length);

function spread(words, dur) {
  const L = words.reduce((a, w) => a + len(w), 0); let c = 0;
  return words.map(w => { const s = c / L * dur; c += len(w); return { w, s, e: c / L * dur }; });
}
function mapOnto(words, W) {
  // W: whisper words [{w,s,e}] ; returns display words with times
  const cumW = [0]; W.forEach(x => cumW.push(cumW[cumW.length - 1] + len(x.w)));
  const LW = cumW[cumW.length - 1], LT = words.reduce((a, w) => a + len(w), 0);
  const at = f => { const p = f * LW; let k = 0; while (k < W.length - 1 && cumW[k + 1] <= p) k++; const x = W[k], frac = Math.min(1, Math.max(0, (p - cumW[k]) / len(x.w))); return x.s + frac * (x.e - x.s); };
  let c = 0;
  return words.map(w => { const s = at(c / LT); c += len(w); return { w, s, e: Math.max(s + 0.05, at(c / LT)) }; });
}
// wav: processed clip; text: what to show on screen
async function wordTimes(wav, text) {
  const words = String(text || '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  const dur = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', wav]).toString().trim());
  if (!words.length) return [];
  try {
    const mp3 = wav.replace(/\.wav$/, '') + '.cap.mp3';
    execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', wav, '-ac', '1', '-ar', '16000', '-b:a', '48k', mp3]);
    for (let i = 1; i <= 3; i++) {
      try {
        const r = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + await token() }, body: JSON.stringify({ action: 'align', mp3: fs.readFileSync(mp3).toString('base64') }) });
        const j = await r.json();
        if (j.ok && j.words && j.words.length) return mapOnto(words, j.words.filter(x => x.e > x.s || x.w));
        if (j.ok) break;
      } catch (_) { }
      await new Promise(r => setTimeout(r, 2000 * i));
    }
  } catch (_) { }
  return spread(words, dur);
}
// browser-side renderer (inlined into templates): chunk of ≤5 words around the spoken word, active word popped + coloured
const CLIENT = `
window.karaoke=function(el,segs,t,opt){opt=opt||{};
  const g=segs.find(x=>x.words&&t>=x.start-0.05&&t<x.end+0.35); if(!g){el.style.opacity=0;return;}
  const lt=t-g.start, W=g.words; let k=W.findIndex(w=>lt<w.e); if(k<0)k=W.length-1;
  if(!g._ch){g._ch=[];let cur=[];W.forEach((w,i)=>{cur.push(i);if(cur.length>=(opt.max||4)||/[.!?…।,]$/.test(w.w)){g._ch.push(cur);cur=[];}});if(cur.length)g._ch.push(cur);}
  const ch=g._ch.find(c=>c.includes(k))||g._ch[0]; const key=g.start+':'+ch[0];
  if(el._k!==key){el._k=key;el.innerHTML=ch.map(i=>'<span data-i="'+i+'">'+W[i].w.replace(/</g,'&lt;')+'</span>').join(' ');}
  el.style.opacity=1;
  [...el.children].forEach(s=>{const i=+s.dataset.i,w=W[i];const on=lt>=w.s-0.03&&lt<w.e+0.05, done=lt>=w.e;
    s.style.color=on?(opt.on||'#ffe14d'):(done?(opt.done||'#ffffff'):(opt.off||'rgba(255,255,255,.75)'));
    const p=on?Math.min(1,(lt-w.s+0.03)/0.1):0; s.style.transform='scale('+(1+0.13*p)+')';
    s.style.display='inline-block';s.style.transition='none';});
};`;
module.exports = { wordTimes, CLIENT };
