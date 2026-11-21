// Shared "motion" layer for all Studio renderers (ideas from bangtutorial/bang-motion, MIT):
// words arrive one by one with a short blur + rise (as they are spoken), the spoken word gets a marker stroke behind it,
// a light film grain lives over the frame, and scene cuts are carried by a whip (slide + motion blur) instead of a plain fade.
// Pure DOM/CSS, deterministic in t (frame-by-frame capture safe). Include in a page, then call KIN.* from its render(t).
window.KIN = (function () {
  const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), eo = (v) => 1 - Math.pow(1 - cl(v), 3);
  // one caption word. lt = time inside the line, s/e = word start/end (same clock). opt: on (marker colour), txt (active text colour), mark:false to skip the stroke
  function word(span, lt, s, e, opt) {
    opt = opt || {}; const p = cl((lt - s + 0.1) / 0.22), q = eo(p), on = lt >= s - 0.03 && lt < e + 0.06;
    span.style.display = 'inline-block'; span.style.transition = 'none';
    span.style.opacity = p <= 0 ? (opt.ghost == null ? 0 : opt.ghost) : Math.max(opt.ghost || 0, q);
    span.style.transform = `translateY(${(1 - q) * 38}%) scaleY(${1 + (1 - q) * 0.25})` + (on ? ` scale(${1 + 0.08 * cl((lt - s + 0.03) / 0.1)})` : '');
    span.style.filter = p < 1 ? `blur(${((1 - q) * 9).toFixed(1)}px)` : 'none';
    if (opt.mark !== false) {
      const m = on ? eo((lt - s + 0.03) / 0.16) : (lt >= e ? 1 - cl((lt - e) / 0.2) : 0);
      span.style.backgroundImage = m > 0 ? `linear-gradient(transparent 58%, ${opt.on || 'rgba(255,90,31,.85)'} 58%, ${opt.on || 'rgba(255,90,31,.85)'} 92%, transparent 92%)` : 'none';
      span.style.backgroundRepeat = 'no-repeat'; span.style.backgroundSize = `${(m * 100).toFixed(1)}% 100%`; span.style.backgroundPosition = '0 0';
    }
    if (opt.txt) span.style.color = on ? opt.txt : (opt.base || '');
  }
  // title / headline: whole words fly in with stagger starting at t0
  function headline(el, t, t0, gap) {
    gap = gap == null ? 0.09 : gap;
    if (!el._kw) { el._kw = 1; const walk = (n) => { [...n.childNodes].forEach((c) => { if (c.nodeType === 3 && c.textContent.trim()) { const f = document.createDocumentFragment(); c.textContent.split(/(\s+)/).forEach((w) => { if (!w.trim()) { f.appendChild(document.createTextNode(w)); return; } const s = document.createElement('span'); s.className = 'kw'; s.textContent = w; f.appendChild(s); }); c.replaceWith(f); } else if (c.nodeType === 1 && c.tagName !== 'BR') walk(c); }); }; walk(el); }
    [...el.querySelectorAll('.kw')].forEach((s, i) => { const p = cl((t - t0 - i * gap) / 0.5), q = 1 - Math.pow(1 - p, 4); s.style.display = 'inline-block'; s.style.opacity = q; s.style.transform = `translateY(${(1 - q) * 60}%) scaleY(${1 + (1 - q) * 0.4})`; s.style.filter = p < 1 ? `blur(${((1 - q) * 14).toFixed(1)}px)` : 'none'; });
  }
  // film grain over everything (call every frame)
  let G = null;
  function grain(t, a) {
    if (!G) { G = document.createElement('canvas'); G.width = 540; G.height = 960; Object.assign(G.style, { position: 'absolute', left: 0, top: 0, width: '1080px', height: '1920px', pointerEvents: 'none', mixBlendMode: 'overlay', zIndex: 99, imageRendering: 'pixelated' });
      const g = G.getContext('2d'), im = g.createImageData(540, 960); let sd = 11; for (let i = 0; i < im.data.length; i += 4) { sd = (sd * 16807) % 2147483647; const v = 128 + ((sd % 160) - 80); im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; } g.putImageData(im, 0, 0); document.body.appendChild(G); }
    const f = Math.floor(t * 12); G.style.opacity = a == null ? 0.16 : a; G.style.transform = `translate(${(f * 37) % 9 - 4}px,${(f * 53) % 9 - 4}px)`;
  }
  // whip transition: element leaving (u 0→1) slides out to the left with motion blur; entering one comes from the right
  function whipOut(el, u) { const q = eo(u); el.style.transform = `translateX(${-q * 1080}px) skewX(${q * 8}deg)`; el.style.filter = `blur(${(Math.sin(Math.PI * cl(u)) * 18).toFixed(1)}px)`; }
  function whipIn(el, u) { const q = eo(u); el.style.transform = u >= 1 ? '' : `translateX(${(1 - q) * 1080}px) skewX(${-(1 - q) * 8}deg)`; el.style.filter = u >= 1 ? '' : `blur(${(Math.sin(Math.PI * cl(u)) * 18).toFixed(1)}px)`; }
  return { word, headline, grain, whipOut, whipIn, cl, eo };
})();
