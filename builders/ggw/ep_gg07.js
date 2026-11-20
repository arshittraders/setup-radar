window.EP={title:'रोसवेल 1947<br>UFO का सच? 🛸',badges:['उड़न तश्तरी! 🛸','या गुब्बारा? 🎈'],badgeScene:3,em:'रोसवेल|तश्तरी|गुब्बारा|एलियन|सच|मलबा|ख़ुफ़िया|सेना',capTop:{},SC:[
 (u,d,t)=>{cam(1.12-.08*eo(cl(u/d)));desert(t);const p=pr(u,.5,d*.7);const fx=850-p*600,fy=300+p*1000;x.save();x.strokeStyle='rgba(255,200,120,.7)';x.lineWidth=8;x.beginPath();x.moveTo(fx+220,fy-360);x.lineTo(fx,fy);x.stroke();x.restore();ufo(fx,fy,.6,t);x.setTransform(1,0,0,1,0,0)},
 (u,d,t)=>{cam(1.05);desert(t,'#1d2a4a','#b07a4a');debris(600,1500,t);man(300,1560,3.2,-.2);x.setTransform(1,0,0,1,0,0)},
 (u,d,t)=>{cam(1.05);x.setTransform(1,0,0,1,0,0);const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,'#1b1b1b');g.addColorStop(1,'#3a3a3a');x.fillStyle=g;x.fillRect(0,0,W,H);paper(540,880,1.35,[['ROSWELL DAILY RECORD',40],['सेना को मिली',84],['उड़न तश्तरी! 🛸',96]],pr(u,.1,.3),-.06*pr(u,.1,.5));emo('📰',540,1720,160,pr(u,.8,.4))},
 (u,d,t)=>{cam(1.05);sky(t,'#24406a','#6a8aba','#c9d9e6');balloon(540,700,1.4,t);x.setTransform(1,0,0,1,0,0)},
 (u,d,t)=>{cam(1.05);sky(t,'#0b1026','#1a2040','#2a3050');balloon(540,600,1,t);x.setTransform(1,0,0,1,0,0);x.fillStyle='rgba(0,0,0,.6)';x.fillRect(140,1050,800,200);txt('TOP SECRET',540,1180,110,'#ff3b3b',pr(u,.4,.3))},
 (u,d,t)=>{cam(1.08);x.setTransform(1,0,0,1,0,0);x.fillStyle='#0d0d0d';x.fillRect(0,0,W,H);paper(540,880,1.4,[['CLASSIFIED',60],['██████ ███',70],['███ ██████',70]],1,.04);emo('🤫',540,1450,200,pr(u,.6,.4))},
 (u,d,t)=>{cam(1.05+.15*eo(cl(u/d)));desert(t);const gl=.5+.5*Math.sin(t*3);ufo(540,800+Math.sin(t*2)*20,1.1,t,.6*gl);alienFig(540,1560,2.2,gl)},
 (u,d,t)=>vs(u,t,['टीम इंसान','🧑'],['टीम एलियन','👽'],['#0d3a6a','#2f7fd0'],['#0e4d1b','#1fae3c'])
]};
