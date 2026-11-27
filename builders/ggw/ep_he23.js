// white salt desert of the Rann
function rann(y){x.fillStyle='#a8a08a';x.fillRect(-W,y,W*3,H);x.strokeStyle='rgba(150,140,120,.35)';x.lineWidth=3;let sd=7;const r=()=>((sd=(sd*16807)%2147483647)/2147483647);for(let k=0;k<40;k++){const a=r()*W*1.4-100,b=y+Math.pow(r(),1.6)*(H-y);x.beginPath();x.moveTo(a,b);x.lineTo(a+60+r()*80,b+(r()-.5)*20);x.stroke()}}
// Dholavira ruins: lower town (wide), middle town, citadel (high) — p highlights a part 0/1/2
function city(cx,by,s,hl=-1,t=0){x.save();x.translate(cx,by);x.scale(s,s);const st='#b89a72',dk='#8a6e4e',lt='#d4b88e';
 const part=(i,X,Y,w,h,col)=>{x.fillStyle=col;x.fillRect(X,Y,w,h);x.fillStyle=lt;x.fillRect(X-6,Y-12,w+12,12);x.fillStyle=dk;for(let k=X+20;k<X+w-30;k+=70)x.fillRect(k,Y+20,34,h-40);
  if(hl===i){x.strokeStyle='#ffd23f';x.lineWidth=12;x.strokeRect(X-16,Y-28,w+32,h+40)}};
 part(0,-480,-150,960,150,st);part(1,-330,-300,560,150,'#c4a47a');part(2,-150,-470,300,170,'#a88a62');
 x.fillStyle='#8a6e4e';x.fillRect(-60,-470,40,-60);x.fillRect(40,-470,40,-60);
 x.restore()}
function reservoir(cx,by,s,fill=1,t=0){x.save();x.translate(cx,by);x.scale(s,s);x.fillStyle='#8a6e4e';x.fillRect(-380,-260,760,260);
 for(let k=0;k<5;k++){x.fillStyle=k%2?'#a88a62':'#b89a72';x.fillRect(-380+k*30,-260+k*40,760-k*60,40)}
 const top=-60-140*fill;x.fillStyle='#3a8ac0';x.fillRect(-230,top,460,-top);x.fillStyle='rgba(255,255,255,.3)';for(let k=0;k<4;k++)x.fillRect(-220+((t*50+k*110)%440),top+6,50,5);
 x.restore()}
function rain(t,a=1){x.save();x.globalAlpha=a;x.strokeStyle='rgba(200,220,255,.6)';x.lineWidth=3;for(let k=0;k<70;k++){const px=(k*157)%W,py=((k*331)+t*1400)%H;x.beginPath();x.moveTo(px,py);x.lineTo(px-8,py+40);x.stroke()}x.restore()}
const DGL=[(a,b)=>{x.fillRect(a-8,b-40,16,80)},(a,b)=>{x.beginPath();x.arc(a,b,34,0,7);x.stroke()},(a,b)=>{x.beginPath();x.moveTo(a-30,b+36);x.lineTo(a,b-36);x.lineTo(a+30,b+36);x.stroke()},(a,b)=>{x.strokeRect(a-30,b-30,60,60)},(a,b)=>{x.beginPath();x.moveTo(a-30,b-36);x.lineTo(a+30,b+36);x.moveTo(a+30,b-36);x.lineTo(a-30,b+36);x.stroke()},(a,b)=>{x.beginPath();x.arc(a,b,30,0,7);x.moveTo(a,b-30);x.lineTo(a,b+30);x.stroke()},(a,b)=>{x.beginPath();x.moveTo(a-30,b);x.lineTo(a+30,b);x.moveTo(a,b-36);x.lineTo(a,b+36);x.stroke()},(a,b)=>{x.beginPath();x.moveTo(a-30,b-30);x.lineTo(a+30,b-30);x.lineTo(a,b+36);x.closePath();x.stroke()},(a,b)=>{x.beginPath();x.arc(a,b-14,22,Math.PI,0);x.moveTo(a-22,b-14);x.lineTo(a-22,b+36);x.moveTo(a+22,b-14);x.lineTo(a+22,b+36);x.stroke()},(a,b)=>{x.beginPath();x.moveTo(a-30,b-36);x.lineTo(a-30,b+36);x.lineTo(a+30,b+36);x.stroke()}];
function signboard(cx,cy,s,p){x.save();x.translate(cx,cy);x.scale(s,s);x.fillStyle='#6a4a2a';x.beginPath();x.roundRect(-470,-110,940,220,16);x.fill();x.fillStyle='#4a3018';x.fillRect(-450,-90,900,180);
 x.strokeStyle='#f4ecd8';x.fillStyle='#f4ecd8';x.lineWidth=10;x.lineCap='round';const n=Math.floor(p*10+.001);for(let k=0;k<n;k++)DGL[k](-405+k*90,0);x.restore()}
