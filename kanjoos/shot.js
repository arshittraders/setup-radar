// node shot.js cfg.json t1,t2.. outprefix [amp]
const {chromium}=require('playwright'); const fs=require('fs');
(async()=>{const cfg=JSON.parse(fs.readFileSync(process.argv[2]));const ts=process.argv[3].split(',').map(Number);const amp=+(process.argv[5]||0);
const br=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const pg=await br.newPage({viewport:{width:1080,height:1920}}); pg.on('pageerror',e=>console.log('ERR',e.message));
await pg.goto('http://localhost:8765/page.html'); await pg.waitForFunction('window.ready'); await pg.evaluate(c=>setup(c),cfg);
for(const t of ts){ const d=await pg.evaluate(([t,a])=>{const u=frame(t,a,'');return {u,dbg:window.__dbg}},[t,amp]); fs.writeFileSync(`${process.argv[4]}-${t}.jpg`,Buffer.from(d.u.split(',')[1],'base64')); console.log(t,JSON.stringify(d.dbg)); }
await br.close();})();
