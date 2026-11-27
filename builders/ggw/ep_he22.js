function ground(y,col='#8a7a4a'){x.fillStyle=col;x.fillRect(-W,y,W*3,H)}
// Brihadeeswarar vimana: square base + 13 receding tiers + dome capstone (kumbam). glow = capstone glow
function vimana(cx,by,s,glow=0,rev=1){x.save();x.translate(cx,by);x.scale(s,s);
 if(rev<1){x.beginPath();x.rect(-700,-1300*rev,1400,1400*rev+20);x.clip()}
 const st='#c49a62',dk='#9a7444',lt='#e0bc84';
 x.fillStyle=dk;x.fillRect(-330,-60,660,60);x.fillStyle=st;x.fillRect(-300,-300,600,240);
 x.fillStyle=dk;for(let k=-260;k<=260;k+=65){x.fillRect(k-14,-290,28,220)}x.fillStyle=lt;x.fillRect(-320,-320,640,22);
 x.fillStyle='#3a2a1a';x.beginPath();x.roundRect(-46,-190,92,130,[46,46,0,0]);x.fill();
 let y=-320;for(let i=0;i<13;i++){const w=560-i*36,h=58;x.fillStyle=i%2?dk:st;x.fillRect(-w/2,y-h,w,h);x.fillStyle=lt;x.fillRect(-w/2-8,y-h,w+16,9);
  x.fillStyle='rgba(60,40,20,.35)';for(let k=-w/2+24;k<w/2-10;k+=48)x.fillRect(k,y-h+18,18,30);y-=h}
 x.fillStyle=st;x.fillRect(-60,y-30,120,30);
 if(glow>0){const g=x.createRadialGradient(0,y-80,10,0,y-80,260);g.addColorStop(0,`rgba(255,220,120,${.6*glow})`);g.addColorStop(1,'rgba(255,220,120,0)');x.fillStyle=g;x.fillRect(-300,y-360,600,560)}
 x.fillStyle='#d8a848';x.beginPath();x.ellipse(0,y-80,96,62,0,Math.PI,0);x.fill();x.fillRect(-96,y-82,192,52);x.fillStyle='#b88a30';x.fillRect(-100,y-36,200,10);
 x.fillStyle='#f0c860';x.beginPath();x.moveTo(-14,y-140);x.lineTo(0,y-200);x.lineTo(14,y-140);x.fill();x.beginPath();x.arc(0,y-142,18,0,7);x.fill();
 x.restore()}
function gopuram(cx,by,s){x.save();x.translate(cx,by);x.scale(s,s);x.fillStyle='#b48a56';for(let i=0;i<5;i++){const w=300-i*40;x.fillRect(-w/2,-80-i*50,w,52)}x.fillStyle='#3a2a1a';x.fillRect(-40,-80,80,80);x.fillStyle='#a07a46';x.fillRect(-170,-80,340,80);x.fillStyle='#3a2a1a';x.fillRect(-40,-80,80,80);x.fillStyle='#d8a848';x.fillRect(-60,-350,120,26);x.restore()}
function nandi(cx,by,s){x.save();x.translate(cx,by);x.scale(s,s);x.fillStyle='rgba(0,0,0,.25)';x.beginPath();x.ellipse(0,4,230,30,0,0,7);x.fill();
 x.fillStyle='#4a4648';x.fillRect(-240,-40,480,40);x.fillStyle='#5a5658';x.beginPath();x.ellipse(-10,-140,190,100,0,0,7);x.fill();
 x.beginPath();x.moveTo(-60,-220);x.quadraticCurveTo(0,-300,60,-220);x.fill();
 x.beginPath();x.ellipse(170,-200,70,60,-.3,0,7);x.fill();x.fillStyle='#4a4648';x.beginPath();x.ellipse(215,-170,40,34,-.3,0,7);x.fill();
 x.strokeStyle='#5a5658';x.lineWidth=18;x.lineCap='round';x.beginPath();x.moveTo(150,-245);x.lineTo(120,-300);x.moveTo(190,-250);x.lineTo(210,-305);x.stroke();
 x.fillStyle='#d8a848';x.fillRect(90,-150,24,90);x.fillStyle='#c0392b';x.beginPath();x.arc(102,-60,14,0,7);x.fill();x.restore()}
