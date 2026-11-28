// node render.js voiceDir bg.png out.mp4
const fs=require('fs'), cp=require('child_process'), path=require('path');
const [VD,BG,OUT]=process.argv.slice(2); const FPS=30;
const S=JSON.parse(fs.readFileSync(require('path').join(__dirname,'script.json')));
const dur=f=>+cp.execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${f}"`).toString();
let t=0.6; const tl=[], parts=[]; let total;
if(process.env.FULL){ const LEAD=0.5; const segs=JSON.parse(fs.readFileSync(process.env.SEGS)); segs.forEach((g,i)=>tl.push({anim:S[i].anim,start:g[0]+LEAD,end:g[1]+LEAD,text:S[i].cap||S[i].text})); total=dur(process.env.FULL)+LEAD+1.2;
  cp.execSync(`ffmpeg -loglevel error -y -i "${process.env.FULL}" -af "adelay=${LEAD*1000}|${LEAD*1000},apad,atrim=0:${total.toFixed(2)},loudnorm=I=-14:TP=-1.5" -ar 44100 voice.wav`);
} else {
S.forEach((s,i)=>{ const f=path.join(VD,`ku-${i}.mp3`); const d=dur(f); tl.push({anim:s.anim,start:t,end:t+d,text:s.text}); parts.push({f,at:t}); t+=d+0.4; });
total=t+1.0;
const inp=parts.map(p=>`-i "${p.f}"`).join(' '); const fl=parts.map((p,i)=>`[${i}]adelay=${Math.round(p.at*1000)}|${Math.round(p.at*1000)}[a${i}]`).join(';')+';'+parts.map((p,i)=>`[a${i}]`).join('')+`amix=inputs=${parts.length}:normalize=0,apad,atrim=0:${total.toFixed(2)},loudnorm=I=-14:TP=-1.5[o]`;
cp.execSync(`ffmpeg -loglevel error -y ${inp} -filter_complex "${fl}" -map "[o]" -ar 44100 voice.wav`);
}
if(process.env.MODE==='audio'){ console.log('frames total',Math.ceil(total*FPS)); process.exit(0); }
const raw=cp.execSync(`ffmpeg -loglevel error -i voice.wav -ac 1 -ar 16000 -f s16le -`,{maxBuffer:1e9}); const N=Math.ceil(total*FPS); const amp=[]; const spf=16000/FPS;
for(let k=F0;k<F1;k++){ let s=0,n=0; for(let j=Math.floor(k*spf);j<Math.min(raw.length/2,(k+1)*spf);j++){ const v=raw.readInt16LE(j*2)/32768; s+=v*v; n++; } amp.push(n?Math.sqrt(s/n):0); }
const mx=amp.slice().sort((a,b)=>a-b)[Math.floor(N*0.97)]||1; const A=amp.map((a,k)=>Math.min(1,a/mx)); for(let k=1;k<N;k++) A[k]=Math.max(A[k], A[k-1]*0.55);
(async()=>{const {chromium}=require('playwright'); const br=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const pg=await br.newPage({viewport:{width:1080,height:1920}}); pg.on('pageerror',e=>console.log('ERR',e.message));
await pg.goto('http://localhost:8765/page.html'); await pg.waitForFunction('window.ready');
await pg.evaluate(c=>setup(c),{glb:'/'+(process.env.GLB||'ku.glb'),bg:'/'+BG,timeline:tl,rotY:0,faceYaw:0.25,cam:{x:0.05,y:1.32,z:3.6,ly:1.18,push:0.45},dur:total,mouth:[0,0.065,0.12],mscale:560,title:'KANJOOS UNCLE',titleDur:2.6});
const F0=+(process.env.F0||0), F1=Math.min(N, process.env.F1?+process.env.F1:N), CH=!!process.env.F1;
const ff=cp.spawn('ffmpeg',['-loglevel','error','-y','-f','image2pipe','-framerate',String(FPS),'-i','-',...(CH?[]:['-i','voice.wav']),'-c:v','libx264','-preset','medium','-crf','20','-pix_fmt','yuv420p',...(CH?['-an']:['-c:a','aac','-b:a','160k','-shortest']),'-movflags','+faststart',OUT],{stdio:['pipe','inherit','inherit']});
const t0=Date.now();
for(let k=F0;k<F1;k++){ const tt=k/FPS; const seg=tl.find(s=>tt>=s.start-0.1&&tt<=s.end+0.3); const u=await pg.evaluate(([a,b,c])=>frame(a,b,c),[tt,A[k],seg?seg.text:'']);
  if(!ff.stdin.write(Buffer.from(u.slice(23),'base64'))) await new Promise(r=>ff.stdin.once('drain',r)); if(k%90==0) console.log('frame',k,'/',N,((Date.now()-t0)/1000).toFixed(0)+'s'); }
ff.stdin.end(); await new Promise(r=>ff.on('close',r)); await br.close(); console.log('done',OUT,total.toFixed(1)+'s','frames',F0,F1,'of',N);})();
