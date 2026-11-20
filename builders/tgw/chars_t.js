// Original 2D characters: GOLU (sweet, cheerful) and BUNTY (grumpy, oversmart) — school uniform.
// o: { m: mouth 0..1, blink: bool, mood: 'happy'|'smile'|'shock'|'grumpy'|'smug'|'angry'|'laugh'|'disgust', wave: 0..1, t: seconds }
(function (root) {
  const TEE = '#ff8a1f', TEE_D = '#e06c00', DENIM = '#3b6fd6';
  const SKIN = '#e9a97a', SKIN_D = '#c98557', HAIR = '#1d1a24', SHIRT = '#fbfbff', SHIRT_D = '#d9dbea', SHORTS = '#27346b', TIE = '#9b1c31', TIE_S = '#f2c94c';
  function eyes(x, y, mood, blink, who, dir = 0) {
    const lx = dir * 5;
    if (blink || mood === 'laugh') return `<path d="M${x - 46},${y} q14,-14 28,0 M${x + 18},${y} q14,-14 28,0" stroke="#1d1a24" stroke-width="7" fill="none" stroke-linecap="round"/>`;
    if (who === 'B' && ['grumpy', 'smug', 'angry'].includes(mood)) {   // heavy half-lidded eyes
      return `<g><ellipse cx="${x - 32}" cy="${y}" rx="17" ry="15" fill="#fff"/><ellipse cx="${x + 32}" cy="${y}" rx="17" ry="15" fill="#fff"/>
        <circle cx="${x - 28 + lx}" cy="${y + 4}" r="9" fill="#2a1a12"/><circle cx="${x + 36 + lx}" cy="${y + 4}" r="9" fill="#2a1a12"/>
        <path d="M${x - 52},${y - 2} L${x - 12},${y - 4} L${x - 12},${y - 16} L${x - 52},${y - 16}Z M${x + 12},${y - 4} L${x + 52},${y - 2} L${x + 52},${y - 16} L${x + 12},${y - 16}Z" fill="${SKIN}"/>
        <path d="M${x - 52},${y - 2} L${x - 12},${y - 4} M${x + 12},${y - 4} L${x + 52},${y - 2}" stroke="#1d1a24" stroke-width="5" stroke-linecap="round"/></g>`;
    }
    const big = (mood === 'shock' ? 1.25 : 1) * (who === 'G' ? 1.15 : 1);
    return `<g><ellipse cx="${x - 32}" cy="${y}" rx="${19 * big}" ry="${22 * big}" fill="#fff" stroke="#1d1a24" stroke-width="3"/><ellipse cx="${x + 32}" cy="${y}" rx="${19 * big}" ry="${22 * big}" fill="#fff" stroke="#1d1a24" stroke-width="3"/>
      <circle cx="${x - 29 + lx}" cy="${y + 3}" r="${12 * (mood === 'shock' ? 0.7 : 1)}" fill="#3b2314"/><circle cx="${x + 35 + lx}" cy="${y + 3}" r="${12 * (mood === 'shock' ? 0.7 : 1)}" fill="#3b2314"/>
      <circle cx="${x - 25 + lx}" cy="${y - 3}" r="4.5" fill="#fff"/><circle cx="${x + 39 + lx}" cy="${y - 3}" r="4.5" fill="#fff"/></g>`;
  }
  function brows(x, y, mood, who) {
    const A = { happy: [-6, -6], smile: [-4, -4], shock: [-16, -16], grumpy: [8, 8], angry: [12, 12], smug: [10, -10], laugh: [-6, -6], disgust: [6, -8], confused: [-16, 10] }[mood] || [0, 0];
    const d = who === 'B' ? 1 : 0.7;
    return `<path d="M${x - 54},${y - 30 - A[0] * 0.3} L${x - 14},${y - 30 + A[0] * d}" stroke="${HAIR}" stroke-width="${who === 'B' ? 11 : 8}" stroke-linecap="round"/>
      <path d="M${x + 14},${y - 30 + A[1] * d} L${x + 54},${y - 30 - A[1] * 0.3}" stroke="${HAIR}" stroke-width="${who === 'B' ? 11 : 8}" stroke-linecap="round"/>`;
  }
  function mouth(x, y, mood, m, who) {
    if (who === 'T' && m < 0.12 && ['happy', 'smile', 'smug'].includes(mood)) return `<path d="M${x - 34},${y - 6} Q${x + 4},${y + 30} ${x + 38},${y - 14}" fill="#6b1b22" stroke="#1d1a24" stroke-width="5"/><path d="M${x - 24},${y - 2} L${x - 4},${y + 2} L${x - 4},${y + 12} L${x - 22},${y + 8}Z M${x + 4},${y + 1} L${x + 26},${y - 6} L${x + 24},${y + 6} L${x + 4},${y + 12}Z" fill="#fff"/>`;
    const open = Math.max(m, mood === 'laugh' ? 0.8 : mood === 'shock' ? 0.7 : 0);
    if (open > 0.12) {
      const w = (mood === 'grumpy' || mood === 'angry') ? 26 : 34, h = 6 + open * 30;
      return `<g><ellipse cx="${x}" cy="${y + h * 0.35}" rx="${w}" ry="${h}" fill="#6b1b22" stroke="#1d1a24" stroke-width="4"/>
        <path d="M${x - w * 0.8},${y + h * 0.35 - h * 0.65} Q${x},${y - 6} ${x + w * 0.8},${y + h * 0.35 - h * 0.65}" fill="#fff"/>
        <ellipse cx="${x}" cy="${y + h * 0.9}" rx="${w * 0.5}" ry="${h * 0.3}" fill="#e05a6a"/></g>`;
    }
    if (mood === 'grumpy' || mood === 'angry') return `<path d="M${x - 24},${y + 8} Q${x},${y - 6} ${x + 24},${y + 8}" stroke="#1d1a24" stroke-width="6" fill="none" stroke-linecap="round"/>`;
    if (mood === 'smug') return `<path d="M${x - 22},${y + 2} Q${x + 2},${y + 10} ${x + 26},${y - 8}" stroke="#1d1a24" stroke-width="6" fill="none" stroke-linecap="round"/>`;
    if (mood === 'confused') return `<path d="M${x - 24},${y + 6} q12,-10 24,0 q12,10 24,-2" stroke="#1d1a24" stroke-width="6" fill="none" stroke-linecap="round"/>`;
    if (mood === 'disgust') return `<path d="M${x - 22},${y + 4} L${x - 8},${y - 2} L${x + 6},${y + 6} L${x + 22},${y}" stroke="#1d1a24" stroke-width="6" fill="none" stroke-linecap="round"/>`;
    return `<path d="M${x - 30},${y - 2} Q${x},${y + 26} ${x + 30},${y - 2}" fill="#6b1b22" stroke="#1d1a24" stroke-width="5"/><path d="M${x - 22},${y + 1} Q${x},${y + 8} ${x + 22},${y + 1}" fill="#fff"/>`;
  }
  // one arm: shoulder at (sx,60), rotated `a` degrees (0 = hanging down; + = swings toward -x side for right arm... we use SVG rotate)
  function arm(sx, a, sleeve, hand = 'fist') {
    const h = hand === 'point' ? `<rect x="-6" y="118" width="12" height="40" rx="6" fill="${SKIN}" stroke="${SKIN_D}" stroke-width="2"/>` : hand === 'open' ? `<ellipse cx="0" cy="128" rx="22" ry="16" fill="${SKIN}" stroke="${SKIN_D}" stroke-width="2"/>` : '';
    return `<g transform="translate(${sx},60) rotate(${a})"><rect x="-22" y="0" width="44" height="64" rx="18" fill="${sleeve}" stroke="#b9bdd3" stroke-width="3"/><rect x="-16" y="56" width="32" height="70" rx="16" fill="${SKIN}"/><circle cx="0" cy="124" r="20" fill="${SKIN}" stroke="${SKIN_D}" stroke-width="3"/>${h}</g>`;
  }
  function armsSvg(who, o, crossed) {
    const t = o.t || 0, neat = who === 'G' || who === 'T', dir = o.dir || (neat ? 1 : -1), pose = o.pose || (o.wave ? 'wave' : 'idle');
    if (crossed) return `<path d="M-108,70 Q-130,150 -40,150 L60,138" stroke="${SHIRT}" stroke-width="44" fill="none" stroke-linecap="round"/><path d="M108,70 Q130,150 40,160 L-56,150" stroke="${SHIRT_D}" stroke-width="44" fill="none" stroke-linecap="round"/><circle cx="66" cy="136" r="22" fill="${SKIN}"/><circle cx="-62" cy="150" r="22" fill="${SKIN}"/>`;
    let L = neat ? 14 : 18, R = neat ? -14 : -18, hl = 'fist', hr = 'fist';
    const sw = Math.sin(t * 1.7) * 3;
    if (pose === 'idle') { L += sw; R -= sw; }
    else if (pose === 'talk') { const g = Math.abs(Math.sin(t * 4.2)), g2 = Math.abs(Math.sin(t * 3.1 + 1)); if (dir > 0) { R = -40 - 55 * g; L = 18 + 10 * g2; hr = 'open'; } else { L = 40 + 55 * g; R = -18 - 10 * g2; hl = 'open'; } }
    else if (pose === 'point') { const j = Math.sin(t * 14) * 6; if (dir > 0) { R = -100 + j; hr = 'point'; } else { L = 100 + j; hl = 'point'; } }
    else if (pose === 'laugh') { L = -38 + Math.sin(t * 22) * 5; R = 38 - Math.sin(t * 22) * 5; }
    else if (pose === 'shock') { const j = Math.sin(t * 30) * 4; L = 140 + j; R = -140 - j; hl = hr = 'open'; }
    else if (pose === 'shrug') { L = 62; R = -62; hl = hr = 'open'; }
    else if (pose === 'wave') { if (neat || dir > 0) R = -150 + Math.sin(t * 10) * 16; else L = 150 + Math.sin(t * 10) * 16; hr = hl = 'open'; }
    return who === 'T' ? arm(-112, L, TEE, hl) + arm(112, R, TEE_D, hr) : arm(-112, L, SHIRT, hl) + arm(112, R, neat ? SHIRT : SHIRT_D, hr);
  }
  function body(who, o) {
    const wav = o.wave || 0, t = o.t || 0;
    const neat = who === 'G';
    const armR = neat ? (wav ? -150 + Math.sin(t * 10) * 16 : 14) : 0;
    const crossed = o.pose ? o.pose === 'cross' : (!neat && ['grumpy', 'smug', 'angry'].includes(o.mood) && !o.wave);
    return `
    <g>
      <!-- legs -->
      <rect x="-62" y="250" width="44" height="120" rx="18" fill="${SKIN}"/><rect x="18" y="250" width="44" height="120" rx="18" fill="${SKIN}"/>
      <rect x="-66" y="330" width="52" height="34" rx="8" fill="#fff"/><rect x="14" y="330" width="52" height="34" rx="8" fill="#fff"/>
      <path d="M-74,362 h66 q12,0 12,14 v8 h-90 z" fill="#1d1a24"/><path d="M8,362 h66 q12,0 12,14 v8 h-90 z" fill="#1d1a24" transform="translate(-4,0)"/>
      <!-- shorts -->
      <path d="M-92,180 L92,180 L100,282 L6,282 L0,236 L-6,282 L-100,282 Z" fill="${SHORTS}" stroke="#151c40" stroke-width="4"/>
      <!-- shirt -->
      <path d="M-110,40 Q0,10 110,40 L118,${neat ? 196 : 210} Q0,${neat ? 214 : 226} -118,${neat ? 196 : 190} Z" fill="${SHIRT}" stroke="#b9bdd3" stroke-width="4"/>
      ${neat ? '' : '<path d="M30,196 Q70,232 112,206 L118,214 Q74,246 26,214 Z" fill="#f1f2f8" stroke="#b9bdd3" stroke-width="3"/>'}
      <path d="M-40,26 L0,64 L40,26" fill="none" stroke="#b9bdd3" stroke-width="5"/>
      <rect x="-118" y="60" width="18" height="140" rx="6" fill="#3d63c9"/><rect x="100" y="60" width="18" height="140" rx="6" fill="#3d63c9"/>
      <!-- tie -->
      <g transform="translate(${neat ? 0 : 10},48) rotate(${neat ? 0 : 14})">
        <path d="M-14,0 L14,0 L8,16 L-8,16Z" fill="${TIE}"/><path d="M-8,16 L8,16 L18,${neat ? 120 : 96} L0,${neat ? 140 : 114} L-18,${neat ? 120 : 96}Z" fill="${TIE}"/>
        <path d="M-12,40 L14,30 M-16,70 L16,58 M-14,100 L12,90" stroke="${TIE_S}" stroke-width="5"/></g>
      <!-- school badge -->
      <path d="M-86,92 h32 v26 q-16,12 -32,0z" fill="#27346b"/><path d="M-78,100 h16" stroke="#f2c94c" stroke-width="4"/>
      <!-- arms (pose) -->
      ${armsSvg(who, o, crossed)}
    </g>`;
  }
  function bodyT(o) {
    return `<g>
      <rect x="-62" y="250" width="44" height="120" rx="18" fill="${SKIN}"/><rect x="18" y="250" width="44" height="120" rx="18" fill="${SKIN}"/>
      <rect x="22" y="290" width="36" height="16" rx="5" fill="#f4d7b3" stroke="#c9a37a" stroke-width="2" transform="rotate(-12 40 298)"/>
      <rect x="-66" y="312" width="52" height="52" rx="8" fill="#fff"/><path d="M-66,330 h52" stroke="#e53950" stroke-width="5"/><rect x="14" y="348" width="52" height="16" rx="6" fill="#fff"/>
      <path d="M-78,362 h70 q14,0 14,16 v8 h-96 z" fill="#e53950"/><path d="M4,362 h70 q14,0 14,16 v8 h-96 z" fill="#e53950"/><path d="M-78,384 h96 M4,384 h96" stroke="#fff" stroke-width="5"/>
      <path d="M-92,176 L92,176 L100,276 L6,276 L0,232 L-6,276 L-100,276 Z" fill="${DENIM}" stroke="#23458f" stroke-width="4"/><path d="M-60,196 v30 M60,196 v30" stroke="#9fc0ff" stroke-width="3" stroke-dasharray="6 5"/>
      <path d="M-110,40 Q0,14 110,40 L118,200 Q0,218 -118,200 Z" fill="${TEE}" stroke="${TEE_D}" stroke-width="4"/>
      <path d="M-40,28 Q0,56 40,28" fill="none" stroke="${TEE_D}" stroke-width="7"/>
      <circle cx="0" cy="118" r="44" fill="#fff3c4" stroke="${TEE_D}" stroke-width="4"/><text x="0" y="138" text-anchor="middle" font-family="Arial Black,Arial" font-weight="900" font-size="58" fill="#e53950">T</text>
      ${armsSvg('T', o, false)}
    </g>`;
  }
  function head(who, o) {
    const mood = o.mood || (who === 'G' ? 'happy' : 'grumpy');
    const hair = who === 'T'
      ? `<path d="M-126,-30 Q-132,-150 0,-158 Q132,-150 126,-30 Q110,-70 0,-74 Q-110,-70 -126,-30Z" fill="#e53950" stroke="#a51d33" stroke-width="5"/><path d="M-60,-150 Q0,-170 60,-150" stroke="#ff6b7d" stroke-width="8" fill="none" stroke-linecap="round"/><circle cx="0" cy="-158" r="12" fill="#a51d33"/><path d="M118,-52 Q190,-40 196,-6 Q150,-4 108,-26Z" fill="#c42a40" stroke="#a51d33" stroke-width="5"/><path d="M-128,-30 q10,26 30,10 q8,22 26,6" fill="${HAIR}"/><path d="M-30,-74 l-8,-28 l22,18 l8,-30 l14,30" fill="${HAIR}"/>`
      : who === 'G'
      ? `<path d="M-128,-6 Q-140,-150 0,-160 Q140,-150 128,-6 Q120,-60 96,-74 Q84,-50 62,-72 Q48,-46 26,-70 Q8,-44 -14,-70 Q-34,-44 -52,-72 Q-72,-46 -90,-74 Q-118,-60 -128,-6Z" fill="${HAIR}"/>
         <path d="M-10,-158 q22,-34 46,-12" stroke="${HAIR}" stroke-width="13" fill="none" stroke-linecap="round"/><path d="M-60,-130 q30,-14 60,-6" stroke="#3a3446" stroke-width="6" fill="none" stroke-linecap="round" opacity=".6"/>`
      : `<path d="M-124,-24 Q-140,-150 0,-160 Q138,-152 126,-28 L110,-60 L96,-30 L84,-84 L60,-56 L44,-100 L18,-70 L0,-110 L-22,-70 L-46,-104 L-62,-56 L-86,-88 L-96,-34 L-110,-64Z" fill="${HAIR}"/>
         <path d="M-30,-156 l-14,-34 l30,22 l6,-36 l18,34" fill="${HAIR}"/>`;
    return `<g>
      <ellipse cx="-128" cy="10" rx="24" ry="30" fill="${SKIN}" stroke="${SKIN_D}" stroke-width="3"/><ellipse cx="128" cy="10" rx="24" ry="30" fill="${SKIN}" stroke="${SKIN_D}" stroke-width="3"/>
      <ellipse cx="0" cy="0" rx="130" ry="134" fill="${SKIN}" stroke="${SKIN_D}" stroke-width="4"/>
      ${hair}
      ${who === 'T' ? `<g fill="#b5683f" opacity=".7"><circle cx="-84" cy="40" r="4"/><circle cx="-70" cy="50" r="4"/><circle cx="-92" cy="54" r="4"/><circle cx="84" cy="40" r="4"/><circle cx="70" cy="50" r="4"/><circle cx="92" cy="54" r="4"/></g>` : who === 'G' ? `<circle cx="-78" cy="44" r="22" fill="#ff8f8f" opacity=".45"/><circle cx="78" cy="44" r="22" fill="#ff8f8f" opacity=".45"/>` : `<rect x="54" y="44" width="40" height="16" rx="6" fill="#f4d7b3" stroke="#c9a37a" stroke-width="2" transform="rotate(-20 74 52)"/><path d="M66,48 l14,4 M66,54 l14,4" stroke="#c9a37a" stroke-width="2" transform="rotate(-20 74 52)"/>`}
      ${brows(0, -10, mood, who)}${eyes(0, 0, mood, o.blink, who, o.dir || 0)}
      <path d="M-4,26 q8,14 0,22" stroke="${SKIN_D}" stroke-width="5" fill="none" stroke-linecap="round"/>
      ${mouth(0, 68, mood, o.m || 0, who)}
      ${mood === 'angry' || (who === 'B' && mood === 'grumpy' && (o.t || 0) % 3 < 0.8) ? '' : ''}
    </g>`;
  }
  function draw(who, o = {}) {   // origin = feet center; total height ≈ 760
    const t = o.t || 0, talk = (o.m || 0) > 0.1, bob = Math.sin(t * (talk ? 9 : 2.2)) * (talk ? 5 : 3);
    const tilt = who === 'G' ? Math.sin(t * 1.6) * 3 + (talk ? Math.sin(t * 7) * 2 : 0) : Math.sin(t * 1.1) * 2 + (o.mood === 'smug' ? 6 : 0);
    const dir = o.dir || (who === 'G' ? 1 : -1), pose = o.pose || '';
    let lean = 0, jump = 0, htilt = 0;
    if (pose === 'shock') { lean = -9 * dir; jump = -14; htilt = -6 * dir; }
    else if (pose === 'laugh') { lean = Math.sin(t * 24) * 3; jump = -Math.abs(Math.sin(t * 12)) * 16; htilt = Math.sin(t * 12) * 6; }
    else if (pose === 'point') { lean = 5 * dir; htilt = 4 * dir; }
    else if (pose === 'shrug') { htilt = 8 * dir; }
    else if (pose === 'talk') { htilt = Math.sin(t * 5.5) * 4 + 3 * dir; }
    return `<g transform="translate(0,${jump}) rotate(${lean})"><g transform="translate(0,-384)">${who === 'T' ? bodyT(o) : body(who, o)}<g transform="translate(0,${-120 + bob}) rotate(${tilt + htilt})">${head(who, o)}</g></g></g>`;
  }
  root.TOON = { draw };
})(typeof window !== 'undefined' ? window : module.exports);
