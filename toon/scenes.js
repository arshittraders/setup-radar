// Extra locations for Golu & Bunty (original art). Each: bg(t) behind the kids, fg(t) in front, moving → redraw every frame.
(function (root) {
  const R = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join('');
  const sky = (a, b) => `<defs><linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="1080" height="1920" fill="url(#sk)"/>`;
  const cloud = (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})" fill="#fff" opacity=".95"><ellipse cx="0" cy="0" rx="90" ry="40"/><ellipse cx="70" cy="-20" rx="70" ry="45"/><ellipse cx="140" cy="5" rx="80" ry="35"/></g>`;
  const tree = (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})"><rect x="-14" y="0" width="28" height="120" fill="#8a5a2e"/><circle cx="0" cy="-20" r="70" fill="#3fae5a"/><circle cx="-45" cy="10" r="50" fill="#37a050"/><circle cx="45" cy="10" r="50" fill="#45b862"/></g>`;
  const wrap = (v, w) => ((v % w) + w) % w;
  const S = {
    tapri: { moving: true,   // chai ki tapri at dusk: string lights, kettle steam, bench in front
      bg: (t) => sky('#ff9e6b', '#ffd9a8') + cloud(160, 300, 0.7) + cloud(760, 220, 0.9) +
        `<rect x="0" y="760" width="1080" height="560" fill="#c9b8a6"/>${R(6, (i) => `<rect x="${i * 190 - 20}" y="${640 + (i % 2) * 50}" width="170" height="${680 - (i % 2) * 50}" fill="${['#b48a78', '#9c7a6a', '#c49a86'][i % 3]}"/><rect x="${i * 190 + 20}" y="${700 + (i % 2) * 50}" width="40" height="56" fill="#ffe8a3" opacity=".8"/><rect x="${i * 190 + 90}" y="${700 + (i % 2) * 50}" width="40" height="56" fill="#ffe8a3" opacity=".6"/>`)}
         <g transform="translate(540,430) rotate(${Math.sin(t * 1.5) * 1.5})"><path d="M-160,-120 L-160,-60 M160,-120 L160,-60" stroke="#3b2a22" stroke-width="6"/><rect x="-250" y="-60" width="500" height="130" rx="22" fill="#d84315" stroke="#fff3e0" stroke-width="8"/><text x="0" y="30" text-anchor="middle" font-family="Baloo 2" font-weight="800" font-size="82" fill="#fff8e1">☕ चाय टपरी</text></g><path d="M40,560 Q540,660 1040,560" stroke="#3b2a22" stroke-width="4" fill="none"/>${R(11, (i) => { const x = 60 + i * 96, y = 560 + 100 * Math.sin(Math.PI * (x - 40) / 1000) * 1.0; return `<circle cx="${x}" cy="${y + 14}" r="11" fill="${['#ffd54f', '#ff8a65', '#81d4fa', '#aed581'][i % 4]}" opacity="${0.65 + 0.35 * Math.sin(t * 6 + i)}"/>`; })}
         <g transform="translate(150,700)"><rect x="0" y="0" width="780" height="520" rx="10" fill="#2e7d6b"/><rect x="-30" y="-40" width="840" height="70" rx="12" fill="#d84315"/>${R(8, (i) => `<rect x="${-30 + i * 105}" y="-40" width="52" height="70" fill="#ffca28"/>`)}
           
           <rect x="40" y="170" width="700" height="24" rx="8" fill="#8d6e63"/>${R(6, (i) => `<rect x="${80 + i * 110}" y="128" width="34" height="44" rx="6" fill="#fff" opacity=".85"/><rect x="${84 + i * 110}" y="140" width="26" height="28" rx="4" fill="#c77d3a"/>`)}
           <g transform="translate(590,220)"><rect x="-70" y="40" width="140" height="30" fill="#555"/><ellipse cx="0" cy="40" rx="80" ry="18" fill="#777"/><path d="M-60,40 Q-60,-40 0,-40 Q60,-40 60,40Z" fill="#b0bec5" stroke="#78909c" stroke-width="6"/><path d="M60,0 q50,-10 60,-50" stroke="#90a4ae" stroke-width="14" fill="none" stroke-linecap="round"/>
             ${R(4, (i) => { const k = ((t * 0.6 + i * 0.25) % 1); return `<circle cx="${110 + Math.sin(t * 3 + i) * 12}" cy="${-60 - k * 220}" r="${16 + k * 34}" fill="#fff" opacity="${0.55 * (1 - k)}"/>`; })}</g>
           <rect x="60" y="300" width="260" height="190" rx="10" fill="#26695a"/><text x="190" y="380" text-anchor="middle" font-family="Baloo 2" font-weight="800" font-size="40" fill="#ffe082">कटिंग ₹10</text><text x="190" y="440" text-anchor="middle" font-family="Baloo 2" font-weight="800" font-size="40" fill="#ffe082">बन मस्का ₹20</text></g>
         <rect y="1290" width="1080" height="630" fill="#8d7b68"/>${R(9, (i) => `<rect x="${i * 130}" y="1290" width="126" height="630" fill="${i % 2 ? '#857260' : '#917e6a'}"/>`)}`,
      fg: () => '' },
    mountain: { moving: false,
      bg: () => sky('#8fd3ff', '#e8f7ff') + cloud(120, 260) + cloud(720, 200, 0.8) +
        `<path d="M-50,1200 L260,560 L420,820 L620,420 L900,900 L1130,620 L1130,1300 L-50,1300Z" fill="#7b8fb8"/>
         <path d="M260,560 L330,700 L290,690 L250,740 L200,680Z M620,420 L700,580 L650,560 L600,620 L560,560Z M1130,620 L1130,700 L1080,690Z" fill="#fff"/>
         <path d="M-50,1300 Q300,1080 600,1220 Q850,1320 1130,1150 L1130,1920 L-50,1920Z" fill="#6cc46f"/>
         <rect y="1420" width="1080" height="500" fill="#5bb35e"/>${tree(80, 1250, 0.9)}${tree(1000, 1230, 1)}${R(14, (i) => `<circle cx="${(i * 83) % 1080}" cy="${1500 + (i * 47) % 300}" r="6" fill="${['#ffd84a', '#ff7aa8', '#fff'][i % 3]}"/>`)}`,
      fg: () => '' },
    train: { moving: true,
      bg: (t) => `<rect width="1080" height="1920" fill="#d6c6a8"/>` +
        R(2, (k) => { const x = 90 + k * 520; return `<g><rect x="${x}" y="360" width="380" height="380" rx="40" fill="#9fd8ff"/><clipPath id="w${k}"><rect x="${x}" y="360" width="380" height="380" rx="40"/></clipPath>
          <g clip-path="url(#w${k})">${R(6, (i) => { const px = x + wrap(i * 260 - t * 420, 1560) - 300; return `<circle cx="${px}" cy="${640}" r="110" fill="#5cb85c"/><rect x="${px - 6}" y="${640}" width="12" height="100" fill="#7a4a22"/>`; })}
          ${R(10, (i) => `<rect x="${x + wrap(i * 70 - t * 1400, 520) - 70}" y="690" width="40" height="8" fill="#8a6a4a"/>`)}</g>
          <rect x="${x}" y="360" width="380" height="380" rx="40" fill="none" stroke="#8a6a4a" stroke-width="22"/><rect x="${x}" y="540" width="380" height="14" fill="#8a6a4a"/></g>`; }) +
        `<rect y="1240" width="1080" height="680" fill="#7c6a58"/><rect y="1240" width="1080" height="14" fill="#5d4c3c"/><rect x="0" y="300" width="1080" height="24" fill="#3d63c9"/>`,
      fg: (t) => `<g transform="translate(0,${Math.sin(t * 22) * 2})"><rect x="-20" y="1330" width="420" height="300" rx="30" fill="#3d63c9"/><rect x="680" y="1330" width="420" height="300" rx="30" fill="#3d63c9"/><rect x="-20" y="1330" width="420" height="40" rx="20" fill="#5b82e6"/><rect x="680" y="1330" width="420" height="40" rx="20" fill="#5b82e6"/></g>` },
    bus: { moving: true,
      bg: (t) => `<rect width="1080" height="1920" fill="#ffe08a"/><rect x="40" y="330" width="1000" height="420" rx="36" fill="#bfe8ff"/>
        <clipPath id="bw"><rect x="40" y="330" width="1000" height="420" rx="36"/></clipPath><g clip-path="url(#bw)">${R(5, (i) => { const px = wrap(i * 300 - t * 380, 1500) - 200; return `<rect x="${px}" y="${470 - (i % 3) * 40}" width="200" height="${300 + (i % 3) * 40}" fill="${['#f48fb1', '#90caf9', '#ffcc80', '#a5d6a7', '#ce93d8'][i]}"/>${R(3, (j) => `<rect x="${px + 30 + j * 55}" y="${520 - (i % 3) * 40}" width="35" height="40" fill="#fff8"/>`)}`; })}
        <rect x="0" y="700" width="1080" height="60" fill="#666"/></g><rect x="40" y="330" width="1000" height="420" rx="36" fill="none" stroke="#e0a400" stroke-width="22"/>
        ${R(4, (i) => `<rect x="${130 + i * 260}" y="320" width="16" height="440" fill="#e0a400"/>`)}<rect x="0" y="230" width="1080" height="16" fill="#999"/>${R(6, (i) => `<rect x="${60 + i * 180}" y="246" width="10" height="60" fill="#999"/><circle cx="${65 + i * 180}" cy="320" r="18" fill="none" stroke="#999" stroke-width="7"/>`)}
        <rect y="1250" width="1080" height="670" fill="#8d8d8d"/>`,
      fg: (t) => `<g transform="translate(0,${Math.abs(Math.sin(t * 6)) * 4})"><rect x="-30" y="1320" width="380" height="320" rx="30" fill="#c62828"/><rect x="730" y="1320" width="380" height="320" rx="30" fill="#c62828"/><rect x="-30" y="1320" width="380" height="46" rx="20" fill="#e57373"/><rect x="730" y="1320" width="380" height="46" rx="20" fill="#e57373"/></g>` },
    cycle: { moving: true,
      bg: (t) => sky('#7fd0ff', '#dff4ff') + R(3, (i) => cloud(wrap(i * 420 - t * 40, 1400) - 200, 220 + i * 70, 0.8)) +
        `<path d="M-50,1000 Q300,880 600,980 Q860,1060 1130,940 L1130,1300 L-50,1300Z" fill="#8bd17c"/>` + R(5, (i) => tree(wrap(i * 300 - t * 160, 1500) - 200, 1010, 0.8)) +
        `<rect y="1300" width="1080" height="620" fill="#555"/>${R(8, (i) => `<rect x="${wrap(i * 180 - t * 700, 1440) - 180}" y="1600" width="100" height="18" fill="#fff"/>`)}<rect y="1290" width="1080" height="14" fill="#ddd"/>`,
      fg: (t) => R(2, (k) => { const x = k ? 790 : 290, a = t * 600; const wheel = (cx) => `<g transform="translate(${cx},1520)"><circle r="96" fill="none" stroke="#1d1a24" stroke-width="16"/><g transform="rotate(${a})">${R(6, (j) => `<line x1="0" y1="0" x2="0" y2="-88" stroke="#888" stroke-width="5" transform="rotate(${j * 60})"/>`)}</g><circle r="12" fill="#1d1a24"/></g>`;
        return `<g>${wheel(x - 150)}${wheel(x + 150)}<path d="M${x - 150},1520 L${x - 30},1400 L${x + 110},1400 L${x + 150},1520 M${x - 30},1400 L${x + 10},1520 L${x + 110},1400 M${x + 110},1400 L${x + 90},1300 L${x + 150},1290" stroke="${k ? '#e53935' : '#1e88e5'}" stroke-width="20" fill="none" stroke-linecap="round" stroke-linejoin="round"/><rect x="${x - 80}" y="1380" width="90" height="24" rx="12" fill="#1d1a24"/></g>`; }) +
        R(6, (i) => `<rect x="${wrap(i * 230 - t * 900, 1300) - 100}" y="${1250 + (i % 3) * 40}" width="70" height="6" rx="3" fill="#fff" opacity=".7"/>`) },
    pool: { moving: true,
      bg: () => sky('#9fe0ff', '#e6f8ff') + cloud(150, 230) + cloud(760, 300, 0.7) + `<rect y="700" width="1080" height="160" fill="#f6e2c2"/>${R(6, (i) => `<rect x="${i * 190 + 20}" y="560" width="14" height="150" fill="#e0e0e0"/><path d="M${i * 190 - 50},560 Q${i * 190 + 27},480 ${i * 190 + 104},560Z" fill="${['#ff7043', '#ffca28', '#26c6da'][i % 3]}"/>`)}
        <rect y="860" width="1080" height="1060" fill="#29b6f6"/><rect y="860" width="1080" height="24" fill="#e1f5fe"/>`,
      fg: (t) => `<rect y="1180" width="1080" height="740" fill="#29b6f6" opacity=".82"/>${R(12, (i) => `<path d="M${wrap(i * 120 + Math.sin(t * 2 + i) * 30, 1200) - 60},${1200 + (i % 4) * 160} q30,-14 60,0 t60,0" stroke="#e1f5fe" stroke-width="6" fill="none" opacity=".8"/>`)}
        <ellipse cx="290" cy="1185" rx="170" ry="26" fill="#e1f5fe" opacity=".7"/><ellipse cx="790" cy="1185" rx="170" ry="26" fill="#e1f5fe" opacity=".7"/>
        <g transform="translate(${900 + Math.sin(t) * 20},1240)"><circle r="60" fill="#ff5252"/><circle r="30" fill="#29b6f6"/></g>` },
    park: { moving: false,
      bg: () => sky('#86d6ff', '#e9f9ff') + cloud(200, 250) + cloud(780, 210, 0.8) + `<rect y="1050" width="1080" height="870" fill="#7ccf6a"/>${tree(120, 920, 1.2)}${tree(960, 900, 1.1)}
        <g transform="translate(540,1080)"><rect x="-220" y="0" width="440" height="30" rx="10" fill="#8a5a2e"/><rect x="-200" y="30" width="20" height="90" fill="#6d4522"/><rect x="180" y="30" width="20" height="90" fill="#6d4522"/></g>
        ${R(20, (i) => `<circle cx="${(i * 97) % 1080}" cy="${1300 + (i * 61) % 500}" r="7" fill="${['#ffd84a', '#ff7aa8', '#fff'][i % 3]}"/>`)}`, fg: () => '' },
    cricket: { moving: false,
      bg: () => sky('#7fd0ff', '#e6f7ff') + `<rect y="900" width="1080" height="1020" fill="#6cc04a"/>${R(9, (i) => `<rect x="${i * 120}" y="900" width="60" height="1020" fill="#62b442"/>`)}
        <rect x="380" y="1000" width="320" height="700" fill="#e8d6a0"/><g transform="translate(540,1010)">${R(3, (i) => `<rect x="${-40 + i * 34}" y="0" width="12" height="130" fill="#fff4d6" stroke="#b08a50" stroke-width="3"/>`)}<rect x="-44" y="-6" width="96" height="10" fill="#b08a50"/></g>
        <path d="M0,880 Q540,800 1080,880 L1080,910 L0,910Z" fill="#fff"/>${R(40, (i) => `<circle cx="${i * 28}" cy="${860 - Math.sin(i) * 10}" r="12" fill="${['#ef5350', '#42a5f5', '#ffee58', '#66bb6a'][i % 4]}"/>`)}`, fg: () => '' },
    market: { moving: false,
      bg: () => `<rect width="1080" height="1920" fill="#fff3e0"/>${R(3, (i) => `<g transform="translate(${i * 370 - 20},420)"><rect width="340" height="520" fill="${['#ffcc80', '#b3e5fc', '#f8bbd0'][i]}"/><path d="M0,0 h340 v80 q-28,30 -56,0 q-28,30 -56,0 q-28,30 -57,0 q-28,30 -57,0 q-28,30 -57,0 q-28,30 -57,0Z" fill="${['#e53935', '#43a047', '#1e88e5'][i]}"/>
        ${R(6, (j) => `<circle cx="${50 + (j % 3) * 120}" cy="${300 + Math.floor(j / 3) * 110}" r="40" fill="${['#ff7043', '#fdd835', '#7cb342', '#ab47bc', '#ef5350', '#ffa726'][j]}"/>`)}</g>`)}<rect y="940" width="1080" height="980" fill="#d7ccc8"/>${R(10, (i) => `<rect x="${i * 110}" y="${1100 + (i % 2) * 300}" width="90" height="12" fill="#bcaaa4"/>`)}`, fg: () => '' },
    party: { moving: true,
      bg: (t) => `<rect width="1080" height="1920" fill="#fde4ff"/>${R(9, (i) => `<path d="M${i * 130},220 l65,110 l65,-110" fill="${['#ff4081', '#7c4dff', '#ffd740'][i % 3]}"/>`)}<path d="M0,220 Q540,300 1080,220" stroke="#333" stroke-width="5" fill="none"/>
        ${R(5, (i) => `<g transform="translate(${100 + i * 220},${520 + Math.sin(t * 2 + i) * 20})"><ellipse rx="60" ry="76" fill="${['#ff5252', '#40c4ff', '#ffd740', '#69f0ae', '#e040fb'][i]}"/><path d="M0,76 q10,60 -10,120" stroke="#555" stroke-width="3" fill="none"/></g>`)}
        <rect y="1150" width="1080" height="770" fill="#ffccbc"/><g transform="translate(540,1060)"><rect x="-150" y="0" width="300" height="140" rx="20" fill="#8d6e63"/><rect x="-150" y="0" width="300" height="40" rx="20" fill="#fff"/>${R(5, (i) => `<rect x="${-110 + i * 50}" y="-60" width="12" height="60" fill="${['#ff4081', '#40c4ff', '#ffd740'][i % 3]}"/><ellipse cx="${-104 + i * 50}" cy="-70" rx="8" ry="14" fill="#ffab00" opacity="${0.7 + 0.3 * Math.sin(t * 12 + i)}"/>`)}</g>`, fg: () => '' },
  };
  root.SCENES = S;
})(typeof window !== 'undefined' ? window : module.exports);
