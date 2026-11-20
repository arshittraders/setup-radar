function note(cx,cy,s,lines,a=1,rot=0){x.save();x.globalAlpha=a;x.translate(cx,cy);x.rotate(rot);x.scale(s,s);const h=90+lines.length*110;x.fillStyle='#f5ecd2';x.shadowColor='rgba(0,0,0,.35)';x.shadowBlur=30;x.beginPath();x.roundRect(-420,-h/2,840,h,24);x.fill();x.shadowBlur=0;x.strokeStyle='#c9a54a';x.lineWidth=8;x.stroke();x.textAlign='center';lines.forEach((l,i)=>{x.font=(i?'800 72px ':'800 80px ')+'BD';x.fillStyle=i?'#3a2a1a':'#b5341a';x.fillText(l,0,-h/2+110+i*110)});x.restore()}
function fort(cx,by,s,flag,t){x.save();x.translate(cx,by);x.scale(s,s);const R='#b3402a',D='#8a2e1c',L='#d0603e',WH='#f3ece0';
 x.fillStyle=R;x.fillRect(-900,-300,1800,300);x.fillStyle=D;x.fillRect(-900,-40,1800,40);
 x.fillStyle=R;for(let i=-900;i<900;i+=60){x.beginPath();x.moveTo(i,-300);x.lineTo(i+15,-330);x.lineTo(i+45,-330);x.lineTo(i+60,-300);x.fill()}
 for(const tx of [-170,170]){x.fillStyle=R;x.fillRect(tx-70,-470,140,470);x.fillStyle=L;x.fillRect(tx-70,-470,25,470);x.fillStyle=WH;x.fillRect(tx-80,-490,160,22);x.beginPath();x.arc(tx,-490,60,Math.PI,0);x.fill();x.fillStyle='#c9a54a';x.fillRect(tx-3,-575,6,30)}
 x.fillStyle=R;x.fillRect(-100,-430,200,430);x.fillStyle='#3a1a12';x.beginPath();x.moveTo(-60,0);x.lineTo(-60,-200);x.quadraticCurveTo(0,-280,60,-200);x.lineTo(60,0);x.fill();
 x.fillStyle=WH;for(let k=-80;k<=80;k+=40){x.beginPath();x.arc(k,-440,18,Math.PI,0);x.fill()}
 if(flag){x.fillStyle='#ddd';x.fillRect(-4,-640,8,210);const wv=k=>Math.sin(t*5+k*.05)*10;const C=['#ff9933','#ffffff','#138808'];for(let r=0;r<3;r++){x.fillStyle=C[r];x.beginPath();x.moveTo(4,-640+r*36+wv(0));for(let k=0;k<=150;k+=10)x.lineTo(4+k,-640+r*36+wv(k));for(let k=150;k>=0;k-=10)x.lineTo(4+k,-604+r*36+wv(k));x.fill()}x.strokeStyle='#000080';x.lineWidth=3;x.beginPath();x.arc(79,-586+wv(75),12,0,7);x.stroke()}
 x.restore()}
