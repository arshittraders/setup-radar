function chip(s,cx,cy,a,col='#fff',bg='rgba(0,0,0,.55)'){x.save();x.globalAlpha=a;x.font='800 62px BD';const w=x.measureText(s).width+70;x.fillStyle=bg;x.beginPath();x.roundRect(cx-w/2,cy-55,w,100,50);x.fill();x.fillStyle=col;x.textAlign='center';x.fillText(s,cx,cy+18);x.restore()}
function ground(y,col='#7a6a4a'){x.fillStyle=col;x.fillRect(-W,y,W*3,H)}
// basalt cliff with a carved-out pit (pit = 0..1 how deep the cut is shown)
function cliff(top,by,pit=1){x.fillStyle='#6a5a48';x.fillRect(-W,top,W*3,by-top+H);x.fillStyle='#5a4a3a';for(let k=0;k<14;k++)x.fillRect(-200+k*110,top+((k*53)%60),70,6);
 if(pit>0){const ph=(by-top)*pit;x.fillStyle='#3a2e24';x.fillRect(90,top,900,ph);x.fillStyle='#4a3c2e';x.beginPath();x.moveTo(90,top);x.lineTo(140,top+30);x.lineTo(140,top+ph);x.lineTo(90,top+ph);x.fill();x.beginPath();x.moveTo(990,top);x.lineTo(940,top+30);x.lineTo(940,top+ph);x.lineTo(990,top+ph);x.fill();x.fillStyle='#8a7a62';x.fillRect(-W,top-14,W*3,14)}}
function eleph(cx,by,s,dir=1){x.save();x.translate(cx,by);x.scale(s*dir,s);x.fillStyle='#8a7258';x.beginPath();x.ellipse(0,-90,90,60,0,0,7);x.fill();[-60,-25,30,62].forEach(lx=>x.fillRect(lx-13,-60,26,60));x.beginPath();x.ellipse(95,-110,42,40,0,0,7);x.fill();x.beginPath();x.ellipse(70,-112,26,36,0,0,7);x.fillStyle='#7a6248';x.fill();x.fillStyle='#8a7258';x.beginPath();x.moveTo(120,-100);x.quadraticCurveTo(150,-40,128,0);x.lineTo(112,0);x.quadraticCurveTo(128,-40,104,-90);x.fill();x.fillStyle='#e8dcc0';x.beginPath();x.moveTo(110,-88);x.quadraticCurveTo(140,-70,150,-80);x.lineTo(112,-78);x.fill();x.restore()}
// Kailasa temple: plinth with elephants, mandapa, tiered shikhara (rev = 0..1 reveal from TOP down)
function kailasa(cx,by,s,rev=1,eles=1){x.save();x.translate(cx,by);x.scale(s,s);
 if(rev<1){x.beginPath();x.rect(-600,-900,1200,900*rev+5);x.clip()}
 const st='#a88a68',dk='#8a6e50',lt='#c4a882';
 x.fillStyle=dk;x.fillRect(-380,-150,760,150);x.fillStyle=st;x.fillRect(-380,-160,760,20);
 if(eles){eleph(-250,0,.75,1);eleph(250,0,.75,-1);eleph(0,0,.6,1)}
 x.fillStyle=st;x.fillRect(-300,-330,600,170);x.fillStyle=dk;for(let k=-260;k<=260;k+=52)x.fillRect(k-10,-320,20,150);x.fillStyle=lt;x.fillRect(-320,-345,640,20);
 for(let i=0;i<6;i++){const w=300-i*42,h=62;x.fillStyle=i%2?dk:st;x.fillRect(-w/2,-345-(i+1)*h,w,h);x.fillStyle=lt;x.fillRect(-w/2-10,-345-(i+1)*h,w+20,10)}
 x.fillStyle=lt;x.beginPath();x.ellipse(0,-345-6*62-30,70,36,0,0,7);x.fill();x.fillStyle=dk;x.fillRect(-8,-345-6*62-110,16,60);x.beginPath();x.arc(0,-345-6*62-115,14,0,7);x.fill();
 x.fillStyle=st;x.fillRect(-470,-560,34,400);x.fillStyle=lt;x.fillRect(-484,-580,62,24);x.fillRect(436,-560,34,400);x.fillRect(422,-580,62,24);
 x.restore()}
