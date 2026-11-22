function charminar(cx,by,s,a=1,glow=0,top=0){x.save();x.globalAlpha=a;x.translate(cx,by);x.scale(s,s);const S='#d9c39a',D='#b79b6c',L='#ecdcb8';
 if(glow){const g=x.createRadialGradient(0,-400,20,0,-400,700);g.addColorStop(0,`rgba(255,215,140,${.55*glow})`);g.addColorStop(1,'rgba(255,215,140,0)');x.fillStyle=g;x.fillRect(-700,-1100,1400,1100)}
 x.fillStyle=S;x.fillRect(-300,-560,600,560);x.fillStyle=D;x.fillRect(-310,-580,620,26);x.fillRect(-310,-700,620,22);x.fillStyle=L;x.fillRect(-280,-690,560,110);
 x.fillStyle='#3a2412';x.beginPath();x.moveTo(-150,0);x.lineTo(-150,-300);x.quadraticCurveTo(0,-470,150,-300);x.lineTo(150,0);x.fill();
 for(let k=-240;k<=240;k+=80){x.fillStyle='#5a3c20';x.beginPath();x.moveTo(k-22,-600);x.lineTo(k-22,-650);x.quadraticCurveTo(k,-676,k+22,-650);x.lineTo(k+22,-600);x.fill()}
 if(top){x.fillStyle=`rgba(255,230,120,${.6*top})`;x.fillRect(-290,-700,580,130)}
 [-330,330].forEach(mx=>{x.fillStyle=S;x.fillRect(mx-42,-1060,84,1060);for(let b=0;b<3;b++){const yy=-640-b*150;x.fillStyle=D;x.fillRect(mx-62,yy,124,18)}
   x.fillStyle=L;x.beginPath();x.moveTo(mx-40,-1060);x.quadraticCurveTo(mx-50,-1140,mx,-1180);x.quadraticCurveTo(mx+50,-1140,mx+40,-1060);x.fill();x.fillStyle='#c9a24a';x.fillRect(mx-4,-1220,8,44)});
 x.restore()}
