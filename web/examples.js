/* ================= 示例广告素材（SVG 合成图，模拟多来源拼合） ================= */
const svgURL = s => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
const FONT = 'PingFang SC, Microsoft YaHei, Helvetica, Arial, sans-serif';
const wrap = (inner, defs = '') => `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800"><defs>${defs}</defs>${inner}</svg>`;
const star = (cx, cy, r, f) => `<path d="M${cx} ${cy - r} L${cx + r * .25} ${cy - r * .25} L${cx + r} ${cy} L${cx + r * .25} ${cy + r * .25} L${cx} ${cy + r} L${cx - r * .25} ${cy + r * .25} L${cx - r} ${cy} L${cx - r * .25} ${cy - r * .25}Z" fill="${f}"/>`;

function adFizzo() {
  const bubbles = [[660,450,14],[700,500,9],[650,540,18],[705,580,11],[668,615,8],[692,440,7]].map(([x,y,r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="#fff" stroke-width="3"/>`).join('');
  return wrap(`<rect width="800" height="800" fill="url(#g1)"/>
  <circle cx="640" cy="190" r="70" fill="#ffd25e"/>
  <rect y="430" width="800" height="140" fill="#2d8fc6"/>
  <path d="M0 455 Q100 440 200 455 T400 455 T600 455 T800 455" stroke="#bfe6ff" stroke-width="4" fill="none"/>
  <path d="M0 505 Q100 490 200 505 T400 505 T600 505 T800 505" stroke="#bfe6ff" stroke-width="3" fill="none" opacity=".7"/>
  <rect y="560" width="800" height="240" fill="#f2d49b"/>
  <path d="M745 600 Q718 450 748 340" stroke="#7a5230" stroke-width="14" fill="none"/>
  <path d="M748 340 q-60 -10 -100 30 M748 340 q50 -30 70 10 M748 340 q-20 -50 -60 -60 M748 340 q40 -50 60 -40" stroke="#2f8f4e" stroke-width="12" fill="none" stroke-linecap="round"/>
  <text x="400" y="545" font-size="66" font-family="Arial, sans-serif" font-weight="700" fill="#fff" opacity=".5" text-anchor="middle" transform="rotate(-10 400 525)">gettyimages</text>
  <text x="400" y="235" font-size="42" font-weight="800" fill="#0b3954" text-anchor="middle" font-family="${FONT}">夏日冰爽 · 一口回到海边</text>
  <circle cx="90" cy="90" r="52" fill="#fff"/><text x="90" y="104" font-size="40" font-weight="900" fill="#ff6f61" text-anchor="middle" font-family="Arial">FZ</text>
  <rect x="132" y="400" width="30" height="150" rx="15" fill="#8d5b42" transform="rotate(12 147 400)"/>
  <rect x="268" y="400" width="30" height="150" rx="15" fill="#8d5b42" transform="rotate(-12 283 400)"/>
  <rect x="172" y="590" width="36" height="170" rx="16" fill="#8d5b42"/><rect x="222" y="590" width="36" height="170" rx="16" fill="#8d5b42"/>
  <rect x="157" y="375" width="116" height="235" rx="40" fill="#ff6f61"/>
  <circle cx="215" cy="330" r="46" fill="#8d5b42"/>
  <path d="M168 325 Q215 255 262 325 L262 305 Q215 262 168 305Z" fill="#3a2417"/>
  <rect x="520" y="395" width="50" height="65" rx="10" fill="#38bfa0"/><rect x="515" y="375" width="60" height="28" rx="6" fill="#ff6f61"/>
  <rect x="485" y="450" width="120" height="300" rx="34" fill="#38bfa0"/>
  <rect x="495" y="540" width="100" height="110" rx="10" fill="#fff"/><text x="545" y="605" font-size="28" font-weight="900" fill="#ff6f61" text-anchor="middle" font-family="Arial">FIZZO</text>
  ${bubbles}
  <rect x="325" y="715" width="135" height="52" rx="26" fill="#ff6f61"/><text x="392" y="749" font-size="22" fill="#fff" text-anchor="middle" font-weight="700" font-family="${FONT}">立即购买</text>`,
  `<linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6ec6f5"/><stop offset="1" stop-color="#ffe3b3"/></linearGradient>`);
}

function adArcana() {
  const bs = [[0,520,90],[85,460,70],[150,560,80],[225,430,60],[280,500,90],[365,380,70],[430,470,85],[510,410,60],[565,540,80],[640,450,75],[710,500,90]];
  let city = '';
  bs.forEach(([x,y,w]) => {
    city += `<rect x="${x}" y="${y}" width="${w}" height="${800-y}" fill="#161a36"/>`;
    for (let wy = y + 14; wy < 790; wy += 26) for (let wx = x + 9; wx < x + w - 10; wx += 17)
      if ((wx * 7 + wy * 13) % 5 === 0) city += `<rect x="${wx}" y="${wy}" width="6" height="10" fill="#ffd36b" opacity=".85"/>`;
  });
  const stars = [[80,90],[180,160],[520,70],[720,230],[300,200],[460,180],[60,300]].map(([x,y]) => `<circle cx="${x}" cy="${y}" r="2" fill="#fff"/>`).join('');
  return wrap(`<rect width="800" height="800" fill="url(#g2)"/>${stars}
  <circle cx="660" cy="150" r="55" fill="#f4f1c9"/><circle cx="640" cy="140" r="50" fill="#1d1856" opacity=".25"/>
  ${city}
  <path d="M410 300 L300 720 L520 720 Z" fill="#5b2a86"/>
  <rect x="378" y="550" width="28" height="170" fill="#2b2d5c"/><rect x="414" y="550" width="28" height="170" fill="#2b2d5c"/>
  <rect x="370" y="330" width="80" height="230" rx="30" fill="#2b2d5c"/>
  <line x1="455" y1="430" x2="562" y2="242" stroke="#7df9ff" stroke-width="18" stroke-linecap="round" opacity=".3"/>
  <line x1="455" y1="430" x2="562" y2="242" stroke="#7df9ff" stroke-width="8" stroke-linecap="round"/>
  <circle cx="410" cy="290" r="42" fill="#e9c7a5"/>
  <path d="M366 290 Q410 215 454 290 L454 268 Q410 228 366 268Z" fill="#c0c7ff"/>
  ${star(640,360,26,'#fff6b0')}${star(700,410,16,'#fff6b0')}${star(618,438,13,'#fff6b0')}
  <rect x="220" y="40" width="360" height="86" rx="12" fill="#0c1445" fill-opacity=".6" stroke="#f5c451" stroke-width="4"/>
  <text x="400" y="104" font-size="54" font-weight="900" fill="#f5c451" text-anchor="middle" letter-spacing="8" font-family="Georgia, serif">ARCANA</text>
  <text x="400" y="772" font-size="32" font-weight="800" fill="#fff" text-anchor="middle" font-family="${FONT}">立即下载 · 开启传说</text>`,
  `<linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0c1445"/><stop offset="1" stop-color="#43206e"/></linearGradient>`);
}

function adSonique() {
  return wrap(`<rect width="800" height="800" fill="url(#g3)"/>
  <polygon points="0,560 160,300 300,520 430,260 600,540 720,330 800,420 800,800 0,800" fill="#5d7a99"/>
  <polygon points="160,300 195,362 176,352 152,372 128,352" fill="#fff"/>
  <polygon points="430,260 472,334 446,322 420,346 392,322" fill="#fff"/>
  <polygon points="720,330 752,384 732,374 706,392 690,380" fill="#fff"/>
  <polygon points="0,640 200,560 420,630 640,570 800,620 800,800 0,800" fill="#3e5a76"/>
  <rect y="705" width="800" height="95" fill="#87b5d9" opacity=".75"/>
  <circle cx="610" cy="240" r="62" fill="url(#fl)"/>
  <text x="400" y="120" font-size="46" font-weight="800" fill="#12324f" text-anchor="middle" font-family="${FONT}">听见山的声音</text>
  <path d="M282 505 Q282 340 400 340 Q518 340 518 505" stroke="#222" stroke-width="26" fill="none" stroke-linecap="round"/>
  <rect x="252" y="470" width="66" height="120" rx="28" fill="#e63946"/><rect x="482" y="470" width="66" height="120" rx="28" fill="#e63946"/>
  <rect x="300" y="488" width="22" height="84" rx="10" fill="#222"/><rect x="478" y="488" width="22" height="84" rx="10" fill="#222"/>
  <text x="50" y="752" font-size="40" font-weight="900" fill="#fff" letter-spacing="4" font-family="Arial">SONIQUE</text>`,
  `<linearGradient id="g3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a8d8ff"/><stop offset="1" stop-color="#eaf6ff"/></linearGradient>
   <radialGradient id="fl"><stop offset="0" stop-color="#fff" stop-opacity="1"/><stop offset=".4" stop-color="#fff6c8" stop-opacity=".7"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>`);
}

function adLumi() {
  const petals = [[110,110,-20],[170,150,30],[128,195,70],[190,95,-60]].map(([x,y,r]) => `<ellipse cx="${x}" cy="${y}" rx="26" ry="13" fill="#ffb3c6" transform="rotate(${r} ${x} ${y})"/>`).join('');
  return wrap(`<rect width="800" height="800" fill="url(#g4)"/>${petals}
  <ellipse cx="300" cy="380" rx="170" ry="212" fill="#3a2520"/>
  <path d="M120 800 Q140 600 300 590 Q460 600 480 800Z" fill="#f6d2bd"/>
  <path d="M155 800 Q175 685 300 675 Q425 685 445 800Z" fill="#fff"/>
  <rect x="265" y="520" width="70" height="80" fill="#f6d2bd"/>
  <ellipse cx="300" cy="400" rx="115" ry="145" fill="#f6d2bd"/>
  <ellipse cx="258" cy="390" rx="14" ry="8" fill="#3a2520"/><ellipse cx="342" cy="390" rx="14" ry="8" fill="#3a2520"/>
  <path d="M275 470 Q300 488 325 470 Q300 478 275 470Z" fill="#d6455d"/>
  <path d="M185 330 Q300 200 415 330 Q380 250 300 245 Q220 250 185 330Z" fill="#3a2520"/>
  <text x="745" y="92" text-anchor="end" font-size="44" font-family="Georgia, serif" font-style="italic" fill="#c2185b">Lumi Beauty</text>
  <text x="635" y="300" font-size="38" font-weight="800" fill="#7a1f3d" text-anchor="middle" font-family="${FONT}">28 天 透亮焕新</text>
  <rect x="550" y="480" width="170" height="50" rx="12" fill="#f3a5b8"/>
  <rect x="560" y="520" width="150" height="120" rx="20" fill="#fff" stroke="#f3a5b8" stroke-width="4"/>
  <text x="635" y="592" font-size="30" font-weight="800" fill="#c2185b" text-anchor="middle" font-family="Georgia, serif">LUMI</text>`,
  `<linearGradient id="g4" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe1e8"/><stop offset="1" stop-color="#fff5f0"/></linearGradient>`);
}

function adStride() {
  let dash = ''; for (let i = 0; i < 6; i++) { const y = 440 + i * 62, w = 4 + i * 3; dash += `<rect x="${400 - w / 2}" y="${y}" width="${w}" height="${20 + i * 8}" fill="#ffd27a"/>`; }
  return wrap(`<rect width="800" height="800" fill="url(#g5)"/>
  <circle cx="400" cy="420" r="95" fill="#ffd27a"/>
  <polygon points="0,420 800,420 800,800 0,800" fill="#c97b4a"/>
  <polygon points="0,520 180,470 330,520 0,600" fill="#b0653a"/><polygon points="800,500 620,465 480,520 800,590" fill="#b0653a"/>
  <polygon points="372,420 428,420 700,800 100,800" fill="#3b3b3b"/>${dash}
  <circle cx="150" cy="180" r="92" fill="#111"/>
  <text x="150" y="190" font-size="54" font-weight="900" fill="#fff" text-anchor="middle" font-family="Arial">-50%</text>
  <text x="150" y="228" font-size="17" font-weight="700" fill="#ffd27a" text-anchor="middle" letter-spacing="2" font-family="Arial">BLACK FRIDAY</text>
  <text x="745" y="82" text-anchor="end" font-size="40" font-weight="900" fill="#fff" letter-spacing="3" font-family="Arial">STRIDEX</text>
  <path d="M470 645 Q478 562 560 560 L640 590 Q722 602 742 650 L742 688 L462 688 Z" fill="#fff" stroke="#222" stroke-width="5"/>
  <path d="M560 590 L600 610 M575 575 L615 598" stroke="#222" stroke-width="4"/>
  <rect x="455" y="684" width="292" height="24" rx="10" fill="#ff4d4f"/>`,
  `<linearGradient id="g5" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6a2c70"/><stop offset=".55" stop-color="#ff9a5a"/></linearGradient>`);
}

function adPocket() {
  const icons = [[200,640,'#ff6f61'],[370,640,'#ffd25e'],[540,640,'#38bfa0']].map(([x,y,c]) => `<rect x="${x}" y="${y}" width="62" height="62" rx="16" fill="#fff"/><circle cx="${x+31}" cy="${y+31}" r="15" fill="${c}"/>`).join('');
  return wrap(`<rect width="800" height="800" fill="url(#g6)"/>
  <circle cx="680" cy="160" r="120" fill="#fff" opacity=".08"/><circle cx="90" cy="560" r="160" fill="#fff" opacity=".07"/>
  <text x="40" y="82" font-size="40" font-weight="900" fill="#fff" font-family="Arial">PocketGo</text>
  <rect x="290" y="140" width="220" height="440" rx="30" fill="#111"/>
  <rect x="302" y="165" width="196" height="392" rx="18" fill="#fff"/>
  <rect x="318" y="185" width="120" height="14" rx="7" fill="#dfe6ff"/>
  <rect x="318" y="215" width="164" height="90" rx="10" fill="#4f7cff"/>
  <rect x="318" y="320" width="164" height="40" rx="8" fill="#f1f3f8"/><rect x="318" y="370" width="164" height="40" rx="8" fill="#f1f3f8"/><rect x="318" y="420" width="164" height="40" rx="8" fill="#f1f3f8"/>
  <rect x="340" y="500" width="120" height="34" rx="17" fill="#8a5cff"/>
  ${icons}
  <text x="400" y="770" font-size="30" font-weight="800" fill="#fff" text-anchor="middle" font-family="${FONT}">免费下载 · 随时开玩</text>`,
  `<linearGradient id="g6" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4f7cff"/><stop offset="1" stop-color="#8a5cff"/></linearGradient>`);
}

