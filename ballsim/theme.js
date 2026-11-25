// Skins for physics pages: swaps the page's full-screen background for one of many animated looks,
// so the same format looks different from video to video. window.SKIN = 0..N-1 (0 = page's own look).
// Works by catching the first full-canvas fillRect of every frame — sims stay untouched.
(function () {
  const W = 1080, H = 1920;
  const lin = (X, a, b, dir) => { const g = dir ? X.createLinearGradient(0, 0, W, H) : X.createLinearGradient(0, 0, 0, H); g.addColorStop(0, a); g.addColorStop(1, b); return g; };
  const rad = (X, a, b) => { const g = X.createRadialGradient(W / 2, H / 2, 80, W / 2, H / 2, 1250); g.addColorStop(0, a); g.addColorStop(1, b); return g; };
  const hash = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const SKINS = [
    null,
    { name: 'sunset', d(X, t) { X.fillStyle = lin(X, '#ff8a5c', '#2b1055'); X.fillRect(0, 0, W, H);
        X.fillStyle = 'rgba(255,220,120,.18)'; X.beginPath(); X.arc(W / 2, 1500, 420, 0, 7); X.fill();
        X.fillStyle = 'rgba(43,16,85,.55)'; for (let i = 0; i < 9; i++) X.fillRect(0, 1380 + i * 46 + (t * 20 % 46), W, 10 + i * 2);
        X.fillStyle = 'rgba(0,0,0,.35)'; X.fillRect(0, 0, W, H); } },
    { name: 'ocean', d(X, t) { X.fillStyle = lin(X, '#0f5c8a', '#020c18'); X.fillRect(0, 0, W, H);
        X.strokeStyle = 'rgba(120,220,255,.12)'; X.lineWidth = 4;
        for (let r = 0; r < 14; r++) { X.beginPath(); for (let x = 0; x <= W; x += 30) { const y = 160 + r * 130 + Math.sin(x / 120 + t * 1.2 + r) * 18; x ? X.lineTo(x, y) : X.moveTo(x, y); } X.stroke(); } } },
    { name: 'synth', d(X, t) { X.fillStyle = lin(X, '#2a0845', '#05000d'); X.fillRect(0, 0, W, H);
        X.strokeStyle = 'rgba(255,60,200,.35)'; X.lineWidth = 3; const hz = 1250;
        for (let i = -12; i <= 12; i++) { X.beginPath(); X.moveTo(W / 2 + i * 12, hz); X.lineTo(W / 2 + i * 160, H); X.stroke(); }
        for (let k = 0; k < 12; k++) { const p = ((k + t * 0.6) % 12) / 12, y = hz + (H - hz) * p * p; X.beginPath(); X.moveTo(0, y); X.lineTo(W, y); X.stroke(); }
        X.fillStyle = 'rgba(0,0,0,.3)'; X.fillRect(0, 0, W, H); } },
    { name: 'galaxy', d(X, t) { X.fillStyle = '#07021a'; X.fillRect(0, 0, W, H);
        for (const [x, y, c] of [[250, 500, 'rgba(140,60,255,.22)'], [850, 1300, 'rgba(0,180,255,.18)'], [600, 900, 'rgba(255,60,160,.12)']]) { const g = X.createRadialGradient(x, y, 10, x, y, 520); g.addColorStop(0, c); g.addColorStop(1, 'rgba(0,0,0,0)'); X.fillStyle = g; X.fillRect(0, 0, W, H); }
        for (let i = 0; i < 140; i++) { X.globalAlpha = 0.3 + 0.7 * Math.abs(Math.sin(t * 1.5 + i)); X.fillStyle = '#fff'; X.fillRect(hash(i) * W, hash(i + 500) * H, 2 + (i % 3), 2 + (i % 3)); } X.globalAlpha = 1; } },
    { name: 'forest', d(X, t) { X.fillStyle = rad(X, '#145c43', '#02140d'); X.fillRect(0, 0, W, H);
        for (let i = 0; i < 26; i++) { const x = hash(i) * W, y = (hash(i + 40) * H - t * (20 + i % 5 * 8)) % H, r = 20 + hash(i + 80) * 60; X.fillStyle = `rgba(180,255,170,${0.04 + hash(i + 9) * 0.06})`; X.beginPath(); X.arc(x, y < 0 ? y + H : y, r, 0, 7); X.fill(); } } },
    { name: 'lava', d(X, t) { X.fillStyle = lin(X, '#1a0300', '#4a0d00'); X.fillRect(0, 0, W, H);
        for (let i = 0; i < 60; i++) { const y = H - ((hash(i) * H + t * (60 + i % 7 * 25)) % H), x = hash(i + 7) * W + Math.sin(t + i) * 20; X.fillStyle = `rgba(255,${120 + i % 5 * 25},40,${0.25 + hash(i + 3) * 0.5})`; X.beginPath(); X.arc(x, y, 3 + i % 4, 0, 7); X.fill(); }
        const g = X.createLinearGradient(0, 1500, 0, H); g.addColorStop(0, 'rgba(255,80,0,0)'); g.addColorStop(1, 'rgba(255,90,0,.35)'); X.fillStyle = g; X.fillRect(0, 1500, W, 420); } },
    { name: 'blueprint', d(X, t) { X.fillStyle = '#0b3a66'; X.fillRect(0, 0, W, H);
        X.strokeStyle = 'rgba(255,255,255,.07)'; X.lineWidth = 2; for (let x = 0; x < W; x += 40) { X.beginPath(); X.moveTo(x, 0); X.lineTo(x, H); X.stroke(); } for (let y = 0; y < H; y += 40) { X.beginPath(); X.moveTo(0, y); X.lineTo(W, y); X.stroke(); }
        X.strokeStyle = 'rgba(255,255,255,.14)'; for (let x = 0; x < W; x += 200) { X.beginPath(); X.moveTo(x, 0); X.lineTo(x, H); X.stroke(); } for (let y = 0; y < H; y += 200) { X.beginPath(); X.moveTo(0, y); X.lineTo(W, y); X.stroke(); } } },
    { name: 'candy', d(X, t) { X.fillStyle = lin(X, '#ff4f9a', '#5a1fd1', 1); X.fillRect(0, 0, W, H);
        X.save(); X.translate(W / 2, H / 2); X.rotate(-0.5); X.fillStyle = 'rgba(255,255,255,.07)'; const o = (t * 40) % 140; for (let i = -16; i < 16; i++) X.fillRect(i * 140 + o, -1400, 60, 2800); X.restore();
        X.fillStyle = 'rgba(0,0,0,.38)'; X.fillRect(0, 0, W, H); } },
    { name: 'hexgrid', d(X, t) { X.fillStyle = rad(X, '#1b2a3a', '#05080c'); X.fillRect(0, 0, W, H); const s = 54;
        for (let r = 0; r < 26; r++) for (let c = 0; c < 13; c++) { const x = c * s * 1.5, y = r * s * 0.87 * 2 + (c % 2) * s * 0.87, a = 0.05 + 0.09 * Math.max(0, Math.sin(t * 1.4 - (x + y) / 300));
          X.strokeStyle = `rgba(0,255,220,${a})`; X.lineWidth = 2; X.beginPath(); for (let k = 0; k < 6; k++) { const q = k * Math.PI / 3; X[k ? 'lineTo' : 'moveTo'](x + Math.cos(q) * s * 0.92, y + Math.sin(q) * s * 0.92); } X.closePath(); X.stroke(); } } },
    { name: 'aurora', d(X, t) { X.fillStyle = '#020818'; X.fillRect(0, 0, W, H);
        for (let k = 0; k < 3; k++) { X.fillStyle = ['rgba(0,255,150,.10)', 'rgba(80,120,255,.10)', 'rgba(200,80,255,.08)'][k]; X.beginPath(); X.moveTo(0, 0);
          for (let x = 0; x <= W; x += 40) X.lineTo(x, 380 + k * 160 + Math.sin(x / 180 + t * (0.7 + k * 0.3) + k * 2) * 120); X.lineTo(W, 0); X.closePath(); X.fill(); }
        for (let i = 0; i < 60; i++) { X.fillStyle = 'rgba(255,255,255,.5)'; X.fillRect(hash(i) * W, hash(i + 99) * H, 2, 2); } } },
    { name: 'mono', d(X, t) { X.fillStyle = rad(X, '#2b2b30', '#060607'); X.fillRect(0, 0, W, H);
        X.strokeStyle = 'rgba(255,255,255,.05)'; X.lineWidth = 2; for (let r = 120; r < 1400; r += 90) { X.beginPath(); X.arc(W / 2, H / 2, r + (t * 30 % 90), 0, 7); X.stroke(); } } },
  ];
  window.SKINS_N = SKINS.length;
  const P = CanvasRenderingContext2D.prototype, FR = P.fillRect; let done = false, t0 = 0;
  P.fillRect = function (x, y, w, h) {
    const sk = SKINS[(window.SKIN | 0) % SKINS.length];
    if (sk && !done && x === 0 && y === 0 && w >= W && h >= H && this.canvas.width === W) {
      const fs = this.fillStyle, opaque = typeof fs !== 'string' || !/rgba|hsla/.test(fs) || /,\s*1\)$/.test(fs);
      if (opaque) { done = true; this.save(); this.fillRect = FR; const X = this; X.fillRect = FR; try { sk.d(X, t0 / 30); } finally { delete X.fillRect; this.restore(); } return; }
    }
    return FR.call(this, x, y, w, h);
  };
  const hook = () => { if (!window.frame || window.frame._sk) return; const f0 = window.frame;
    window.frame = function (fast) { done = false; if (!fast) t0++; return f0.apply(this, arguments); }; window.frame._sk = 1; };
  hook(); window.addEventListener('load', hook);
})();