function bangles(t,a){for(let r=0;r<4;r++)for(let k=0;k<6;k++){const cx=150+k*156,cy=780+r*120;const cols=['#e63946','#ffb703','#2a9d8f','#8338ec','#ff006e','#3a86ff'];x.save();x.globalAlpha=a*pr(t,.2+(r*6+k)*.04,.3);x.strokeStyle=cols[(r+k)%6];x.lineWidth=16;x.beginPath();x.ellipse(cx,cy,58,26,0,0,7);x.stroke();x.strokeStyle='rgba(255,255,255,.7)';x.lineWidth=4;x.beginPath();x.ellipse(cx,cy-6,50,20,0,3.6,5.6);x.stroke();x.restore()}}
window.EP={title:'चारमीनार<br>का राज़ 🕌',badges:['~56 मीटर 📏','4 मीनारें 🕌'],badgeScene:4,em:'हैदराबाद|चारमीनार|चार|मीनार|पंद्रह|क़ुतुब|गोलकोंडा|प्लेग|छप्पन|सीढ़ियाँ|मस्जिद|लाड|चूड़ियों|ख़ुशी',capTop:{},SC:[
 (u,d,t)=>{cam(1.14-.1*eo(cl(u/d)));sky(t,'#1a1a4a','#7a3a6a','#e08a5a');charminar(540,1420,.9,1,.5);x.fillStyle='#4a3020';x.fillRect(-W,1410,W*3,700);x.setTransform(1,0,0,1,0,0);txt('हैदराबाद की पहचान',540,700,84,'#fff',pr(u,1.6,.4))},
 (u,d,t)=>{cam(1.05);sky(t,'#3a6aa0','#a8c8e0','#f0e0c0');charminar(540,1450,.85);x.fillStyle='#8a7050';x.fillRect(-W,1440,W*3,700);x.setTransform(1,0,0,1,0,0);txt('चारमीनार 📍',540,420,120,'#ffd23f',pr(u,.3,.4));txt('1591',540,560,96,'#fff',pr(u,1.2,.4))},
 (u,d,t)=>{cam(1.04);plain(t,'#2a3a6a','#d0a070');x.fillStyle='#6a5a4a';x.beginPath();x.moveTo(-100,1180);x.quadraticCurveTo(260,820,560,1180);x.fill();x.fillStyle='#8a7a6a';for(let k=0;k<5;k++)x.fillRect(120+k*70,960-Math.sin(k)*40,50,120);emo('🏰',300,880,120,pr(u,.2,.3));
   const p=eo(pr(u,1,.8));x.strokeStyle='#ffd23f';x.lineWidth=12;x.setLineDash([26,18]);x.beginPath();x.moveTo(420,1080);x.lineTo(420+340*p,1120);x.stroke();x.setLineDash([]);charminar(830,1200,.32,pr(u,1.4,.5));
   x.setTransform(1,0,0,1,0,0);txt('गोलकोंडा ➜ हैदराबाद',540,440,80,'#ffd23f',pr(u,.3,.4))},
 (u,d,t)=>{cam(1.04);const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,'#0a0a14');g.addColorStop(1,'#2a1a2a');x.fillStyle=g;x.fillRect(-W,-H,W*3,H*3);const gl=pr(u,d*.45,1);
   [[260,800],[820,760],[540,640],[380,1000],[720,1020]].forEach(([ex,ey],k)=>emo('🦠',ex,ey+Math.sin(t*3+k)*15,110,(1-gl)*pr(u,.2+k*.2,.3)));charminar(540,1420,.78,gl,gl);x.fillStyle='#2a1a10';x.fillRect(-W,1410,W*3,700);
   x.setTransform(1,0,0,1,0,0);txt('प्लेग का अंत? 🙏',540,440,96,'#ffd23f',pr(u,.3,.4))},
 (u,d,t)=>{cam(1.02+.06*eo(cl(u/d)),0,0);sky(t,'#4a7ab0','#c8d8e8','#f0e0c0');charminar(300,1900,1.35);x.strokeStyle='#ffd23f';x.lineWidth=8;const p=pr(u,.2,d*.7);x.beginPath();for(let k=0;k<=60*p;k++){const yy=1800-k*14,xx=746+Math.sin(k*.5)*40;k?x.lineTo(xx,yy):x.moveTo(xx,yy)}x.stroke()},
 (u,d,t)=>{cam(1.08);sky(t,'#3a5a90','#c0d0e0','#f0dcc0');charminar(540,1700,1.2,1,0,.5+.5*Math.sin(t*4));x.setTransform(1,0,0,1,0,0);txt('सबसे ऊपर: मस्जिद 🕌',540,420,86,'#ffd23f',pr(u,.3,.4))},
 (u,d,t)=>{cam(1.04);const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,'#3a0a2a');g.addColorStop(1,'#1a0a1a');x.fillStyle=g;x.fillRect(-W,-H,W*3,H*3);rays(t,540,700,'255,180,220',.12);bangles(u,1);x.setTransform(1,0,0,1,0,0);txt('लाड बाज़ार 💍',540,440,110,'#ffd23f',pr(u,.3,.4))},
 (u,d,t)=>{cam(1.04);sky(t,'#1a1a4a','#7a3a6a','#e08a5a');charminar(540,1500,.85,1,.4);x.fillStyle='#4a3020';x.fillRect(-W,1490,W*3,700);x.setTransform(1,0,0,1,0,0);
   txt('पता था? 👇',540,430,110,'#ffd23f',pr(u,.3,.4));const p=pr(u,1.2,.4);x.globalAlpha=p;x.fillStyle='#fff';x.beginPath();x.roundRect(240,560,600,120,60);x.fill();x.font='800 60px BD';x.textAlign='center';x.fillStyle='#b5341a';x.fillText('🔔 Follow करो',540,640);x.globalAlpha=1}
]};
