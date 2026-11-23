// Motion layer for physics pages (bang-motion style word entrance): big header texts (centered, font ≥ 60px, y < 320)
// fly in word by word with a blur during the first second of the video. Pure wrapper around fillText — sims stay untouched.
(function () {
  const C = CanvasRenderingContext2D.prototype, F = C.fillText, S = C.strokeText; let T = 99;
  const big = (X, y) => { const m = /(\d+)px/.exec(X.font); return m && +m[1] >= 60 && y < 320 && X.textAlign === 'center'; };
  function draw(orig, X, s, x, y, mw) {
    if (T > 1.4 || typeof s !== 'string' || !big(X, y) || !/\s/.test(s.trim()) && T > 0.9) return orig.call(X, s, x, y, mw);
    const ws = String(s).split(' '), sp = X.measureText(' ').width, wd = ws.map((w) => X.measureText(w).width), tot = wd.reduce((a, b) => a + b, 0) + sp * (ws.length - 1);
    let cx = x - tot / 2; const al = X.textAlign, ga = X.globalAlpha, fl = X.filter; X.textAlign = 'left';
    ws.forEach((w, i) => { const p = Math.max(0, Math.min(1, (T - 0.1 - i * 0.12) / 0.45)), q = 1 - Math.pow(1 - p, 4);
      if (p > 0) { X.globalAlpha = ga * q; X.filter = p < 1 ? `blur(${((1 - q) * 10).toFixed(1)}px)` : fl; orig.call(X, w, cx, y + (1 - q) * 40); } cx += wd[i] + sp; });
    X.textAlign = al; X.globalAlpha = ga; X.filter = fl;
  }
  const BR = (s) => (typeof s === 'string' && window.BRAND && s.includes('PHYSICS ROYALE ARENA')) ? s.replace('PHYSICS ROYALE ARENA', window.BRAND) : s;   // channel's own name in the watermark
  C.fillText = function (s, x, y, mw) { draw(F, this, BR(s), x, y, mw); };
  C.strokeText = function (s, x, y, mw) { draw(S, this, s, x, y, mw); };
  const hook = () => { if (!window.frame || window.frame._k) return; const f0 = window.frame, i0 = window.init; let n = 0;
    window.frame = function (fast) { T = fast ? 99 : n++ / 30; return f0.apply(this, arguments); }; window.frame._k = 1;
    window.init = function () { n = 0; return i0.apply(this, arguments); }; };
  hook(); window.addEventListener('load', hook);
})();