function linga(cx,by,s){x.save();x.translate(cx,by);x.scale(s,s);x.fillStyle='#2a2a30';x.beginPath();x.ellipse(0,-40,200,44,0,0,7);x.fill();x.fillRect(-200,-40,200*2,40);x.fillRect(180,-56,90,30);x.beginPath();x.roundRect(-80,-300,160,280,[80,80,0,0]);x.fill();
 x.fillStyle='#f0f0f0';for(let k=0;k<3;k++)x.fillRect(-60,-230+k*26,120,10);x.fillStyle='#c0392b';x.beginPath();x.arc(0,-185,12,0,7);x.fill();x.restore()}
function lamp(cx,cy,t){const f=1+.15*Math.sin(t*13+cx);const g=x.createRadialGradient(cx,cy,0,cx,cy,90*f);g.addColorStop(0,'rgba(255,200,90,.7)');g.addColorStop(1,'rgba(255,160,60,0)');x.fillStyle=g;x.fillRect(cx-100,cy-100,200,200);x.fillStyle='#ffd27a';x.beginPath();x.ellipse(cx,cy,9,18*f,0,0,7);x.fill();x.fillStyle='#8a5a20';x.fillRect(cx-20,cy+16,40,10)}
function blocks(cx,by,s,t){x.save();x.translate(cx,by);x.scale(s,s);x.fillStyle='#7a7470';for(let r=0;r<3;r++)for(let k=0;k<4-r;k++){x.fillRect(-200+k*100+r*50,-(r+1)*80,92,74)}x.fillStyle='rgba(255,255,255,.15)';for(let r=0;r<3;r++)for(let k=0;k<4-r;k++)x.fillRect(-200+k*100+r*50,-(r+1)*80,92,10);x.restore()}
function eleph(cx,by,s,dir=1){x.save();x.translate(cx,by);x.scale(s*dir,s);x.fillStyle='#5a5a62';x.beginPath();x.ellipse(0,-90,90,60,0,0,7);x.fill();[-60,-25,30,62].forEach(lx=>x.fillRect(lx-13,-60,26,60));x.beginPath();x.ellipse(95,-110,42,40,0,0,7);x.fill();x.fillStyle='#4a4a52';x.beginPath();x.ellipse(70,-112,26,36,0,0,7);x.fill();x.fillStyle='#5a5a62';x.beginPath();x.moveTo(120,-100);x.quadraticCurveTo(150,-40,128,0);x.lineTo(112,0);x.quadraticCurveTo(128,-40,104,-90);x.fill();x.restore()}
window.EP={title:'बृहदेश्वर मंदिर:<br>1000 साल पुराना! 🛕',badges:['ग्रेनाइट 🪨','दूर से लाया गया 🐘'],badgeScene:4,em:'हज़ार|मंदिर|चोटी|पत्थर|अस्सी|टन|बृहदेश्वर|तमिलनाडु|तंजावुर|पेरिया|कोविल|बड़ा|चोल|राजराज|प्रथम|दस|विमान,|शिखर,|छियासठ|मीटर|ग्रेनाइट|शिव|लिंग|नंदी|सत्तासी|यूनेस्को',capTop:{},SC:[
 (u,d,t)=>{cam(1.14-.1*eo(cl(u/d)));sky(t,'#0a0c24','#2a1a40','#a05a3a');ground(1640,'#3a2e1e');vimana(540,1640,.7,.7+.3*Math.sin(t*2));rays(t,540,820,'255,210,120',.09)},
 (u,d,t)=>{cam(1.04);sky(t,'#3a7ac0','#b0d0f0','#f0e0c0');ground(1500);gopuram(170,1520,.75);vimana(600,1500,.8);x.setTransform(1,0,0,1,0,0);txt('तंजावुर, तमिलनाडु 📍',540,360,94,'#ffd23f',pr(u,.3,.4));txt('पेरिया कोविल = बड़ा मंदिर',540,500,72,'#fff',pr(u,1,.4))},
 (u,d,t)=>{cam(1.03+.04*eo(cl(u/d)));sky(t,'#f0a060','#f8c890','#f0e0c0');sun(860,700,70,.9);ground(1500);vimana(540,1500,.8);emo('👑',540,1640,120,pr(u,.6,.4));x.setTransform(1,0,0,1,0,0);txt('राजराज चोल प्रथम 👑',540,360,92,'#ffd23f',pr(u,.3,.4));txt('सन 1010 में पूरा ✅',540,500,80,'#fff',pr(u,1,.4))},
 (u,d,t)=>{cam(1.04);sky(t,'#3a7ac0','#b0d0f0','#f0e0c0');ground(1500);const r=eo(pr(u,.3,d*.6));vimana(540,1500,.8,0,.12+.88*r);man(870,1500,2.2,0);x.strokeStyle='#ffd23f';x.lineWidth=10;x.beginPath();x.moveTo(930,1500);x.lineTo(930,1500-1000*r);x.stroke();x.fillStyle='#ffd23f';x.beginPath();x.moveTo(906,1500-1000*r+20);x.lineTo(930,1500-1000*r-10);x.lineTo(954,1500-1000*r+20);x.fill();x.setTransform(1,0,0,1,0,0);txt('~66 मीटर ऊँचा 📏',540,360,100,'#ffd23f',pr(u,.3,.4));txt('विमान = मुख्य शिखर',540,500,80,'#fff',pr(u,1,.4))},
 (u,d,t)=>{cam(1.03+.03*eo(cl(u/d)));sky(t,'#3a7ac0','#b0d0f0','#f0e0c0');ground(1450,'#9a8a5a');x.fillStyle='#b8a878';x.fillRect(-W,1560,W*3,60);const m=((u*90)%1400)-300;blocks(m+260,1600,.7,t);x.strokeStyle='#6a4a2a';x.lineWidth=7;x.beginPath();x.moveTo(m+400,1560);x.lineTo(m+560,1500);x.stroke();eleph(m+640,1600,1.1,1);eleph(m+870,1600,1,1)},
 (u,d,t)=>{cam(1.04);x.fillStyle='#2a1a10';x.fillRect(-W,-H,W*3,H*3);ground(1500,'#3a2a1a');[[140,980],[940,980]].forEach(([a,b])=>lamp(a,b,t));linga(540,1020,1.05);nandi(540,1760,.85);x.setTransform(1,0,0,1,0,0);txt('भगवान शिव 🔱',540,360,104,'#ffd23f',pr(u,.3,.4));txt('नंदी: एक ही पत्थर से!',540,500,78,'#fff',pr(u,1,.4))},
 (u,d,t)=>{cam(1.04);sky(t,'#3a7ac0','#b0d0f0','#f0e0c0');ground(1500);vimana(540,1500,.8);if(u>d*.45){for(let k=0;k<26;k++){const a=k*2.4,r=(u-d*.45)*260%700;x.fillStyle=['#ffd23f','#ff5a3a','#7CFF6B','#4ab0ff'][k%4];x.fillRect(540+Math.cos(a)*r,700+Math.sin(a)*r*.7+r*.3,16,16)}}x.setTransform(1,0,0,1,0,0);txt('1987 🏆 UNESCO',540,360,100,'#ffd23f',pr(u,.3,.4));txt('2010: 1000 साल पूरे! 🎉',540,500,80,'#fff',pr(u,d*.45,.4))},
 (u,d,t)=>{cam(1.04);sky(t,'#0a0c24','#2a1a40','#a05a3a');ground(1640,'#3a2e1e');vimana(540,1640,.72,.6);x.setTransform(1,0,0,1,0,0);
   txt('पता था? 👇',540,330,110,'#ffd23f',pr(u,.3,.4));const p=pr(u,1.2,.4);x.globalAlpha=p;x.fillStyle='#fff';x.beginPath();x.roundRect(240,430,600,120,60);x.fill();x.font='800 60px BD';x.textAlign='center';x.fillStyle='#b5341a';x.fillText('🔔 Follow करो',540,510);x.globalAlpha=1}
]};
