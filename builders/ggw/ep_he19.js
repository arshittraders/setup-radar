function chip(s,cx,cy,a,col='#fff',bg='rgba(0,0,0,.55)'){x.save();x.globalAlpha=a;x.font='800 62px BD';const w=x.measureText(s).width+70;x.fillStyle=bg;x.beginPath();x.roundRect(cx-w/2,cy-55,w,100,50);x.fill();x.fillStyle=col;x.textAlign='center';x.fillText(s,cx,cy+18);x.restore()}
function ground(y,col='#7a8a4a'){x.fillStyle=col;x.fillRect(-W,y,W*3,H)}
// hemispherical stupa with railing, harmika + chhatra; brick=0..1 (brick look), tor = toranas alpha
function stupa(cx,by,s,brick=0,tor=1){x.save();x.translate(cx,by);x.scale(s,s);
 x.fillStyle='#b8a888';x.fillRect(-330,-70,660,70);x.fillStyle='#a89878';x.fillRect(-350,-12,700,12);
 const g=x.createLinearGradient(-300,-330,300,-60);g.addColorStop(0,brick?'#c0603a':'#d8c8a8');g.addColorStop(1,brick?'#7a3a20':'#9a8a6a');x.fillStyle=g;x.beginPath();x.moveTo(-300,-70);x.bezierCurveTo(-300,-420,300,-420,300,-70);x.fill();
 if(brick){x.strokeStyle='rgba(60,20,10,.35)';x.lineWidth=2;for(let yy=-90;yy>-330;yy-=22){x.beginPath();x.moveTo(-300,yy);x.lineTo(300,yy);x.stroke()}}
 x.fillStyle='#8a7a5a';x.fillRect(-60,-350,120,40);x.strokeStyle='#6a5a3a';x.lineWidth=5;for(let k=-50;k<=50;k+=20){x.beginPath();x.moveTo(k,-350);x.lineTo(k,-310);x.stroke()}
 x.fillStyle='#6a5a3a';x.fillRect(-5,-440,10,90);[[-430,70],[-405,55],[-380,40]].forEach(([yy,w])=>{x.beginPath();x.ellipse(0,yy,w/2,10,0,0,7);x.fill()});
 x.strokeStyle='#9a8a6a';x.lineWidth=8;x.beginPath();x.moveTo(-360,-60);x.lineTo(360,-60);x.stroke();x.lineWidth=6;for(let k=-350;k<=350;k+=35){x.beginPath();x.moveTo(k,-60);x.lineTo(k,0);x.stroke()}
 if(tor>0){x.globalAlpha=tor;torana(-420,0,.55);torana(420,0,.55);x.globalAlpha=1}
 x.restore()}
function torana(cx,by,s){x.save();x.translate(cx,by);x.scale(s,s);x.fillStyle='#b89a6a';x.fillRect(-150,-420,34,420);x.fillRect(116,-420,34,420);[-420,-340,-260].forEach((yy,k)=>{x.fillStyle=k%2?'#a88a5a':'#c8aa7a';x.beginPath();x.roundRect(-210,yy-30,420,40,20);x.fill();x.fillStyle='rgba(90,60,30,.4)';for(let j=-180;j<=180;j+=40)x.fillRect(j,yy-24,12,28)});x.fillStyle='#c8aa7a';x.beginPath();x.arc(0,-470,26,0,7);x.fill();x.restore()}
function note(cx,cy,s,a){x.save();x.globalAlpha=a;x.translate(cx,cy);x.scale(s,s);x.rotate(-.06);x.fillStyle='#f6b26b';x.beginPath();x.roundRect(-380,-180,760,360,20);x.fill();x.strokeStyle='#c87a2a';x.lineWidth=6;x.strokeRect(-360,-160,720,320);x.fillStyle='#7a3a10';x.font='800 110px BD';x.textAlign='left';x.fillText('₹200',-340,-40);x.restore();x.save();x.globalAlpha=a;x.translate(cx+110*s,cy+40*s);stupa(0,0,.38*s,0,0);x.restore()}
function sym(k,cx,cy,r,a){x.save();x.globalAlpha=a;x.translate(cx,cy);x.strokeStyle='#5a3a1a';x.fillStyle='#5a3a1a';x.lineWidth=10;
 if(k===0){x.fillRect(-12,0,24,r);x.beginPath();x.arc(0,-r*.2,r*.75,0,7);x.fillStyle='#4a7a3a';x.fill()}
 else if(k===1){x.beginPath();x.arc(0,0,r*.8,0,7);x.stroke();x.beginPath();x.arc(0,0,r*.15,0,7);x.fill();for(let j=0;j<8;j++){x.beginPath();x.moveTo(0,0);x.lineTo(Math.cos(j*Math.PI/4)*r*.8,Math.sin(j*Math.PI/4)*r*.8);x.stroke()}}
 else {[-1,1].forEach(sd=>{x.beginPath();x.ellipse(sd*r*.32,r*.1,r*.22,r*.48,0,0,7);x.fill();for(let j=0;j<5;j++){x.beginPath();x.arc(sd*r*.32+(j-2)*r*.09,-r*.48,r*.07,0,7);x.fill()}})}
 x.restore()}
