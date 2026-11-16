// Simple hand-drawn flags (drawn inside a circle of radius r at 0,0). Original drawings, no images.
(function (root) {
  const star = (c, x, y, R, col) => { c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? R * 0.42 : R; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); c.fillStyle = col; c.fill(); };
  const hbands = (c, r, cols) => cols.forEach((col, i) => { c.fillStyle = col; c.fillRect(-r, -r + (2 * r / cols.length) * i, 2 * r, 2 * r / cols.length + 1); });
  const vbands = (c, r, cols) => cols.forEach((col, i) => { c.fillStyle = col; c.fillRect(-r + (2 * r / cols.length) * i, -r, 2 * r / cols.length + 1, 2 * r); });
  const crescent = (c, x, y, R, col, bg, dx) => { c.fillStyle = col; c.beginPath(); c.arc(x, y, R, 0, 7); c.fill(); c.fillStyle = bg; c.beginPath(); c.arc(x + dx, y - dx * 0.25, R * 0.82, 0, 7); c.fill(); };
  const F = {
    India: { col: '#ff9933', d(c, r) { hbands(c, r, ['#ff9933', '#ffffff', '#138808']); c.strokeStyle = '#000080'; c.lineWidth = r * 0.06; c.beginPath(); c.arc(0, 0, r * 0.22, 0, 7); c.stroke(); for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * r * 0.22, Math.sin(a) * r * 0.22); c.lineWidth = r * 0.02; c.stroke(); } } },
    Pakistan: { col: '#01411c', d(c, r) { c.fillStyle = '#01411c'; c.fillRect(-r, -r, 2 * r, 2 * r); c.fillStyle = '#fff'; c.fillRect(-r, -r, r * 0.5, 2 * r); crescent(c, r * 0.22, 0, r * 0.45, '#fff', '#01411c', r * 0.16); star(c, r * 0.42, -r * 0.18, r * 0.15, '#fff'); } },
    USA: { col: '#3c3b6e', d(c, r) { for (let i = 0; i < 13; i++) { c.fillStyle = i % 2 ? '#fff' : '#b22234'; c.fillRect(-r, -r + i * 2 * r / 13, 2 * r, 2 * r / 13 + 1); } c.fillStyle = '#3c3b6e'; c.fillRect(-r, -r, r * 1.05, r * 1.05); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) star(c, -r * 0.82 + j * r * 0.26, -r * 0.82 + i * r * 0.24, r * 0.06, '#fff'); } },
    Brazil: { col: '#009c3b', d(c, r) { c.fillStyle = '#009c3b'; c.fillRect(-r, -r, 2 * r, 2 * r); c.fillStyle = '#ffdf00'; c.beginPath(); c.moveTo(-r * 0.85, 0); c.lineTo(0, -r * 0.62); c.lineTo(r * 0.85, 0); c.lineTo(0, r * 0.62); c.closePath(); c.fill(); c.fillStyle = '#002776'; c.beginPath(); c.arc(0, 0, r * 0.36, 0, 7); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = r * 0.06; c.beginPath(); c.arc(-r * 0.1, r * 0.5, r * 0.6, -1.9, -1.0); c.stroke(); } },
    Japan: { col: '#bc002d', d(c, r) { c.fillStyle = '#fff'; c.fillRect(-r, -r, 2 * r, 2 * r); c.fillStyle = '#bc002d'; c.beginPath(); c.arc(0, 0, r * 0.45, 0, 7); c.fill(); } },
    Germany: { col: '#ffce00', d(c, r) { hbands(c, r, ['#000000', '#dd0000', '#ffce00']); } },
    France: { col: '#0055a4', d(c, r) { vbands(c, r, ['#0055a4', '#ffffff', '#ef4135']); } },
    Italy: { col: '#009246', d(c, r) { vbands(c, r, ['#009246', '#ffffff', '#ce2b37']); } },
    Indonesia: { col: '#ce1126', d(c, r) { hbands(c, r, ['#ce1126', '#ffffff']); } },
    Turkey: { col: '#e30a17', d(c, r) { c.fillStyle = '#e30a17'; c.fillRect(-r, -r, 2 * r, 2 * r); crescent(c, -r * 0.12, 0, r * 0.45, '#fff', '#e30a17', r * 0.13); star(c, r * 0.42, 0, r * 0.17, '#fff'); } },
    Argentina: { col: '#74acdf', d(c, r) { hbands(c, r, ['#74acdf', '#ffffff', '#74acdf']); c.fillStyle = '#f6b40e'; c.beginPath(); c.arc(0, 0, r * 0.16, 0, 7); c.fill(); } },
    China: { col: '#de2910', d(c, r) { c.fillStyle = '#de2910'; c.fillRect(-r, -r, 2 * r, 2 * r); star(c, -r * 0.4, -r * 0.3, r * 0.3, '#ffde00'); [[-0.05, -0.62], [0.12, -0.42], [0.12, -0.15], [-0.05, 0.05]].forEach(([x, y]) => star(c, x * r, y * r, r * 0.1, '#ffde00')); } },
    Bangladesh: { col: '#006a4e', d(c, r) { c.fillStyle = '#006a4e'; c.fillRect(-r, -r, 2 * r, 2 * r); c.fillStyle = '#f42a41'; c.beginPath(); c.arc(-r * 0.1, 0, r * 0.45, 0, 7); c.fill(); } },
    Russia: { col: '#0039a6', d(c, r) { hbands(c, r, ['#ffffff', '#0039a6', '#d52b1e']); } },
    UK: { col: '#012169', d(c, r) { c.fillStyle = '#012169'; c.fillRect(-r, -r, 2 * r, 2 * r); c.strokeStyle = '#fff'; c.lineWidth = r * 0.36; c.beginPath(); c.moveTo(-r, -r); c.lineTo(r, r); c.moveTo(r, -r); c.lineTo(-r, r); c.stroke(); c.strokeStyle = '#c8102e'; c.lineWidth = r * 0.12; c.stroke(); c.fillStyle = '#fff'; c.fillRect(-r, -r * 0.3, 2 * r, r * 0.6); c.fillRect(-r * 0.3, -r, r * 0.6, 2 * r); c.fillStyle = '#c8102e'; c.fillRect(-r, -r * 0.17, 2 * r, r * 0.34); c.fillRect(-r * 0.17, -r, r * 0.34, 2 * r); } },
    Canada: { col: '#d80621', d(c, r) { vbands(c, r, ['#d80621', '#ffffff', '#ffffff', '#d80621']); star(c, 0, 0, r * 0.38, '#d80621'); } },
    Mexico: { col: '#006847', d(c, r) { vbands(c, r, ['#006847', '#ffffff', '#ce1126']); c.fillStyle = '#8c5a2b'; c.beginPath(); c.arc(0, 0, r * 0.18, 0, 7); c.fill(); } },
    Nepal: { col: '#dc143c', d(c, r) { c.fillStyle = '#003893'; c.fillRect(-r, -r, 2 * r, 2 * r); c.fillStyle = '#dc143c'; c.beginPath(); c.moveTo(-r * 0.6, -r * 0.9); c.lineTo(r * 0.5, -r * 0.05); c.lineTo(-r * 0.2, -r * 0.05); c.lineTo(r * 0.5, r * 0.9); c.lineTo(-r * 0.6, r * 0.9); c.closePath(); c.fill(); star(c, -r * 0.3, r * 0.45, r * 0.15, '#fff'); } },
  };
  root.FLAGS = F;
})(typeof window !== 'undefined' ? window : module.exports);