function mtn(a){x.save();x.globalAlpha=a;x.fillStyle='#c8d0e0';x.beginPath();x.moveTo(-100,1100);x.lineTo(540,500);x.lineTo(1180,1100);x.fill();x.fillStyle='#fff';x.beginPath();x.moveTo(400,630);x.lineTo(540,500);x.lineTo(680,630);x.lineTo(610,600);x.lineTo(540,650);x.lineTo(470,600);x.fill();x.restore()}
window.EP={title:'कैलाश मंदिर:<br>एक ही चट्टान! 🪨',badges:['एक ही चट्टान 🪨','न ईंट, न जोड़ ❌'],badgeScene:4,em:'मंदिर|चट्टान|तराशा|एलोरा|कैलाश|महाराष्ट्र|गुफ़ा|सोलह|आठवीं|सदी|राष्ट्रकूट|कृष्ण|प्रथम|पहाड़|ऊपर|नीचे|शिखर|ईंट|हाथी,|शिव|पर्वत|तिरासी|यूनेस्को',capTop:{},SC:[
 (u,d,t)=>{cam(1.14-.1*eo(cl(u/d)));sky(t,'#0a0c24','#2a1a40','#a05a3a');cliff(860,1270,1);kailasa(540,1270,.74);rays(t,540,900,'255,200,140',.09)},
 (u,d,t)=>{cam(1.04);sky(t,'#3a7ac0','#b0d0f0','#f0e0c0');cliff(640,1230,1);kailasa(540,1230,.72);emo('📍',540,1380,1,0);x.setTransform(1,0,0,1,0,0);txt('एलोरा, महाराष्ट्र 📍',540,360,96,'#ffd23f',pr(u,.3,.4));txt('गुफ़ा नंबर 16',540,500,84,'#fff',pr(u,1,.4))},
 (u,d,t)=>{cam(1.03+.04*eo(cl(u/d)));sky(t,'#f0a060','#f8c890','#f0e0c0');sun(860,700,70,.9);cliff(640,1230,1);kailasa(540,1230,.72);x.setTransform(1,0,0,1,0,0);txt('8वीं सदी 👑',540,360,110,'#ffd23f',pr(u,.3,.4));txt('राष्ट्रकूट राजा कृष्ण प्रथम',540,500,70,'#fff',pr(u,1,.4))},
 (u,d,t)=>{cam(1.04);sky(t,'#3a7ac0','#b0d0f0','#f0e0c0');const r=pr(u,.4,d*.75);cliff(600,1240,r);kailasa(540,1240,.75,r);const cy=1240+.75*(-900+900*r);x.fillStyle='#ffd23f';x.globalAlpha=r<1?1:0;x.fillRect(90,cy-4,900,8);x.globalAlpha=1;emo('⛏️',150,cy-10,80,r<1?1:0);x.setTransform(1,0,0,1,0,0);txt('ऊपर ➜ नीचे ⬇️',540,360,104,'#ffd23f',pr(u,.3,.4));txt('पहले शिखर, फिर नीचे',540,500,78,'#fff',pr(u,1,.4))},
 (u,d,t)=>{cam(1.02+.04*eo(cl(u/d)));sky(t,'#3a7ac0','#b0d0f0','#f0e0c0');cliff(740,1300,1);kailasa(540,1300,.66)},
 (u,d,t)=>{cam(1.04);sky(t,'#2a4a8a','#8ab0e0','#e0d8c8');mtn(pr(u,.2,.8));cliff(1000,1250,1);kailasa(540,1250,.7);x.setTransform(1,0,0,1,0,0);txt('भगवान शिव 🔱',540,360,104,'#ffd23f',pr(u,.3,.4));txt('नाम: कैलाश पर्वत 🏔️',540,500,80,'#fff',pr(u,1,.4))},
 (u,d,t)=>{cam(1.04);sky(t,'#3a7ac0','#b0d0f0','#f0e0c0');cliff(640,1230,1);kailasa(540,1230,.72);x.setTransform(1,0,0,1,0,0);txt('1983 🏆',540,360,116,'#ffd23f',pr(u,.3,.4));txt('UNESCO विश्व धरोहर',540,500,80,'#fff',pr(u,1,.4))},
 (u,d,t)=>{cam(1.04);sky(t,'#0a0c24','#2a1a40','#a05a3a');cliff(1180,1600,1);kailasa(540,1600,.85);x.setTransform(1,0,0,1,0,0);
   txt('पता था? 👇',540,330,110,'#ffd23f',pr(u,.3,.4));const p=pr(u,1.2,.4);x.globalAlpha=p;x.fillStyle='#fff';x.beginPath();x.roundRect(240,430,600,120,60);x.fill();x.font='800 60px BD';x.textAlign='center';x.fillStyle='#b5341a';x.fillText('🔔 Follow करो',540,510);x.globalAlpha=1}
]};