window.EP={title:'साँची स्तूप:<br>₹200 वाला स्मारक 🪷',badges:['4 तोरण 🚪','बारीक नक्काशी ✨'],badgeScene:4,em:'साँची|स्तूप|नोट|मध्य|प्रदेश|भोपाल|पचास|किलोमीटर|तीसरी|सदी|अशोक|सम्राट|ईंटों|पत्थरों|तोरण|नक्काशी|बुद्ध|पेड़,|चक्र|प्रतीकों|नवासी|यूनेस्को',capTop:{},SC:[
 (u,d,t)=>{cam(1.12-.08*eo(cl(u/d)));sky(t,'#0a0c24','#2a1a40','#c46b2c');ground(1150,'#2a2a18');note(540,1050,1,pr(u,.2,.5));rays(t,540,1050,'255,210,150',.08)},
 (u,d,t)=>{cam(1.04);sky(t,'#3a7ac0','#b0d0f0','#f0e0c0');ground(1150);stupa(540,1150,1);emo('📍',540,665,120,pr(u,.6,.4));x.setTransform(1,0,0,1,0,0);txt('साँची, मध्य प्रदेश 📍',540,360,92,'#ffd23f',pr(u,.3,.4));txt('भोपाल से ~50 किमी',540,500,76,'#fff',pr(u,1,.4))},
 (u,d,t)=>{cam(1.03+.04*eo(cl(u/d)));sky(t,'#f0a060','#f8c890','#f0e0c0');sun(840,700,70,.9);ground(1150,'#8a8a4a');stupa(540,1150,1);x.setTransform(1,0,0,1,0,0);txt('तीसरी सदी ई.पू. 👑',540,360,90,'#ffd23f',pr(u,.3,.4));txt('सम्राट अशोक',540,500,88,'#fff',pr(u,1,.4))},
 (u,d,t)=>{cam(1.04);sky(t,'#3a7ac0','#b0d0f0','#f0e0c0');ground(1150);const p=pr(u,d*.45,.8);x.save();x.globalAlpha=1-p;stupa(540,1150,.8,1,0);x.restore();x.save();x.globalAlpha=p;stupa(540,1150,1,0,0);x.restore();x.setTransform(1,0,0,1,0,0);txt('ईंट 🧱',540,360,110,'#ffd23f',pr(u,.3,.4));txt('➜ पत्थर, और बड़ा 🪨',540,500,82,'#fff',pr(u,d*.45,.4))},
 (u,d,t)=>{cam(1.03+.05*eo(cl(u/d)));sky(t,'#3a7ac0','#b0d0f0','#f0e0c0');ground(1180);torana(540,1180,1.0);man(250,1180,2,0)},
 (u,d,t)=>{cam(1.04);x.fillStyle='#c8aa7a';x.fillRect(-W,-H,W*3,H*3);x.fillStyle='rgba(90,60,30,.12)';for(let k=0;k<30;k++)x.fillRect((k*137)%W,(k*251)%H,80,6);[0,1,2].forEach(k=>sym(k,220+k*320,950,110,pr(u,.6+k*.9,.4)));x.setTransform(1,0,0,1,0,0);txt('बुद्ध = प्रतीक 🪷',540,360,100,'#7a2a0a',pr(u,.3,.4));txt('🌳  ☸️  👣',540,500,90,'#5a3a1a',pr(u,1,.4))},
 (u,d,t)=>{cam(1.04);sky(t,'#3a7ac0','#b0d0f0','#f0e0c0');ground(1150);stupa(540,1150,1);x.setTransform(1,0,0,1,0,0);txt('1989 🏆',540,360,116,'#ffd23f',pr(u,.3,.4));txt('UNESCO विश्व धरोहर',540,500,80,'#fff',pr(u,1,.4))},
 (u,d,t)=>{cam(1.04);sky(t,'#0a0c24','#2a1a40','#c46b2c');ground(1560,'#2a2a18');stupa(540,1560,.85);x.setTransform(1,0,0,1,0,0);
   txt('पता था? 👇',540,330,110,'#ffd23f',pr(u,.3,.4));const p=pr(u,1.2,.4);x.globalAlpha=p;x.fillStyle='#fff';x.beginPath();x.roundRect(240,430,600,120,60);x.fill();x.font='800 60px BD';x.textAlign='center';x.fillStyle='#b5341a';x.fillText('🔔 Follow करो',540,510);x.globalAlpha=1}
]};
