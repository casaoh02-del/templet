// 라인 아이콘 세트 (24×24, stroke = currentColor). content.json의 icon 필드에 이름으로 지정한다.
const P = {
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  shield: '<path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.3-7.5 9.5-4.3-1.2-7.5-4.9-7.5-9.5V6L12 3z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  flask: '<path d="M9.5 3h5M10 3v6.2L4.8 18.3A1.8 1.8 0 006.4 21h11.2a1.8 1.8 0 001.6-2.7L14 9.2V3"/><path d="M7.5 14.5h9"/>',
  leaf: '<path d="M5 19C5 10 11 5 20 4c-.5 9-5.5 15-14 15"/><path d="M5 19c3-4 6-6.5 10-8.5"/>',
  drop: '<path d="M12 3.5c3.8 4.6 6 8 6 10.8A6 6 0 016 14.3c0-2.8 2.2-6.2 6-10.8z"/><path d="M9.2 14.5a2.8 2.8 0 002.8 2.8"/>',
  capsule: '<rect x="3.2" y="8.3" width="17.6" height="7.4" rx="3.7" transform="rotate(-35 12 12)"/><path d="M9.9 9l4.2 6"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  box: '<path d="M12 3l8 4.3v9.4L12 21l-8-4.3V7.3L12 3z"/><path d="M4 7.3l8 4.4 8-4.4M12 11.7V21"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  fish: '<path d="M3 12c3-4.5 7-6 11-6 3 0 5.5 2.5 7 6-1.5 3.5-4 6-7 6-4 0-8-1.5-11-6z"/><path d="M3 12l-1-3.5M3 12l-1 3.5"/><circle cx="16.5" cy="11" r=".8" fill="currentColor"/>',
  factory: '<path d="M3 21V10l5 3V10l5 3V10l5 3V5h3v16H3z"/><path d="M7 17h2M12 17h2"/>',
  cup: '<path d="M5 8h12v5a6 6 0 01-12 0V8z"/><path d="M17 9.5h1.5a2.5 2.5 0 010 5H17"/><path d="M8 3.5c0 1 1 1 1 2M12 3.5c0 1 1 1 1 2"/>',
  moon: '<path d="M19.5 14.5A8 8 0 019.5 4.5a8 8 0 1010 10z"/>',
  monitor: '<rect x="3" y="4.5" width="18" height="12" rx="1.5"/><path d="M8.5 20.5h7M12 16.5v4"/>',
  utensils: '<path d="M7 3v8M4.5 3v5a2.5 2.5 0 005 0V3M7 11v10M17 21V3c-2.2 1.5-3.5 4-3.5 7.5V14H17"/>',
  run: '<circle cx="14.5" cy="4.5" r="1.8"/><path d="M8 21l3-6 3 2.5V21M6 12l3-4h5l2 4 3 1M11 15l2-5"/>',
  sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z"/><path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16z"/>',
  award: '<circle cx="12" cy="9" r="5.5"/><path d="M8.5 13.3L7 21l5-2.5 5 2.5-1.5-7.7"/>',
  question: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 114 2c-.9.6-1.5 1.1-1.5 2.2M12 17h.01"/>',
  arrow: '<path d="M12 4v16M6 14l6 6 6-6"/>',
};

export const ICON_NAMES = Object.keys(P);

export function icon(name, cls = 'ic', size = 24) {
  const body = P[name] || P.check;
  return `<svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}

// 사진이 없을 때 쓰는 제품 목업 (단상자 + 용기). 실제 제품 사진이 들어오면 대체된다.
export function productMockup({ primary, accent, dark, name = 'PRODUCT', sub = '' }) {
  const n = String(name);
  const s = String(sub).slice(0, 28);
  // 이름 길이에 맞춰 글자 크기 조절 (단상자 폭 176px, 용기 라벨 폭 170px)
  const fit = (text, max, width) => Math.min(max, Math.floor(width / Math.max(1, [...text].reduce((w, ch) => w + (/[ -~]/.test(ch) ? 0.58 : 1), 0))));
  return `<svg class="mockup" viewBox="0 0 640 560" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <linearGradient id="mk-box" x1="0" x2="1"><stop offset="0" stop-color="${primary}"/><stop offset=".55" stop-color="${primary}"/><stop offset="1" stop-color="${dark}"/></linearGradient>
    <linearGradient id="mk-side" x1="0" x2="1"><stop offset="0" stop-color="${dark}"/><stop offset="1" stop-color="${dark}" stop-opacity=".85"/></linearGradient>
    <linearGradient id="mk-btl" x1="0" x2="1"><stop offset="0" stop-color="#e9eef0"/><stop offset=".22" stop-color="#ffffff"/><stop offset=".6" stop-color="#f3f6f7"/><stop offset="1" stop-color="#c9d3d6"/></linearGradient>
    <linearGradient id="mk-cap" x1="0" x2="1"><stop offset="0" stop-color="${dark}"/><stop offset=".35" stop-color="${primary}"/><stop offset="1" stop-color="${dark}"/></linearGradient>
    <radialGradient id="mk-shadow"><stop offset="0" stop-color="#000" stop-opacity=".28"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
  </defs>
  <ellipse cx="320" cy="520" rx="270" ry="26" fill="url(#mk-shadow)"/>
  <!-- 단상자 -->
  <path d="M110 120 L330 120 L330 505 L110 505 Z" fill="url(#mk-box)"/>
  <path d="M330 120 L372 100 L372 488 L330 505 Z" fill="url(#mk-side)"/>
  <path d="M110 120 L152 100 L372 100 L330 120 Z" fill="${primary}" opacity=".75"/>
  <rect x="132" y="150" width="176" height="2" fill="${accent}"/>
  <text x="220" y="196" text-anchor="middle" font-family="Playfair Display" font-style="italic" font-size="22" fill="${accent}">Daily Care</text>
  <text x="220" y="250" text-anchor="middle" font-family="Pretendard" font-weight="800" font-size="${fit(n, 28, 215)}" fill="#fff">${n}</text>
  <text x="220" y="282" text-anchor="middle" font-family="Pretendard" font-weight="500" font-size="15" fill="#fff" opacity=".75">${s}</text>
  <rect x="132" y="455" width="176" height="1.5" fill="#fff" opacity=".35"/>
  <text x="220" y="484" text-anchor="middle" font-family="Pretendard" font-weight="600" font-size="13" fill="#fff" opacity=".7">건강기능식품</text>
  <!-- 용기 -->
  <rect x="352" y="170" width="170" height="54" rx="8" fill="url(#mk-cap)"/>
  <rect x="340" y="218" width="194" height="296" rx="34" fill="url(#mk-btl)"/>
  <rect x="340" y="300" width="194" height="150" fill="${primary}"/>
  <rect x="340" y="300" width="194" height="6" fill="${accent}"/>
  <text x="437" y="358" text-anchor="middle" font-family="Pretendard" font-weight="800" font-size="${fit(n, 22, 180)}" fill="#fff">${n}</text>
  <text x="437" y="392" text-anchor="middle" font-family="Playfair Display" font-style="italic" font-size="16" fill="${accent}">Daily Care</text>
  <rect x="356" y="232" width="14" height="270" rx="7" fill="#fff" opacity=".7"/>
</svg>`;
}