window.EP={title:'धोलावीरा:<br>4500 साल पुराना! 🏺',badges:['ऊपर क़िला 🏰','बीच + निचला शहर 🏘️'],badgeScene:4,em:'गुजरात|रेगिस्तान|साढ़े|चार|हज़ार|शहर|पानी|धोलावीरा,|धोलावीरा|कच्छ|रण|खदीर|बेट|सिंधु|घाटी|सड़सठ-अड़सठ|जगत|पति|जोशी|बारिश|जलाशय|क़िला,|लिपि|दस|साइनबोर्ड्स|यूनेस्को|चालीसवीं',capTop:{},SC:[
 (u,d,t)=>{cam(1.14-.1*eo(cl(u/d)));sky(t,'#0a0c24','#2a1a40','#c46b2c');rann(1300);city(540,1300,.95,-1,t);rays(t,540,900,'255,200,140',.08)},
 (u,d,t)=>{cam(1.04);sky(t,'#3a7ac0','#b0d0f0','#f0e8d8');rann(1200);city(540,1200,.95,-1,t);x.setTransform(1,0,0,1,0,0);txt('कच्छ, गुजरात 📍',540,360,100,'#ffd23f',pr(u,.3,.4));txt('खदीर बेट द्वीप 🏝️',540,500,84,'#fff',pr(u,1,.4))},
 (u,d,t)=>{cam(1.03+.04*eo(cl(u/d)));sky(t,'#f0a060','#f8c890','#f0e8d8');sun(860,700,70,.9);rann(1200);city(540,1200,.95,-1,t);man(300,1260,2.4,0);emo('🔍',360,1060,110,pr(u,.6,.4));x.setTransform(1,0,0,1,0,0);txt('1967-68 🔍',540,360,110,'#ffd23f',pr(u,.3,.4));txt('खोज: जगत पति जोशी',540,500,76,'#fff',pr(u,1,.4))},
 (u,d,t)=>{cam(1.04);sky(t,'#4a5a6a','#8a98a8','#c8c8c0');rann(1150);reservoir(540,1150,1.1,pr(u,.4,d*.8),t);rain(t,1-pr(u,d*.7,.5));x.setTransform(1,0,0,1,0,0);txt('पत्थर के जलाशय 💧',540,360,94,'#ffd23f',pr(u,.3,.4));txt('बारिश का पानी जमा 🌧️',540,500,78,'#fff',pr(u,1,.4))},
 (u,d,t)=>{cam(1.02+.04*eo(cl(u/d)));sky(t,'#3a7ac0','#b0d0f0','#f0e8d8');rann(1220);city(540,1220,1,Math.min(2,Math.floor(u/(d/3))),t)},
 (u,d,t)=>{cam(1.04);sky(t,'#f0a060','#f8c890','#f0e8d8');rann(1200);city(540,1200,.6,-1,t);signboard(540,1000,1.05,pr(u,.4,d*.6));x.setTransform(1,0,0,1,0,0);txt('सिंधु लिपि ✍️',540,360,104,'#ffd23f',pr(u,.3,.4));txt('10 बड़े अक्षर 🔟',540,500,84,'#fff',pr(u,1,.4))},
 (u,d,t)=>{cam(1.04);sky(t,'#3a7ac0','#b0d0f0','#f0e8d8');rann(1200);city(540,1200,.95,-1,t);x.setTransform(1,0,0,1,0,0);txt('2021 🏆 UNESCO',540,360,104,'#ffd23f',pr(u,.3,.4));txt('भारत की 40वीं विश्व धरोहर',540,500,70,'#fff',pr(u,1,.4))},
 (u,d,t)=>{cam(1.04);sky(t,'#0a0c24','#2a1a40','#c46b2c');rann(1500);city(540,1500,.85,-1,t);x.setTransform(1,0,0,1,0,0);
   txt('पता था? 👇',540,330,110,'#ffd23f',pr(u,.3,.4));const p=pr(u,1.2,.4);x.globalAlpha=p;x.fillStyle='#fff';x.beginPath();x.roundRect(240,430,600,120,60);x.fill();x.font='800 60px BD';x.textAlign='center';x.fillStyle='#b5341a';x.fillText('🔔 Follow करो',540,510);x.globalAlpha=1}
]};
