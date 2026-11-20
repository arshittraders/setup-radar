window.EP={title:'समंदर में डूबी<br>द्वारका 🌊',badges:['सोने की नगरी ✨','कृष्ण की द्वारका 🪈'],badgeScene:1,em:'द्वारका|डूबा|सोने|समंदर|रहस्य|इतिहास|कृष्ण',capTop:{2:1500},SC:[
 (u,d,t)=>{cam(1.15-.1*eo(cl(u/d)),0,-120*cl(u/d));under(t,'#03506f','#001219');ruins(540,1500,1.15);x.setTransform(1,0,0,1,0,0)},
 (u,d,t)=>{cam(1.05);sky(t,'#1a0f2e','#5a2d0c','#c77d1a');ruins(540,1450,1.2,0,1);rays(t,540,700,'255,210,120',.18);x.fillStyle='#0b2545';x.fillRect(-W,1450,W*3,600);embers(t,'255,215,120')},
 (u,d,t)=>{cam(1.05);under(t,'#0a4a6a','#011a27');ruins(540,1650,1,'#567a78');for(let i=0;i<3;i++)block(250+i*280,1560-(i%2)*40,170,90);diver(300+u*60,800,1.6,t);txt('1980s',540,420,150,'#ffd23f',pr(u,.3,.4));x.setTransform(1,0,0,1,0,0)},
 (u,d,t)=>{cam(1.04);sky(t,'#140c24','#4a2a3a','#8a4a1a');ruins(540,1450,1.2,0,1);x.fillStyle='#0b2545';x.fillRect(-W,1450,W*3,600);x.setTransform(1,0,0,1,0,0);wave(t,eo(pr(u,d*.25,d*.65)))},
 (u,d,t)=>{cam(1.05);under(t,'#023047','#000c14');ruins(540,1500,1.1,'#4f6b6b');x.setTransform(1,0,0,1,0,0);emo('⏳',540,700,260,pr(u,.2,.4));txt('हज़ारों साल?',540,950,120,'#ffd23f',pr(u,.6,.4))},
 (u,d,t)=>{cam(1.05);under(t,'#0a3a55','#011a27');ruins(540,1650,.9,'#5d7575');x.setTransform(1,0,0,1,0,0);emo('🔬',300,620,220,pr(u,.2,.4));emo('❓',780,620,220,pr(u,.6,.4));txt('सबूत अधूरे',540,900,120,'#fff',pr(u,1,.4))},
 (u,d,t)=>{cam(1.05+.18*eo(cl(u/d)));under(t,'#012a40','#000');const gl=.5+.5*Math.sin(t*3);const rg=x.createRadialGradient(540,1300,10,540,1300,600);rg.addColorStop(0,`rgba(255,200,90,${.45*gl})`);rg.addColorStop(1,'rgba(255,200,90,0)');x.fillStyle=rg;x.fillRect(-W,-H,W*3,H*3);ruins(540,1500,1.1,0,1)},
 (u,d,t)=>vs(u,t,['टीम इतिहास','📜'],['टीम रहस्य','🌀'],['#5a3a0a','#c98b1f'],['#0e4d1b','#1fae3c'])
]};
