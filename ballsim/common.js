const C = document.getElementById('c'), X = C.getContext('2d');
const W = 1080, H = 1920, FPS = 30;
let S, rnd, EV = [];
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const back = x => { x = Math.max(0, Math.min(1, x)); const c = 1.9; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const ease = x => 1 - Math.pow(1 - Math.max(0, Math.min(1, x)), 3);
const COLS = ['#ff4d6d', '#4dabff', '#ffd23f', '#5dff8f', '#c77dff', '#ff9f43', '#2ee6d6', '#ff7ad9', '#ffffff', '#a0ff4d'];
const NAMES = ['RED', 'BLUE', 'YELLOW', 'GREEN', 'PURPLE', 'ORANGE', 'CYAN', 'PINK', 'WHITE', 'LIME'];
function txt(s, x, y, size, col, stroke) { X.font = `900 ${size}px Arial`; X.textAlign = 'center'; if (stroke) { X.lineWidth = stroke; X.strokeStyle = '#000'; X.strokeText(s, x, y); } X.fillStyle = col; X.fillText(s, x, y); }
function ball(x, y, r, col, a = 1, label) { X.save(); X.globalAlpha = a; X.shadowColor = col; X.shadowBlur = 18; X.fillStyle = col; X.beginPath(); X.arc(x, y, r, 0, 7); X.fill(); X.shadowBlur = 0;
  const g = X.createRadialGradient(x - r * .4, y - r * .5, r * .1, x, y, r); g.addColorStop(0, 'rgba(255,255,255,.55)'); g.addColorStop(.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,.3)'); X.fillStyle = g; X.beginPath(); X.arc(x, y, r, 0, 7); X.fill();
  if (label) { X.font = `900 ${Math.round(r * 0.9)}px Arial`; X.textAlign = 'center'; X.fillStyle = '#111'; X.fillText(label, x, y + r * 0.32); } X.restore(); }
function bg(a, b) { const g = X.createRadialGradient(W / 2, H / 2, 80, W / 2, H / 2, 1250); g.addColorStop(0, a); g.addColorStop(1, b); X.fillStyle = g; X.fillRect(0, 0, W, H); }
function wm() { X.font = '800 24px Arial'; X.textAlign = 'center'; X.fillStyle = 'rgba(255,255,255,.45)'; X.fillText('FOLLOW  PHYSICS ROYALE ARENA', W / 2, 1860); }
function endCard(k, big, col, sub) { X.fillStyle = `rgba(0,0,0,${Math.min(0.6, k)})`; X.fillRect(0, 0, W, H); X.save(); X.translate(W / 2, 1000); X.scale(back((k - 0.1) / 0.4), back((k - 0.1) / 0.4));
  X.shadowColor = col; X.shadowBlur = 40; txt(big, 0, 0, 110, col, 10); X.shadowBlur = 0; txt(sub, 0, 100, 50, '#fff', 6); X.restore();
  for (let i = 0; i < 60; i++) { const a = (i * 137.5) % 360 * Math.PI / 180, v = 300 + (i * 53) % 500, kk = Math.min(k, 2.5); X.fillStyle = [col, '#fff', '#ffd23f', '#ff5ab4'][i % 4]; X.fillRect(W / 2 + Math.cos(a) * v * kk, 900 + Math.sin(a) * v * kk + 200 * kk * kk, 14, 22); } }
function out(fast, done, extra) { S.f++; const ev = EV; EV = []; return Object.assign({ done, ev: fast ? [] : ev.map(e => ({ ...e, f: S.f })), img: fast ? '' : C.toDataURL('image/jpeg', 0.9), t: S.t }, extra || {}); }
