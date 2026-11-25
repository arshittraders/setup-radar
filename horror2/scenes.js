// Code-drawn horror scene library (no AI images). Each scene: draw(X, t, o) on a 1080x1920 canvas.
// o = { k: 0..1 progress inside the scene, flick: 0..1 light level, ghost: 0..1 how much the spirit shows, seed }
(function () {
  const W = 1080, H = 1920;
  const h = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const nz = (t) => Math.sin(t * 1.3) * 0.5 + Math.sin(t * 3.7 + 1) * 0.3 + Math.sin(t * 7.1 + 2) * 0.2;
  const lg = (X, y0, y1, stops) => { const g = X.createLinearGradient(0, y0, 0, y1); stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c)); return g; };
  const rg = (X, x, y, r, c0, c1) => { const g = X.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, c0); g.addColorStop(1, c1); return g; };
  function sky(X, top, bot) { X.fillStyle = lg(X, 0, H, [top, bot]); X.fillRect(0, 0, W, H); }
  function moon(X, x, y, r, t) { X.fillStyle = rg(X, x, y, r * 4, 'rgba(190,210,255,.35)', 'rgba(190,210,255,0)'); X.fillRect(x - r * 4, y - r * 4, r * 8, r * 8);
    X.fillStyle = '#e9eeff'; X.beginPath(); X.arc(x, y, r, 0, 7); X.fill(); X.fillStyle = 'rgba(150,165,210,.35)'; X.beginPath(); X.arc(x - r * .3, y - r * .2, r * .22, 0, 7); X.arc(x + r * .35, y + r * .3, r * .15, 0, 7); X.fill();
    X.fillStyle = 'rgba(20,25,45,.55)'; for (let i = 0; i < 3; i++) { const cx = ((t * 18 + i * 420) % 1600) - 300; X.beginPath(); X.ellipse(cx, y + (i - 1) * 50, 260, 38, 0, 0, 7); X.fill(); } }
  function stars(X, n, ymax) { X.fillStyle = 'rgba(255,255,255,.7)'; for (let i = 0; i < n; i++) X.fillRect(h(i) * W, h(i + 50) * ymax, 2, 2); }
  function fog(X, t, y, a = 0.18) { for (let i = 0; i < 5; i++) { const x = ((t * (12 + i * 5) + i * 300) % 1700) - 300; X.fillStyle = rg(X, x, y + i * 40, 420, `rgba(170,180,200,${a})`, 'rgba(170,180,200,0)'); X.fillRect(x - 420, y + i * 40 - 420, 840, 840); } }
  function tree(X, x, y, s, col, seed) { X.strokeStyle = col; X.lineCap = 'round';
    const br = (x0, y0, a, l, w, d) => { if (d > 6 || l < 8) return; const x1 = x0 + Math.cos(a) * l, y1 = y0 + Math.sin(a) * l; X.lineWidth = w; X.beginPath(); X.moveTo(x0, y0); X.lineTo(x1, y1); X.stroke();
      br(x1, y1, a - 0.35 - h(seed + d * 7 + x0) * 0.35, l * 0.72, w * 0.65, d + 1); br(x1, y1, a + 0.3 + h(seed + d * 3 + y0) * 0.4, l * 0.68, w * 0.65, d + 1); };
    br(x, y, -Math.PI / 2 + (h(seed) - .5) * .2, 230 * s, 34 * s, 0); }
  function ghost(X, x, y, s, a, t) { if (a <= 0.01) return; X.save(); X.globalAlpha = a; X.translate(x + nz(t * 2) * 6 * s, y); X.scale(s, s);
    X.fillStyle = rg(X, 0, -60, 420, 'rgba(200,230,220,.35)', 'rgba(200,230,220,0)'); X.fillRect(-420, -480, 840, 840);
    X.fillStyle = '#d8e2dc'; X.beginPath(); X.moveTo(-70, -150); X.bezierCurveTo(-120, 60, -150, 260, -170, 420); for (let i = 0; i <= 8; i++) X.lineTo(-170 + i * 42.5, 420 + (i % 2 ? -30 : 10) + Math.sin(t * 4 + i) * 10); X.bezierCurveTo(150, 260, 120, 60, 70, -150); X.closePath(); X.fill();
    X.fillStyle = '#9aa7a1'; X.beginPath(); X.ellipse(0, -210, 72, 92, 0, 0, 7); X.fill();
    X.fillStyle = '#0b0b0d'; X.beginPath(); X.moveTo(-88, -250); X.bezierCurveTo(-110, -60, -140, 120, -120, 330); X.lineTo(-60, 260); X.bezierCurveTo(-70, 60, -60, -120, -40, -170); X.lineTo(40, -170); X.bezierCurveTo(60, -120, 70, 60, 60, 260); X.lineTo(120, 330); X.bezierCurveTo(140, 120, 110, -60, 88, -250); X.bezierCurveTo(60, -320, -60, -320, -88, -250); X.fill();
    X.fillStyle = rg(X, 0, -205, 60, 'rgba(255,40,40,.9)', 'rgba(255,40,40,0)'); X.fillRect(-60, -265, 120, 120); X.fillStyle = '#ff2b2b'; X.beginPath(); X.ellipse(-24, -212, 9, 6, 0, 0, 7); X.ellipse(24, -212, 9, 6, 0, 0, 7); X.fill(); X.restore(); }
  function eyes(X, x, y, a, t) { if (a <= 0) return; const bl = (t % 2.6) < 0.12 ? 0.15 : 1; X.fillStyle = `rgba(255,50,40,${a})`; X.shadowColor = '#f00'; X.shadowBlur = 25; X.beginPath(); X.ellipse(x - 26, y, 11, 7 * bl, 0, 0, 7); X.ellipse(x + 26, y, 11, 7 * bl, 0, 0, 7); X.fill(); X.shadowBlur = 0; }
  function lamp(X, x, y, on) { X.fillStyle = '#1a1a1f'; X.fillRect(x - 8, y, 16, 1500 - y); X.fillRect(x - 8, y, 90, 12); X.fillStyle = `rgba(255,214,140,${0.25 + 0.75 * on})`; X.beginPath(); X.arc(x + 80, y + 22, 16, 0, 7); X.fill();
    X.fillStyle = `rgba(255,200,120,${0.18 * on})`; X.beginPath(); X.moveTo(x + 64, y + 30); X.lineTo(x + 96, y + 30); X.lineTo(x + 300, 1520); X.lineTo(x - 140, 1520); X.closePath(); X.fill(); }
  function rain(X, t, a) { X.strokeStyle = `rgba(180,200,230,${a})`; X.lineWidth = 2; X.beginPath(); for (let i = 0; i < 140; i++) { const x = h(i) * W, y = (h(i + 9) * H + t * 1600) % H; X.moveTo(x, y); X.lineTo(x - 8, y + 40); } X.stroke(); }
  function door(X, x, y, w, hh, open, lit) { X.fillStyle = '#0a0705'; X.fillRect(x, y, w, hh); if (lit) { X.fillStyle = `rgba(255,190,110,${lit})`; X.fillRect(x, y + hh - 6, w, 6); }
    X.fillStyle = '#3a2618'; X.save(); X.translate(x, y); X.transform(1 - open * 0.6, -open * 0.08, 0, 1, 0, 0); X.fillRect(0, 0, w, hh); X.strokeStyle = '#24160c'; X.lineWidth = 6; X.strokeRect(w * .12, hh * .06, w * .76, hh * .38); X.strokeRect(w * .12, hh * .5, w * .76, hh * .42); X.fillStyle = '#b08a3a'; X.beginPath(); X.arc(w * .85, hh * .5, 9, 0, 7); X.fill(); X.restore(); }

  const S = {
    road(X, t, o) { sky(X, '#0a1024', '#1c2338'); stars(X, 80, 700); moon(X, 760, 330, 70, t);
      X.fillStyle = '#05070c'; X.beginPath(); X.moveTo(0, 1180); for (let x = 0; x <= W; x += 60) X.lineTo(x, 1180 - 60 * h(x) - 40 * Math.sin(x / 200)); X.lineTo(W, H); X.lineTo(0, H); X.fill();
      X.fillStyle = '#16171c'; X.beginPath(); X.moveTo(480, 1180); X.lineTo(600, 1180); X.lineTo(1080, H); X.lineTo(0, H); X.fill();
      X.strokeStyle = 'rgba(230,230,200,.35)'; X.lineWidth = 8; X.setLineDash([60, 70]); X.lineDashOffset = -t * 120; X.beginPath(); X.moveTo(540, 1180); X.lineTo(540, H); X.stroke(); X.setLineDash([]);
      tree(X, 150, 1250, 1.3, '#020306', 3); tree(X, 950, 1300, 1.1, '#020306', 9); lamp(X, 760, 900, o.flick);
      ghost(X, 560, 1120, 0.38, o.ghost, t); fog(X, t, 1150, 0.16); },
    haveli(X, t, o) { sky(X, '#120a1c', '#2a1830'); moon(X, 260, 300, 85, t);
      X.fillStyle = '#0c0a10'; X.fillRect(140, 620, 800, 900); X.beginPath(); X.moveTo(110, 640); X.lineTo(540, 430); X.lineTo(970, 640); X.fill();
      for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { const x = 200 + c * 180, y = 720 + r * 230, lit = (r * 4 + c) % 5 === 2 ? o.flick : 0; X.fillStyle = lit ? `rgba(255,170,80,${0.3 + 0.6 * lit})` : '#05040a'; X.beginPath(); X.moveTo(x, y + 140); X.lineTo(x, y + 40); X.quadraticCurveTo(x + 50, y - 10, x + 100, y + 40); X.lineTo(x + 100, y + 140); X.fill(); }
      eyes(X, 610 + 50, 1000, o.ghost * 0.9, t); door(X, 470, 1250, 140, 270, 0.15 + 0.2 * o.k, 0.3 * o.flick);
      for (let i = 0; i < 4; i++) { const bx = ((t * 120 + i * 300) % 1400) - 200, by = 420 + i * 60 + Math.sin(t * 6 + i) * 20; X.fillStyle = '#000'; X.beginPath(); X.moveTo(bx, by); X.quadraticCurveTo(bx + 20, by - 18 - 10 * Math.sin(t * 20 + i), bx + 40, by); X.quadraticCurveTo(bx + 60, by - 18 - 10 * Math.sin(t * 20 + i), bx + 80, by); X.fill(); }
      X.fillStyle = '#050407'; X.fillRect(0, 1500, W, 420); tree(X, 1000, 1560, 1.4, '#020203', 5); fog(X, t, 1400, 0.2); },
    room(X, t, o) { X.fillStyle = lg(X, 0, 1500, ['#0d1430', '#050816']); X.fillRect(0, 0, W, 1520); X.fillStyle = '#04060d'; X.fillRect(0, 1500, W, 420);
      X.fillStyle = '#060c22'; X.fillRect(80, 330, 340, 420); moon(X, 300, 470, 50, t); X.strokeStyle = '#1e2b52'; X.lineWidth = 14; X.strokeRect(80, 330, 340, 420); X.beginPath(); X.moveTo(250, 330); X.lineTo(250, 750); X.moveTo(80, 540); X.lineTo(420, 540); X.stroke();
      X.fillStyle = `rgba(150,180,255,${0.12 * o.flick})`; X.beginPath(); X.moveTo(90, 750); X.lineTo(420, 750); X.lineTo(760, 1510); X.lineTo(120, 1510); X.fill();
      door(X, 700, 560, 300, 950, 0.05 + 0.25 * o.ghost, 0.5 * o.flick); X.fillStyle = '#1b2a55'; X.fillRect(80, 1220, 560, 220); X.fillStyle = '#d9d9e8'; X.fillRect(100, 1190, 170, 60);
      X.fillStyle = '#000'; X.fillRect(560, 1180, 120, 300); X.fillStyle = `rgba(255,60,60,${0.5 + 0.5 * Math.abs(Math.sin(t * 2))})`; X.font = '700 40px monospace'; X.fillText('2:17', 575, 1240);
      ghost(X, 850, 1100, 0.6, o.ghost, t); },
    corridor(X, t, o) { const f = o.flick, vx = 540, vy = 900; X.fillStyle = '#07080b'; X.fillRect(0, 0, W, H);
      const L = (a, b) => { X.beginPath(); X.moveTo(...a); X.lineTo(...b); X.stroke(); };
      X.fillStyle = `rgba(60,70,60,${0.5 + 0.5 * f})`; X.beginPath(); X.moveTo(0, 0); X.lineTo(vx - 120, vy - 160); X.lineTo(vx - 120, vy + 160); X.lineTo(0, H); X.fill(); X.beginPath(); X.moveTo(W, 0); X.lineTo(vx + 120, vy - 160); X.lineTo(vx + 120, vy + 160); X.lineTo(W, H); X.fill();
      X.fillStyle = `rgba(40,40,36,${0.6 + 0.4 * f})`; X.beginPath(); X.moveTo(0, H); X.lineTo(vx - 120, vy + 160); X.lineTo(vx + 120, vy + 160); X.lineTo(W, H); X.fill();
      X.fillStyle = '#000'; X.fillRect(vx - 120, vy - 160, 240, 320); X.strokeStyle = 'rgba(0,0,0,.6)'; X.lineWidth = 6;
      for (let i = 1; i < 5; i++) { const k = Math.pow(0.62, i), x0 = vx - 540 * k - 120 * (1 - k), y0 = vy - 900 * k - 160 * (1 - k); X.fillStyle = '#1a100a'; X.fillRect(x0 + 10 * k, y0 + 600 * k, 70 * k + 8, 700 * k); X.fillRect(W - x0 - 80 * k - 18, y0 + 600 * k, 70 * k + 8, 700 * k);
        X.fillStyle = `rgba(230,255,230,${f * (i === 2 && Math.sin(t * 30) > 0.3 ? 0.2 : 0.9)})`; X.fillRect(vx - 200 * k - 30, vy - 900 * k + 40, 400 * k + 60, 14 * k + 4); }
      ghost(X, vx, vy + 70, 0.32 + 0.25 * o.k, o.ghost, t); X.fillStyle = `rgba(0,0,0,${0.35 * (1 - f)})`; X.fillRect(0, 0, W, H); },
    forest(X, t, o) { sky(X, '#050a0a', '#0c1814'); moon(X, 540, 260, 60, t);
      for (let l = 0; l < 3; l++) { const c = ['#0a1612', '#06100c', '#020605'][l]; for (let i = 0; i < 7; i++) { const x = (h(i + l * 10) * 1300 - 100), w = 40 + l * 30; X.fillStyle = c; X.fillRect(x, 300 + l * 80, w, H); tree(X, x + w / 2, 700 + l * 120, 0.8 + l * 0.3, c, i + l * 20); } }
      for (let i = 0; i < 4; i++) eyes(X, 180 + i * 230, 1050 + (i % 2) * 120, (0.4 + 0.6 * o.k) * (Math.sin(t * 0.7 + i * 2) > 0 ? 1 : 0.2), t + i);
      ghost(X, 540, 1180, 0.45, o.ghost, t); fog(X, t, 1300, 0.22); },
    graveyard(X, t, o) { sky(X, '#0b0f1e', '#1d2533'); stars(X, 60, 600); moon(X, 820, 360, 90, t);
      X.fillStyle = '#05070a'; X.beginPath(); X.moveTo(0, 1250); X.quadraticCurveTo(540, 1150, W, 1260); X.lineTo(W, H); X.lineTo(0, H); X.fill(); tree(X, 200, 1240, 1.5, '#020304', 4);
      for (let i = 0; i < 7; i++) { const x = 80 + i * 150 + (i % 2) * 30, y = 1300 + (i % 3) * 120, s = 0.8 + (i % 3) * 0.25; X.save(); X.translate(x, y); X.rotate((h(i) - .5) * .25); X.fillStyle = '#2c303a'; X.beginPath(); X.moveTo(-50 * s, 0); X.lineTo(-50 * s, -110 * s); X.quadraticCurveTo(0, -170 * s, 50 * s, -110 * s); X.lineTo(50 * s, 0); X.fill(); X.fillStyle = '#1a1d24'; X.fillRect(-6 * s, -120 * s, 12 * s, 70 * s); X.fillRect(-25 * s, -100 * s, 50 * s, 12 * s); X.restore(); }
      ghost(X, 700, 1200, 0.42, o.ghost, t); fog(X, t, 1350, 0.24); },
    well(X, t, o) { sky(X, '#081018', '#18202a'); moon(X, 300, 330, 75, t); X.fillStyle = '#06080a'; X.fillRect(0, 1350, W, 570);
      X.fillStyle = '#3a3a3a'; X.beginPath(); X.ellipse(540, 1300, 260, 70, 0, 0, 7); X.fill(); X.fillStyle = '#2a2a2a'; X.fillRect(280, 1300, 520, 240); X.fillStyle = '#000'; X.beginPath(); X.ellipse(540, 1300, 220, 52, 0, 0, 7); X.fill();
      X.strokeStyle = '#2b1d12'; X.lineWidth = 22; X.beginPath(); X.moveTo(320, 1310); X.lineTo(320, 980); X.lineTo(760, 980); X.lineTo(760, 1310); X.stroke(); X.strokeStyle = '#806040'; X.lineWidth = 4; X.beginPath(); X.moveTo(540, 980); X.lineTo(540 + Math.sin(t * 1.4) * 10, 1230); X.stroke();
      X.save(); X.beginPath(); X.ellipse(540, 1300, 220, 52, 0, 0, 7); X.clip(); X.fillStyle = '#0b0b0d'; X.beginPath(); X.ellipse(540, 1330 - 60 * o.ghost, 70, 100, 0, 0, 7); X.fill(); eyes(X, 540, 1300 - 40 * o.ghost, o.ghost, t); X.restore();
      for (let i = 0; i < 2; i++) { X.save(); X.translate(470 + i * 140, 1290 - 50 * o.ghost); X.globalAlpha = o.ghost; X.fillStyle = '#9aa7a1'; X.fillRect(-14, 0, 28, 80); for (let k = 0; k < 4; k++) X.fillRect(-18 + k * 11, -26, 7, 30); X.restore(); }
      tree(X, 900, 1400, 1.2, '#020304', 7); fog(X, t, 1400, 0.2); },
    stairs(X, t, o) { X.fillStyle = '#060608'; X.fillRect(0, 0, W, H);
      for (let i = 0; i < 14; i++) { const k = i / 14, y = 1800 - i * 85, w = 900 - i * 45, x = 540 - w / 2 + i * 14; X.fillStyle = `rgb(${40 - i * 2},${30 - i * 1.5},${24 - i})`; X.fillRect(x, y, w, 85); X.fillStyle = `rgba(0,0,0,${0.15 + k * 0.6})`; X.fillRect(x, y, w, 18); }
      X.strokeStyle = '#2b1d12'; X.lineWidth = 12; X.beginPath(); X.moveTo(110, 1720); X.lineTo(560, 640); X.stroke(); for (let i = 0; i < 10; i++) { const x = 110 + i * 45, y = 1720 - i * 108; X.lineWidth = 6; X.beginPath(); X.moveTo(x, y); X.lineTo(x, y + 120); X.stroke(); }
      X.fillStyle = rg(X, 680, 760, 900, 'rgba(0,0,0,0)', 'rgba(0,0,0,.8)'); X.fillRect(0, 0, W, H); X.fillStyle = `rgba(255,220,160,${0.16 * o.flick})`; X.fillRect(0, 0, W, H);
      ghost(X, 690, 620, 0.32, o.ghost, t); eyes(X, 690, 552, o.ghost * 0.6 * (1 - o.k), t); },
    mirror(X, t, o) { X.fillStyle = lg(X, 0, H, ['#1a1e22', '#08090b']); X.fillRect(0, 0, W, H); for (let r = 0; r < 20; r++) for (let c = 0; c < 9; c++) { X.strokeStyle = 'rgba(255,255,255,.04)'; X.strokeRect(c * 120, r * 120, 120, 120); }
      X.fillStyle = '#3a3226'; X.fillRect(230, 330, 620, 860); X.fillStyle = lg(X, 340, 1180, ['#2c3a40', '#11181c']); X.fillRect(260, 360, 560, 800);
      X.save(); X.beginPath(); X.rect(260, 360, 560, 800); X.clip(); ghost(X, 560 + 60 * Math.sin(t * .4), 860, 0.75, o.ghost, t); X.strokeStyle = 'rgba(255,255,255,.08)'; X.lineWidth = 3; X.beginPath(); X.moveTo(300, 1100); X.lineTo(700, 400); X.stroke();
      if (o.k > 0.4) { X.fillStyle = `rgba(160,0,0,${Math.min(0.8, (o.k - 0.4) * 2)})`; X.font = '900 70px Arial'; X.textAlign = 'center'; X.fillText('पीछे देखो', 540, 520); } X.restore();
      X.fillStyle = '#d9dcdf'; X.fillRect(200, 1300, 680, 120); X.fillStyle = '#8a8f94'; X.fillRect(500, 1240, 30, 80); X.fillStyle = `rgba(255,255,230,${0.5 + 0.5 * o.flick})`; X.fillRect(380, 250, 320, 30);
      X.fillStyle = `rgba(0,0,0,${0.5 * (1 - o.flick)})`; X.fillRect(0, 0, W, H); },
    busstop(X, t, o) { sky(X, '#0a0c14', '#14161e'); rain(X, t, 0.25); X.fillStyle = '#0c0d10'; X.fillRect(0, 1350, W, 570); X.fillStyle = '#1a1b20'; X.fillRect(0, 1350, W, 50);
      X.fillStyle = '#22262e'; X.fillRect(160, 900, 760, 30); X.fillRect(170, 930, 22, 440); X.fillRect(888, 930, 22, 440); X.fillStyle = `rgba(200,230,255,${0.06 + 0.1 * o.flick})`; X.fillRect(192, 930, 696, 420);
      X.fillStyle = '#2e2a22'; X.fillRect(260, 1200, 560, 26); X.fillStyle = `rgba(255,230,160,${o.flick})`; X.fillRect(480, 912, 120, 10); X.fillStyle = '#c8b040'; X.font = '800 36px Arial'; X.textAlign = 'center'; X.fillText('🚌  STOP', 540, 880);
      const hl = Math.max(0, Math.sin(t * 0.8)); X.fillStyle = `rgba(255,250,210,${0.25 * hl})`; X.beginPath(); X.moveTo(1080, 1300); X.lineTo(300, 1500); X.lineTo(1080, 1600); X.fill();
      ghost(X, 620, 1000, 0.36, o.ghost, t); fog(X, t, 1450, 0.12); },
    platform(X, t, o) { sky(X, '#06080e', '#11141c'); stars(X, 40, 500); X.fillStyle = '#1a1c22'; X.fillRect(0, 1100, W, 180); X.fillStyle = '#c9a227'; X.fillRect(0, 1270, W, 10);
      X.fillStyle = '#0b0c0f'; X.fillRect(0, 1280, W, 640); X.strokeStyle = '#3a3d44'; X.lineWidth = 10; X.beginPath(); X.moveTo(0, 1500); X.lineTo(W, 1500); X.moveTo(0, 1680); X.lineTo(W, 1680); X.stroke();
      for (let i = 0; i < 12; i++) { X.fillStyle = '#2a2018'; X.fillRect(i * 100 - (t * 0) % 100, 1480, 50, 230); }
      for (let i = 0; i < 3; i++) { const x = 180 + i * 360; X.fillStyle = '#22252c'; X.fillRect(x - 8, 600, 16, 500); X.fillStyle = `rgba(255,240,200,${(i === 1 ? o.flick : 1) * 0.9})`; X.fillRect(x - 60, 600, 120, 14); X.fillStyle = `rgba(255,240,200,${(i === 1 ? o.flick : 1) * 0.08})`; X.beginPath(); X.moveTo(x - 60, 614); X.lineTo(x + 60, 614); X.lineTo(x + 200, 1270); X.lineTo(x - 200, 1270); X.fill(); }
      X.fillStyle = '#132'; X.fillRect(380, 700, 320, 90); X.fillStyle = '#ffb300'; X.font = '800 48px monospace'; X.textAlign = 'center'; X.fillText('03:33', 540, 765);
      const tl = (t * 0.25) % 1; if (o.k > 0.3) { X.fillStyle = `rgba(255,255,220,${0.6 * Math.max(0, Math.sin(tl * Math.PI))})`; X.beginPath(); X.arc(-200 + tl * 1500, 1450, 30, 0, 7); X.fill(); }
      ghost(X, 760, 900, 0.38, o.ghost, t); fog(X, t, 1250, 0.14); },
    phone(X, t, o) { X.fillStyle = '#030306'; X.fillRect(0, 0, W, H); const ring = o.k < 0.6 ? Math.sin(t * 40) * (Math.floor(t * 1.6) % 2 ? 1 : 0) : 0;
      X.fillStyle = rg(X, 540, 1000, 700, 'rgba(90,150,255,.35)', 'rgba(90,150,255,0)'); X.fillRect(0, 0, W, H); X.save(); X.translate(540 + ring * 5, 1000); X.rotate(ring * 0.03);
      X.fillStyle = '#111'; X.beginPath(); X.roundRect(-230, -460, 460, 920, 60); X.fill(); X.fillStyle = lg(X, -420, 420, ['#2a3f7a', '#0f1a3a']); X.beginPath(); X.roundRect(-205, -430, 410, 860, 40); X.fill();
      X.fillStyle = '#fff'; X.textAlign = 'center'; X.font = '800 52px Arial'; X.fillText(o.ghost > 0.3 ? 'अज्ञात' : 'माँ ❤️', 0, -230); X.font = '600 34px Arial'; X.fillStyle = 'rgba(255,255,255,.7)'; X.fillText('incoming call…', 0, -170);
      X.fillStyle = '#9aa7c0'; X.beginPath(); X.arc(0, -20, 90, 0, 7); X.fill(); X.fillStyle = '#e33'; X.beginPath(); X.arc(-110, 300, 55, 0, 7); X.fill(); X.fillStyle = '#2c4'; X.beginPath(); X.arc(110, 300, 55 + 6 * Math.abs(Math.sin(t * 6)), 0, 7); X.fill();
      if (o.ghost > 0.3) { X.save(); X.beginPath(); X.arc(0, -20, 90, 0, 7); X.clip(); ghost(X, 0, 120, 0.4, o.ghost, t); X.restore(); } X.restore();
    },
  };
  window.HSCENES = S; window.HGHOST = ghost;
  // big final jump-scare face
  window.HSCARE = function (X, k, t) { X.fillStyle = '#000'; X.fillRect(0, 0, W, H); X.save(); X.translate(540 + nz(t * 30) * 20, 880); const s = 2.0 + k * 1.1; X.scale(s, s);
    X.fillStyle = '#060606'; X.beginPath(); X.ellipse(0, 40, 250, 420, 0, 0, 7); X.fill();                                    // hair mass
    X.fillStyle = '#a9b3a8'; X.beginPath(); X.moveTo(-120, -150); X.quadraticCurveTo(-135, 60, -60, 190); X.quadraticCurveTo(0, 240, 60, 190); X.quadraticCurveTo(135, 60, 120, -150); X.quadraticCurveTo(0, -230, -120, -150); X.fill();   // gaunt face with a chin
    X.fillStyle = '#060606'; X.beginPath(); X.moveTo(-130, -170); X.quadraticCurveTo(-40, -120, -10, -230); X.quadraticCurveTo(40, -110, 130, -170); X.lineTo(130, -240); X.lineTo(-130, -240); X.fill();   // fringe
    X.fillStyle = '#1b1414'; for (const sx of [-1, 1]) { X.beginPath(); X.moveTo(sx * 18, -40); X.quadraticCurveTo(sx * 60, -80, sx * 100, -40); X.quadraticCurveTo(sx * 62, 0, sx * 18, -40); X.fill(); }   // sunken slanted sockets
    X.fillStyle = '#ff1a1a'; X.shadowColor = '#f00'; X.shadowBlur = 25; for (const sx of [-1, 1]) { X.beginPath(); X.ellipse(sx * 58, -42, 9, 4, 0, 0, 7); X.fill(); } X.shadowBlur = 0;
    X.strokeStyle = 'rgba(40,30,30,.7)'; X.lineWidth = 2.5; X.beginPath(); X.moveTo(-70, 10); X.lineTo(-55, 50); X.lineTo(-70, 80); X.moveTo(80, -110); X.lineTo(65, -80); X.lineTo(85, -60); X.stroke();   // cracks
    X.fillStyle = '#120808'; X.beginPath(); X.moveTo(-70, 110); X.quadraticCurveTo(0, 150 + 8 * Math.sin(t * 40), 70, 110); X.quadraticCurveTo(0, 125, -70, 110); X.fill();   // thin wide grin
    X.fillStyle = '#d8d0b0'; for (let i = -5; i <= 5; i++) { X.beginPath(); X.moveTo(i * 12 - 4, 116 + Math.abs(i) * -1.5); X.lineTo(i * 12 + 4, 116 + Math.abs(i) * -1.5); X.lineTo(i * 12, 128); X.fill(); }
    X.restore(); X.fillStyle = 'rgba(120,0,0,.18)'; X.fillRect(0, 0, W, H); };
})();
