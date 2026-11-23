function chip(s,cx,cy,a,col='#fff',bg='rgba(0,0,0,.55)'){x.save();x.globalAlpha=a;x.font='800 62px BD';const w=x.measureText(s).width+70;x.fillStyle=bg;x.beginPath();x.roundRect(cx-w/2,cy-55,w,100,50);x.fill();x.fillStyle=col;x.textAlign='center';x.fillText(s,cx,cy+18);x.restore()}
function igate(cx,by,s,glow=0){x.save();x.translate(cx,by);x.scale(s,s);
 x.fillStyle='#d9a877';x.fillRect(-300,-760,600,760);x.fillStyle='#c48e5c';x.fillRect(-340,-820,680,70);x.fillRect(-250,-900,500,90);x.fillStyle='#b07a4a';x.fillRect(-200,-960,400,70);
 x.fillStyle='#e8c49a';x.fillRect(-320,-60,640,60);
 x.fillStyle='#2a1a2a';x.beginPath();x.moveTo(-130,0);x.lineTo(-130,-430);x.arc(0,-430,130,Math.PI,0);x.lineTo(130,0);x.fill();
 x.strokeStyle='#a06a3a';x.lineWidth=6;for(let k=0;k<6;k++){x.beginPath();x.moveTo(-290,-700+k*20);x.lineTo(-160,-700+k*20);x.stroke();x.beginPath();x.moveTo(160,-700+k*20);x.lineTo(290,-700+k*20);x.stroke()}
 x.fillStyle='#8a5a30';x.font='800 46px BD';x.textAlign='center';x.fillText('INDIA',0,-640);
 if(glow){x.fillStyle=`rgba(255,160,40,${glow})`;x.shadowColor='#ffb030';x.shadowBlur=60;x.beginPath();x.ellipse(0,-990,40,60,0,0,7);x.fill();x.shadowBlur=0}
 x.restore()}
function flame(cx,cy,s,t){x.save();x.translate(cx,cy);x.scale(s,s);x.shadowColor='#ff9a20';x.shadowBlur=50;for(let k=0;k<3;k++){x.fillStyle=['#ff5a10','#ffa020','#fff0a0'][k];const h=200-k*55+10*Math.sin(t*12+k);x.beginPath();x.moveTo(-60+k*20,0);x.quadraticCurveTo(-50+k*15,-h*.6,0,-h);x.quadraticCurveTo(50-k*15,-h*.6,60-k*20,0);x.fill()}x.shadowBlur=0;x.fillStyle='#333';x.fillRect(-90,0,180,40);x.restore()}
function lawn(y){x.fillStyle='#4a7a3a';x.fillRect(-W,y,W*3,900);x.fillStyle='#c8b090';x.fillRect(-W,y+40,W*3,60)}
window.EP={title:'इंडिया गेट:<br>किसकी याद में? 🇮🇳',badges:['~42 मीटर ऊँचा 📏','13,000+ नाम ✍️'],badgeScene:5,em:'इंडिया|गेट|सैनिकों|विश्व|युद्ध|उन्नीस|इक्कीस|इकत्तीस|लुटियंस|बयालीस|तेरह|हज़ार|अमर|जवान|ज्योति|स्मारक|शहीद',capTop:{},SC:[
 (u,d,t)=>{cam(1.14-.1*eo(cl(u/d)));sky(t,'#1a2a5a','#e08a50','#ffc080');sun(820,900,80,.8);igate(540,1500,.75);lawn(1490)},
 (u,d,t)=>{cam(1.05);sky(t,'#3a7ac0','#b0d0f0','#f4e4c4');igate(540,1560,.85);lawn(1550);x.setTransform(1,0,0,1,0,0);txt('इंडिया गेट 📍',540,330,116,'#ffd23f',pr(u,.3,.4));txt('नई दिल्ली',540,460,80,'#fff',pr(u,1,.4))},
 (u,d,t)=>{cam(1.04);plain(t,'#2a2a3a','#7a6a4a');for(let i=0;i<6;i++)man(170+i*150,1100,3.2,0);emo('🎖️',540,700,150,pr(u,.6,.4));x.setTransform(1,0,0,1,0,0);txt('पहला विश्व युद्ध ⚔️',540,420,96,'#ffd23f',pr(u,.2,.4));txt('1914 – 1918',540,550,80,'#fff',pr(u,1,.4))},
 (u,d,t)=>{cam(1.03);x.fillStyle='#14213d';x.fillRect(-W,-H,W*3,H*3);x.setTransform(1,0,0,1,0,0);txt('नींव 🧱',540,420,104,'#ffd23f',pr(u,.2,.4));chip('1921',540,620,pr(u,.6,.4),'#fff');txt('↓',540,770,90,'#ffd23f',pr(u,1.6,.4));chip('1931 ✅',540,920,pr(u,2.2,.4),'#ffd23f')},
 (u,d,t)=>{cam(1.04);x.fillStyle='#f0e4cc';x.fillRect(-W,-H,W*3,H*3);paper(540,850,1.3,[['NEW DELHI',60],['─ ┼ ─ ┼ ─',50],['⌂  ◯  ⌂',70]],pr(u,.2,.4),-.04);x.setTransform(1,0,0,1,0,0);x.strokeStyle='#1a3a8a';x.lineWidth=8;const p=pr(u,.6,d*.6);x.beginPath();x.moveTo(300,1080);x.lineTo(300+480*p,1080);x.stroke();x.setTransform(1,0,0,1,0,0);txt('एडविन लुटियंस ✏️',540,420,92,'#b5341a',pr(u,.3,.4))},
 (u,d,t)=>{cam(1.02+.05*eo(cl(u/d)));sky(t,'#3a7ac0','#b0d0f0','#f4e4c4');igate(540,1700,1.05);man(180,1690,2.2,0);lawn(1690)},
 (u,d,t)=>{cam(1.04);sky(t,'#05071a','#1a1240','#3a2a3a');flame(540,1050,1.5,t);x.setTransform(1,0,0,1,0,0);txt('अमर जवान ज्योति 🔥',540,420,90,'#ffd23f',pr(u,.3,.4));txt('1972',540,560,84,'#fff',pr(u,1,.4))},
 (u,d,t)=>{cam(1.04);sky(t,'#1a2a5a','#e08a50','#ffc080');igate(540,1560,.8,.8);lawn(1550);x.setTransform(1,0,0,1,0,0);
   txt('गए हो? 👇',540,330,110,'#ffd23f',pr(u,.3,.4));const p=pr(u,1.2,.4);x.globalAlpha=p;x.fillStyle='#fff';x.beginPath();x.roundRect(240,430,600,120,60);x.fill();x.font='800 60px BD';x.textAlign='center';x.fillStyle='#b5341a';x.fillText('🔔 Follow करो',540,510);x.globalAlpha=1}
]};
