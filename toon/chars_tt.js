// Tiklu Tashan cast (client channel, original art — deliberately NOT Golu/Bunty): TIKLU ('G') = show-off teen, backward green cap,
// red-white striped tee, denim shorts, yellow sneakers; JUGNU ('B') = deadpan topper friend, curly hair, round glasses, open yellow shirt over teal tee.
// o: { m: mouth 0..1, blink: bool, mood: 'happy'|'smile'|'shock'|'grumpy'|'smug'|'angry'|'laugh'|'disgust', wave: 0..1, t: seconds }
(function (root) {
  const SKIN = '#dca074', SKIN_D = '#b97f52', HAIR = '#24170f', SHIRT = '#e0473f', SHIRT_D = '#f2c230', SHORTS = '#3b6fb6', TIE = '#9b1c31', TIE_S = '#f2c94c';
  const SLV = (who) => who === 'G' ? '#e0473f' : '#f2c230';
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
    return `<g transform="translate(${sx},60) rotate(${a})"><rect x="-22" y="0" width="44" height="64" rx="18" fill="${sleeve}" stroke="rgba(0,0,0,.18)" stroke-width="3"/><rect x="-16" y="56" width="32" height="70" rx="16" fill="${SKIN}"/><circle cx="0" cy="124" r="20" fill="${SKIN}" stroke="${SKIN_D}" stroke-width="3"/>${h}</g>`;
  }
  function armsSvg(who, o, crossed) {
    const t = o.t || 0, neat = who === 'G', dir = o.dir || (neat ? 1 : -1), pose = o.pose || (o.wave ? 'wave' : 'idle');
    if (crossed) return `<path d="M-108,70 Q-130,150 -40,150 L60,138" stroke="${SLV(who)}" stroke-width="44" fill="none" stroke-linecap="round"/><path d="M108,70 Q130,150 40,160 L-56,150" stroke="${SLV(who)}" stroke-width="44" fill="none" stroke-linecap="round"/><circle cx="66" cy="136" r="22" fill="${SKIN}"/><circle cx="-62" cy="150" r="22" fill="${SKIN}"/>`;
    let L = neat ? 14 : 18, R = neat ? -14 : -18, hl = 'fist', hr = 'fist';
    const sw = Math.sin(t * 1.7) * 3;
    if (pose === 'idle') { L += sw; R -= sw; }
    else if (pose === 'talk') { const g = Math.abs(Math.sin(t * 4.2)), g2 = Math.abs(Math.sin(t * 3.1 + 1)); if (dir > 0) { R = -40 - 55 * g; L = 18 + 10 * g2; hr = 'open'; } else { L = 40 + 55 * g; R = -18 - 10 * g2; hl = 'open'; } }
    else if (pose === 'point') { const j = Math.sin(t * 14) * 6; if (dir > 0) { R = -100 + j; hr = 'point'; } else { L = 100 + j; hl = 'point'; } }
    else if (pose === 'laugh') { L = -38 + Math.sin(t * 22) * 5; R = 38 - Math.sin(t * 22) * 5; }
    else if (pose === 'shock') { const j = Math.sin(t * 30) * 4; L = 140 + j; R = -140 - j; hl = hr = 'open'; }
    else if (pose === 'shrug') { L = 62; R = -62; hl = hr = 'open'; }
    else if (pose === 'wave') { if (neat || dir > 0) R = -150 + Math.sin(t * 10) * 16; else L = 150 + Math.sin(t * 10) * 16; hr = hl = 'open'; }
    return arm(-112, L, SLV(who), hl) + arm(112, R, SLV(who), hr);
  }
  function body(who, o) {
    const wav = o.wave || 0, t = o.t || 0;
    const neat = who === 'G';
    const armR = neat ? (wav ? -150 + Math.sin(t * 10) * 16 : 14) : 0;
    const crossed = o.pose ? o.pose === 'cross' : (!neat && ['grumpy', 'smug', 'angry'].includes(o.mood) && !o.wave);
    const tl = who === 'G';
    return `
    <g>
      <defs><pattern id="tts" width="60" height="44" patternUnits="userSpaceOnUse"><rect width="60" height="24" fill="#e0473f"/><rect y="24" width="60" height="20" fill="#fff4ec"/></pattern></defs>
      <!-- legs + socks + sneakers -->
      <rect x="-60" y="250" width="40" height="122" rx="16" fill="${SKIN}"/><rect x="20" y="250" width="40" height="122" rx="16" fill="${SKIN}"/>
      <rect x="-62" y="322" width="44" height="30" rx="6" fill="#fff"/><rect x="18" y="322" width="44" height="30" rx="6" fill="#fff"/>
      ${tl ? '' : '<path d="M-62,330 h44 M18,330 h44" stroke="#e0473f" stroke-width="5"/>'}
      <path d="M-82,348 h70 q16,0 18,20 v14 h-96 q-4,-26 8,-34z" fill="${tl ? '#f5c542' : '#d8453b'}" stroke="#2a1d14" stroke-width="4"/><path d="M-86,378 h96" stroke="#fff" stroke-width="9" stroke-linecap="round"/>
      <path d="M6,348 h70 q16,0 18,20 v14 h-96 q-4,-26 8,-34z" fill="${tl ? '#f5c542' : '#d8453b'}" stroke="#2a1d14" stroke-width="4"/><path d="M2,378 h96" stroke="#fff" stroke-width="9" stroke-linecap="round"/>
      <path d="M-60,356 l14,-6 M-48,362 l14,-6 M28,356 l14,-6 M40,362 l14,-6" stroke="#2a1d14" stroke-width="3"/>
      <!-- shorts -->
      ${tl ? `<path d="M-94,176 L94,176 L104,286 L8,286 L0,240 L-8,286 L-104,286 Z" fill="${SHORTS}" stroke="#244a80" stroke-width="4"/><path d="M-104,276 h96 M8,276 h96" stroke="#9cc0ee" stroke-width="5" stroke-dasharray="10 7"/><path d="M-60,186 q16,26 0,44" stroke="#244a80" stroke-width="4" fill="none"/>`
           : `<path d="M-94,176 L94,176 L102,290 L8,290 L0,240 L-8,290 L-102,290 Z" fill="#8d7b56" stroke="#5f5236" stroke-width="4"/><rect x="-96" y="226" width="40" height="40" rx="6" fill="#7e6c49" stroke="#5f5236" stroke-width="3"/><rect x="56" y="226" width="40" height="40" rx="6" fill="#7e6c49" stroke="#5f5236" stroke-width="3"/>`}
      <!-- top -->
      ${tl ? `<path d="M-110,40 Q0,12 110,40 L116,196 Q0,214 -116,196 Z" fill="url(#tts)" stroke="#a8322c" stroke-width="4"/><path d="M-36,24 Q0,48 36,24" fill="none" stroke="#a8322c" stroke-width="6"/>`
           : `<path d="M-110,40 Q0,12 110,40 L116,200 Q0,216 -116,200 Z" fill="#1fa59a" stroke="#137067" stroke-width="4"/>
              <circle cx="4" cy="112" r="34" fill="#ffd84d" opacity=".9"/><path d="M-14,104 l10,10 l22,-24" stroke="#137067" stroke-width="7" fill="none" stroke-linecap="round"/>
              <path d="M-112,40 L-44,30 L-38,206 L-118,198 Z" fill="#f2c230" stroke="#b98d12" stroke-width="4"/><path d="M112,40 L44,30 L38,206 L118,198 Z" fill="#f2c230" stroke="#b98d12" stroke-width="4"/>
              <path d="M-44,30 L-24,64 L-46,70 Z M44,30 L24,64 L46,70 Z" fill="#e0ad1c"/><rect x="58" y="84" width="38" height="34" rx="4" fill="none" stroke="#b98d12" stroke-width="4"/>`}
      <!-- arms (pose) -->
      ${armsSvg(who, o, crossed)}
    </g>`;
  }
  function head(who, o) {
    const mood = o.mood || (who === 'G' ? 'happy' : 'grumpy');
    const hair = who === 'G'
      ? `<path d="M-124,-10 Q-136,-120 -40,-142 Q60,-160 122,-96 Q132,-60 124,-10 Q114,-46 96,-56 L84,-30 L70,-62 L50,-36 L36,-66 L14,-40 L-6,-68 L-26,-38 L-46,-66 L-66,-34 L-84,-62 L-104,-30Z" fill="${HAIR}"/>
         <path d="M-118,-70 Q-112,-170 0,-176 Q112,-170 118,-70 Q0,-96 -118,-70Z" fill="#2f9e44" stroke="#1f6e2f" stroke-width="5"/>
         <path d="M70,-150 Q150,-150 176,-104 Q130,-96 92,-110Z" fill="#237a33" stroke="#1f6e2f" stroke-width="5"/>
         <rect x="-54" y="-104" width="64" height="18" rx="9" fill="#f2c94c" stroke="#b98d12" stroke-width="3"/><circle cx="0" cy="-174" r="9" fill="#1f6e2f"/>`
      : `${Array.from({ length: 13 }, (_, i) => { const a = Math.PI * (1.05 + i * 0.075), r = 132; return `<circle cx="${Math.cos(a) * r}" cy="${Math.sin(a) * r * 0.95 - 8}" r="${30 + (i % 3) * 5}" fill="${HAIR}"/>`; }).join('')}
         <path d="M-120,-20 Q-130,-130 0,-150 Q130,-130 120,-20 Q100,-70 70,-80 Q40,-56 10,-84 Q-20,-58 -50,-82 Q-84,-60 -120,-20Z" fill="${HAIR}"/>
         <circle cx="-36" cy="-118" r="22" fill="${HAIR}"/><circle cx="30" cy="-124" r="24" fill="${HAIR}"/>`;
    return `<g>
      <ellipse cx="-128" cy="10" rx="24" ry="30" fill="${SKIN}" stroke="${SKIN_D}" stroke-width="3"/><ellipse cx="128" cy="10" rx="24" ry="30" fill="${SKIN}" stroke="${SKIN_D}" stroke-width="3"/>
      <ellipse cx="0" cy="4" rx="120" ry="138" fill="${SKIN}" stroke="${SKIN_D}" stroke-width="4"/>
      ${hair}
      ${who === 'G' ? `<g fill="#a8683f" opacity=".55"><circle cx="-80" cy="40" r="4"/><circle cx="-66" cy="48" r="4"/><circle cx="-90" cy="52" r="4"/><circle cx="80" cy="40" r="4"/><circle cx="66" cy="48" r="4"/><circle cx="90" cy="52" r="4"/></g>` : ''}
      ${brows(0, -10, mood, who)}${eyes(0, 0, mood, o.blink, who, o.dir || 0)}${who === 'B' ? `<g fill="rgba(200,235,255,.25)" stroke="#3b2a22" stroke-width="7"><circle cx="-32" cy="0" r="34"/><circle cx="32" cy="0" r="34"/></g><path d="M-2,-4 q2,-8 4,0 M-66,-6 L-112,-14 M66,-6 L112,-14" stroke="#3b2a22" stroke-width="7" fill="none"/>` : ''}
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
    return `<g transform="translate(0,${jump}) rotate(${lean})"><g transform="translate(0,-384)">${body(who, o)}<g transform="translate(0,${-120 + bob}) rotate(${tilt + htilt})">${head(who, o)}</g></g></g>`;
  }
  root.TOON = { draw };
})(typeof window !== 'undefined' ? window : module.exports);
