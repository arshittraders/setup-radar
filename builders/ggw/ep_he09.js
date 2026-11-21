function gate(cx,by,s,col='#d8b070',sh='#a8804a',a=1,wob=0,t=0){x.save();x.globalAlpha=a;x.translate(cx,by);x.scale(s,s);if(wob)x.rotate(Math.sin(t*3)*.02);
 x.fillStyle=col;x.fillRect(-420,-520,840,520);x.fillRect(-480,-380,960,380);
 for(const tx of [-360,-120,120,360]){x.fillStyle=col;x.fillRect(tx-40,-640,80,120);x.fillStyle=sh;x.beginPath();x.arc(tx,-640,40,Math.PI,0);x.fill()}
 x.fillStyle='#2a1a10';x.beginPath();x.moveTo(-130,0);x.lineTo(-130,-280);x.quadraticCurveTo(0,-430,130,-280);x.lineTo(130,0);x.fill();
 for(const sx of [-330,330]){x.beginPath();x.moveTo(sx-60,0);x.lineTo(sx-60,-170);x.quadraticCurveTo(sx,-240,sx+60,-170);x.lineTo(sx+60,0);x.fill()}
 x.fillStyle=sh;x.fillRect(-420,-540,840,24);x.fillRect(-480,-400,120,16);x.fillRect(360,-400,120,16);
 x.strokeStyle='rgba(0,0,0,.15)';x.lineWidth=3;for(let k=-480;k<480;k+=60){x.beginPath();x.moveTo(k,-380);x.lineTo(k,0);x.stroke()}
 if(wob){x.strokeStyle='#5a3a1a';x.lineWidth=6;x.setLineDash([20,14]);x.strokeRect(-470,-520,940,520);x.setLineDash([])}x.restore()}
function sea(y,t,c1='#1a4a7a',c2='#0a2a4a'){const g=x.createLinearGradient(0,y,0,H);g.addColorStop(0,c1);g.addColorStop(1,c2);x.fillStyle=g;x.fillRect(-W,y,W*3,H);x.strokeStyle='rgba(255,255,255,.25)';x.lineWidth=4;for(let r=0;r<8;r++){x.beginPath();for(let k=-50;k<W+60;k+=30)x.lineTo(k,y+30+r*60+Math.sin(k*.02+t*2+r)*8);x.stroke()}}
window.EP={title:'गेटवे ऑफ़<br>इंडिया 🌊',badges:['26 मीटर 📏','1924 🏗️'],badgeScene:4,em:'गेटवे|दरवाज़ा|दरवाज़े|मुंबई|जॉर्ज|मैरी|गत्ते|नक़ली|उन्नीस|छब्बीस|बेसाल्ट|आख़िरी|ब्रिटिश|विदाई|स्वागत',capTop:{},SC:[
 (u,d,t)=>{cam(1.14-.1*eo(cl(u/d)));sky(t,'#24406a','#e09060','#ffc890');sun(840,1080,70,.8);gate(540,1430,.95);sea(1430,t);x.setTransform(1,0,0,1,0,0);txt('किसके लिए? 🤔',540,680,96,'#fff',pr(u,1.6,.4))},
 (u,d,t)=>{cam(1.05);sky(t,'#3a6aa0','#a8d0f0','#e8f0f0');sea(1150,t,'#2a6a9a','#0a3a5a');ship(200+pr(u,0,d)*320,1180,1.4);emo('👑',540,820,200,pr(u,.6,.4));x.setTransform(1,0,0,1,0,0);txt('1911 👑',540,420,120,'#ffd23f',pr(u,.3,.4));txt('जॉर्ज पंचम & मैरी',540,560,80,'#fff',pr(u,.9,.4))},
 (u,d,t)=>{cam(1.05);sky(t,'#3a6aa0','#a8d0f0','#e8f0f0');gate(540,1250,.8,'#c89a60','#8a6a3a',1,1,t);sea(1250,t,'#2a6a9a','#0a3a5a');emo('📦',830,1000,110,pr(u,.8,.3));x.setTransform(1,0,0,1,0,0);txt('गत्ते का गेट! 📦',540,420,100,'#ffd23f',pr(u,.3,.4))},
 (u,d,t)=>{cam(1.04);sky(t,'#5a7aa0','#e0b080','#f8e0b8');const p=eo(cl(u/(d*.9)));gate(540,1250,.8,'#d8b070','#a8804a',.25+.75*p);sea(1250,t,'#2a6a9a','#0a3a5a');x.setTransform(1,0,0,1,0,0);txt(String(Math.round(1913+11*p)),540,500,170,'#ffd23f',1);x.fillStyle='rgba(255,255,255,.25)';x.fillRect(190,560,700,26);x.fillStyle='#ffd23f';x.fillRect(190,560,700*p,26)},
 (u,d,t)=>{cam(1.25+.1*eo(cl(u/d)),0,180);sky(t,'#24406a','#e09060','#ffc890');gate(540,1330,.95);sea(1330,t);x.setTransform(1,0,0,1,0,0);txt('पीला बेसाल्ट 🪨',540,1120,90,'#fff',pr(u,.6,.4))},
 (u,d,t)=>{cam(1.04);sky(t,'#5a6a8a','#c0a080','#e8d0b0');gate(540,1200,.75,'#d8b070','#a8804a',.9);sea(1200,t,'#2a5a8a','#0a2a4a');const p=pr(u,0,d);for(let i=0;i<6;i++){const xx=200+i*60+p*420;man(xx,1200,2,.1+Math.sin(t*6+i)*.1)}ship(900,1260,1.1);x.setTransform(1,0,0,1,0,0);txt('1948 🚢',540,420,120,'#ffd23f',pr(u,.3,.4));txt('आख़िरी ब्रिटिश सैनिक',540,560,76,'#fff',pr(u,.9,.4))},
 (u,d,t)=>{cam(1.03);sky(t,'#24406a','#e09060','#ffc890');gate(540,1330,.95);sea(1330,t);x.setTransform(1,0,0,1,0,0);x.fillStyle='rgba(0,0,0,.45)';x.fillRect(0,330,W,330);txt('🤝 स्वागत → 👋 विदाई',540,520,84,'#ffd23f',pr(u,.3,.5))},
 (u,d,t)=>{cam(1.04);sky(t,'#24406a','#e09060','#ffc890');gate(540,1450,.85);sea(1450,t);x.setTransform(1,0,0,1,0,0);
   txt('आप गए हो? 👇',540,430,110,'#ffd23f',pr(u,.3,.4));const p=pr(u,1.2,.4);x.globalAlpha=p;x.fillStyle='#fff';x.beginPath();x.roundRect(240,560,600,120,60);x.fill();x.font='800 60px BD';x.textAlign='center';x.fillStyle='#b5341a';x.fillText('🔔 Follow करो',540,640);x.globalAlpha=1}
]};