function ground(y,c='#5a8a4a'){x.fillStyle=c;x.fillRect(-W,y,W*3,800)}
window.EP={title:'लाल क़िले<br>का राज़ 🏰',badges:['10 साल 🏗️','UNESCO 2007 🌍'],badgeScene:2,em:'लाल क़िला|पंद्रह अगस्त|तिरंगा|शाहजहाँ|ताजमहल|दस साल|क़िला-ए-मुबारक|बलुआ|तख़्त-ए-ताऊस|मयूर|कोहिनूर|यूनेस्को',capTop:{},SC:[
 (u,d,t)=>{cam(1.15-.1*eo(cl(u/d)));sky(t,'#24406a','#f0a060','#ffd8a8');sun(860,520,70,.8);fort(540,1500,.62,1,t);ground(1500);x.setTransform(1,0,0,1,0,0);txt('15 अगस्त 🇮🇳',540,700,110,'#ffd23f',pr(u,1.6,.4))},
 (u,d,t)=>{cam(1.05);sky(t,'#1b2a4a','#c87a6a','#f0c0a0');fort(540,1500,.62,0,t);ground(1500);x.setTransform(1,0,0,1,0,0);txt('शाहजहाँ 👑',540,430,110,'#ffd23f',pr(u,.3,.4));emo('🕌',540,640,120,pr(u,1,.3))},
 (u,d,t)=>{cam(1.04);sky(t,'#5a7aa0','#e0b080','#f8e0b8');const p=eo(cl(u/(d*.9)));x.save();x.globalAlpha=.3+.7*p;fort(540,1500,.62,0,t);x.restore();ground(1500,'#8a6a40');for(let i=0;i<8;i++)man(130+i*115,1570,1.5,Math.sin(t*4+i)*.3);x.setTransform(1,0,0,1,0,0);
   txt(String(Math.round(1638+10*p)),540,740,170,'#ffd23f',1);x.fillStyle='rgba(255,255,255,.25)';x.fillRect(190,830,700,26);x.fillStyle='#ffd23f';x.fillRect(190,830,700*p,26)},
 (u,d,t)=>{cam(1.05);plain(t,'#3a2a1a','#c49a6a');note(540,900,1.1,['क़िला-ए-मुबारक','“मुबारक क़िला”'],pr(u,.2,.5),-.04);x.setTransform(1,0,0,1,0,0);txt('असली नाम 📜',540,420,100,'#ffd23f',pr(u,.3,.4))},
 (u,d,t)=>{cam(1.1+.08*eo(cl(u/d)));x.fillStyle='#9a3522';x.fillRect(-W,-H,W*3,H*3);for(let r=0;r<16;r++)for(let c=0;c<6;c++){const ox=(r%2)*90;x.fillStyle=(r*7+c*3)%5?'#b3402a':'#c45a3a';x.fillRect(c*190-60+ox,r*125,180,115)}
   x.setTransform(1,0,0,1,0,0);x.fillStyle='rgba(0,0,0,.35)';x.fillRect(0,330,W,220);txt('लाल बलुआ पत्थर 🧱',540,450,96,'#fff',pr(u,.3,.4))},
 (u,d,t)=>{cam(1.05);const g=x.createRadialGradient(540,900,50,540,900,900);g.addColorStop(0,'#5a3a10');g.addColorStop(1,'#140a04');x.fillStyle=g;x.fillRect(-W,-H,W*3,H*3);rays(t,540,820,'255,210,120',.18);
   x.fillStyle='#d8a838';x.fillRect(330,980,420,90);x.fillRect(360,1070,30,200);x.fillRect(690,1070,30,200);x.fillRect(360,700,360,280);x.fillStyle='#f0c850';x.beginPath();x.arc(540,700,180,Math.PI,0);x.fill();
   emo('🦚',540,640,190,pr(u,.4,.4));emo('💎',540,880,120*(1+.08*Math.sin(t*6)),pr(u,1.6,.3));x.setTransform(1,0,0,1,0,0);txt('तख़्त-ए-ताऊस',540,400,100,'#ffd23f',pr(u,.3,.4))},
 (u,d,t)=>{cam(1.05);sky(t,'#2a5a9a','#a8d0f0','#f0f0e8');fort(540,1500,.62,1,t);ground(1500);x.setTransform(1,0,0,1,0,0);txt('UNESCO 🌍',540,430,110,'#ffd23f',pr(u,.3,.4));txt('2007',540,560,90,'#fff',pr(u,.8,.3))},
 (u,d,t)=>{cam(1.04);sky(t,'#24406a','#e8a070','#ffd8a8');fort(540,1560,.6,1,t);ground(1560);x.setTransform(1,0,0,1,0,0);
   txt('आप गए हो? 👇',540,430,110,'#ffd23f',pr(u,.3,.4));const p=pr(u,1.2,.4);x.globalAlpha=p;x.fillStyle='#fff';x.beginPath();x.roundRect(240,560,600,120,60);x.fill();x.font='800 60px BD';x.textAlign='center';x.fillStyle='#b5341a';x.fillText('🔔 Follow करो',540,640);x.globalAlpha=1}
]};
