// content.json → 상세페이지 HTML
// 편집 가능한 레이어로 내보낼 요소에는 data-layer(이름)와 data-kind(text | image | shape)를 붙인다.
// data-layer가 없는 장식(배경 워드마크, 라인, 아이콘 등)은 섹션 '배경' 레이어에 합쳐진다.
import fs from 'node:fs';
import path from 'node:path';
import { icon, productMockup } from './icons.mjs';

export const DISCLAIMER = '본 제품은 질병의 예방 및 치료를 위한 의약품이 아닙니다.';

const DEFAULT_THEME = {
  primary: '#0E4250',
  accent: '#D4A55A',
  bg: '#FFFFFF',
  soft: '#F3F6F5',
  dark: '#08262E',
  text: '#15201E',
  muted: '#66716E',
  font: 'Pretendard',
  display: 'Playfair Display',
};

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// **강조** → 포인트 컬러, \n → 줄바꿈
const rich = (s) =>
  esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');

// 텍스트 레이어
const t = (tag, cls, name, value) =>
  value == null || value === ''
    ? ''
    : `<${tag} class="${cls}" data-layer="${esc(name)}" data-kind="text">${rich(value)}</${tag}>`;

const pad2 = (n) => String(n).padStart(2, '0');

// 섹션 머리: 영문 키커(세리프) + 한글 라벨 + 타이틀 + 리드
function head(s, key, { kicker, center = true } = {}) {
  const k = s.kicker ?? kicker;
  return `<header class="head${center ? '' : ' left'}">
    ${k ? `<div class="kick"><i class="ln"></i>${t('p', 'kicker', `${key}-키커`, k)}<i class="ln"></i></div>` : ''}
    ${t('p', 'eyebrow', `${key}-아이브로우`, s.eyebrow)}
    ${t('h2', 'title', `${key}-타이틀`, s.title)}
    ${t('p', 'lead', `${key}-본문`, s.body)}
  </header>`;
}

// 배경 워드마크 (장식)
const word = (w) => (w ? `<div class="bgword" aria-hidden="true">${esc(w)}</div>` : '');

function createImage(projectDir, ctx) {
  // image: "images/a.png" 또는 { src, slot, desc, icon }
  return (image, name, cls = 'img', fallback = 'photo') => {
    if (!image) return '';
    const img = typeof image === 'string' ? { src: image } : image;
    const src = img.src && path.resolve(projectDir, img.src);
    if (src && fs.existsSync(src)) {
      return `<div class="${cls}" data-layer="${esc(name)}" data-kind="image"><img src="../${esc(img.src)}" alt="${esc(img.desc || name)}"></div>`;
    }
    // 사진이 없을 때: 제품 자리는 목업, 나머지는 아이콘 자리표시자
    if (fallback === 'product') {
      return `<div class="${cls} ph-product" data-layer="${esc(name)}" data-kind="image">${productMockup(ctx.mockup)}</div>`;
    }
    return `<div class="${cls} ph" data-layer="${esc(name)}" data-kind="image">
      <div class="ph-in">${icon(img.icon || 'sparkle', 'ph-ic', 44)}<b>${esc(img.slot || name)}</b><span>${esc(img.desc || '')}</span></div></div>`;
  };
}

const sectionRenderers = {
  hero: (s, { img }) => `
    <div class="glow" aria-hidden="true"></div>
    ${word(s.bgWord)}
    <div class="hero-top">
      ${s.kicker ? `<div class="kick"><i class="ln"></i>${t('p', 'kicker', '히어로-키커', s.kicker)}<i class="ln"></i></div>` : ''}
      ${t('p', 'eyebrow', '히어로-아이브로우', s.eyebrow)}
      ${t('h1', 'hero-title', '히어로-타이틀', s.title)}
      ${t('p', 'hero-sub', '히어로-서브', s.subtitle)}
    </div>
    <div class="stage">
      <div class="podium" aria-hidden="true"></div>
      ${img(s.image, '히어로-제품이미지', 'img hero-img', 'product')}
    </div>
    ${s.badges?.length ? `<div class="medals">${s.badges.map((b, i) => {
      const it = typeof b === 'string' ? { text: b } : b;
      return `<div class="medal" data-layer="배지-${i + 1}" data-kind="shape">${icon(it.icon || ['shield', 'factory', 'drop'][i % 3], 'medal-ic', 30)}${t('p', 'medal-t', `배지-${i + 1}-텍스트`, it.text)}</div>`;
    }).join('')}</div>` : ''}`,

  pain: (s, { img }) => `
    ${word(s.bgWord)}
    ${head(s, '공감', { kicker: 'Check Point' })}
    <div class="checks">${(s.items || []).map((it, i) => {
      const x = typeof it === 'string' ? { text: it } : it;
      return `<div class="check" data-layer="공감-카드-${i + 1}" data-kind="shape">
        <span class="check-ic">${icon(x.icon || 'check', 'ic', 26)}</span>${t('p', 'check-t', `공감-카드-${i + 1}-텍스트`, x.text)}
      </div>`;
    }).join('')}</div>
    ${img(s.image, '공감-이미지')}
    ${s.closing ? `<div class="closing-wrap"><span class="down">${icon('arrow', 'ic', 28)}</span>${t('p', 'closing', '공감-마무리', s.closing)}</div>` : ''}`,

  solution: (s, { img }) => `
    ${word(s.bgWord)}
    ${head(s, '해결', { kicker: 'Solution' })}
    ${img(s.image, '해결-이미지', 'img wide')}`,

  function: (s) => `
    <div class="glow" aria-hidden="true"></div>
    ${word(s.bgWord ?? 'Function')}
    ${head({ ...s, eyebrow: s.eyebrow ?? '식약처 인정 기능성' }, '기능성', { kicker: 'Functional Claims' })}
    <div class="claims">${(s.claims || []).map((c, i) => `
      <div class="claim" data-layer="기능성-${i + 1}" data-kind="shape">
        <div class="seal"><span class="seal-n">${pad2(i + 1)}</span><span class="seal-l">기능성</span></div>
        <div class="claim-body">
          ${t('p', 'claim-ing', `기능성-${i + 1}-원료`, c.ingredient)}
          ${t('p', 'claim-t', `기능성-${i + 1}-문구`, c.text)}
        </div>
      </div>`).join('')}</div>
    ${t('p', 'note', '기능성-주석', s.note)}`,

  ingredient: (s, { img }) => `
    ${word(s.bgWord)}
    ${head(s, '원료', { kicker: 'Ingredient' })}
    <div class="ings">${(s.items || []).map((it, i) => `
      <div class="ing" data-layer="원료-${i + 1}" data-kind="shape">
        ${img(it.image, `원료-${i + 1}-이미지`, 'img ing-img')}
        <div class="ing-txt">
          <span class="ing-no">${pad2(i + 1)}</span>
          ${t('p', 'ing-name', `원료-${i + 1}-이름`, it.name)}
          ${t('p', 'ing-amt', `원료-${i + 1}-함량`, it.amount)}
          ${t('p', 'ing-desc', `원료-${i + 1}-설명`, it.desc)}
        </div>
      </div>`).join('')}</div>`,

  numbers: (s) => `
    <div class="glow" aria-hidden="true"></div>
    ${head(s, '수치', { kicker: 'Key Numbers' })}
    <div class="nums">${(s.items || []).map((it, i) => `
      <div class="num">
        <p class="num-v" data-layer="수치-${i + 1}-값" data-kind="text">${esc(it.value)}<small>${esc(it.unit || '')}</small></p>
        ${t('p', 'num-l', `수치-${i + 1}-라벨`, it.label)}
      </div>`).join('')}</div>
    ${t('p', 'note', '수치-주석', s.note)}`,

  compare: (s) => `
    ${head(s, '비교', { kicker: 'Compare' })}
    <div class="cmp" data-layer="비교-표" data-kind="shape">
      <div class="cmp-ours" aria-hidden="true"></div>
      <div class="cmp-row cmp-head"><span></span>${(s.columns || []).map((c, i) => t('span', i === 0 ? 'cmp-c ours' : 'cmp-c', `비교-열-${i + 1}`, c)).join('')}</div>
      ${(s.rows || []).map((r, ri) => `<div class="cmp-row">${r.map((cell, ci) => t('span', ci === 0 ? 'cmp-k' : ci === 1 ? 'cmp-c ours' : 'cmp-c', `비교-${ri + 1}-${ci + 1}`, cell)).join('')}</div>`).join('')}
    </div>
    ${t('p', 'note', '비교-주석', s.note)}`,

  quality: (s, { img }) => `
    ${word(s.bgWord ?? 'Quality')}
    ${head(s, '품질', { kicker: 'Quality Control' })}
    <div class="quals">${(s.items || []).map((it, i) => `
      <div class="qual" data-layer="품질-${i + 1}" data-kind="shape">
        ${it.image ? img(it.image, `품질-${i + 1}-이미지`, 'img qual-img') : `<div class="qual-ic">${icon(it.icon || ['award', 'flask', 'drop', 'box'][i % 4], 'ic', 40)}</div>`}
        ${t('p', 'qual-t', `품질-${i + 1}-제목`, it.title)}
        ${t('p', 'qual-d', `품질-${i + 1}-설명`, it.desc)}
      </div>`).join('')}</div>`,

  howto: (s, { img }) => `
    ${head(s, '섭취법', { kicker: 'How to Take' })}
    ${img(s.image, '섭취법-이미지', 'img wide')}
    <div class="steps">${(s.steps || []).map((st, i) => `
      <div class="step" data-layer="섭취법-${i + 1}" data-kind="shape">
        <div class="step-badge">${icon(st.icon || ['capsule', 'utensils', 'sun'][i % 3], 'ic', 30)}</div>
        <div class="step-txt">
          <p class="step-n" data-layer="섭취법-${i + 1}-번호" data-kind="text">STEP ${pad2(i + 1)}</p>
          ${t('p', 'step-t', `섭취법-${i + 1}-제목`, st.title)}
          ${t('p', 'step-d', `섭취법-${i + 1}-설명`, st.desc)}
        </div>
      </div>`).join('')}</div>`,

  target: (s) => `
    ${head(s, '추천', { kicker: 'Recommend' })}
    <div class="targets">${(s.items || []).map((it, i) => {
      const x = typeof it === 'string' ? { text: it } : it;
      return `<div class="target" data-layer="추천-${i + 1}" data-kind="shape">
        <span class="target-ic">${icon(x.icon || 'check', 'ic', 30)}</span>${t('p', 'target-t', `추천-${i + 1}-텍스트`, x.text)}
      </div>`;
    }).join('')}</div>`,

  faq: (s) => `
    ${head({ ...s, title: s.title ?? '자주 묻는 질문' }, 'FAQ', { kicker: 'FAQ' })}
    <div class="faqs">${(s.items || []).map((it, i) => `
      <div class="faq" data-layer="FAQ-${i + 1}" data-kind="shape">
        <div class="faq-row"><span class="qa q">Q</span>${t('p', 'faq-q', `FAQ-${i + 1}-질문`, it.q)}</div>
        <div class="faq-row"><span class="qa a">A</span>${t('p', 'faq-a', `FAQ-${i + 1}-답변`, it.a)}</div>
      </div>`).join('')}</div>`,

  info: (s) => `
    <header class="head left">${t('h2', 'title small', '제품정보-타이틀', s.title ?? '제품 정보')}</header>
    <div class="info" data-layer="제품정보-표" data-kind="shape">
      ${(s.rows || []).map(([k, v], i) => `<div class="info-row">${t('span', 'info-k', `제품정보-${i + 1}-항목`, k)}${t('span', 'info-v', `제품정보-${i + 1}-내용`, v)}</div>`).join('')}
    </div>`,

  caution: (s) => `
    <header class="head left">${t('h2', 'title small', '주의사항-타이틀', s.title ?? '섭취 시 주의사항')}</header>
    <div class="cautions" data-layer="주의사항-박스" data-kind="shape">
      ${(s.items || []).map((it, i) => t('p', 'caution-t', `주의사항-${i + 1}`, `· ${it}`)).join('')}
      ${t('p', 'disclaimer', '주의사항-의약품아님', DISCLAIMER)}
    </div>
    ${t('p', 'review-no', '심의필번호', s.reviewNumber)}`,

  cta: (s, { img }) => `
    <div class="glow" aria-hidden="true"></div>
    ${word(s.bgWord)}
    ${head(s, '마무리', { kicker: s.kicker ?? 'Every Day' })}
    <div class="stage">
      <div class="podium" aria-hidden="true"></div>
      ${img(s.image, '마무리-이미지', 'img hero-img', 'product')}
    </div>`,

  image: (s, { img }) => img(s.image ?? s, s.name || '전체이미지', 'img full-img'),
};

export const SECTION_TYPES = Object.keys(sectionRenderers);

// 섹션 배경: light | soft | primary | dark
const DEFAULT_TONE = { hero: 'dark', function: 'primary', numbers: 'dark', ingredient: 'soft', target: 'soft', cta: 'dark', caution: 'soft', info: 'light' };

export function renderHtml(content, { projectDir, fontUrl, displayFontUrl, displayItalicUrl }) {
  const theme = { ...DEFAULT_THEME, ...(content.theme || {}) };
  const width = content.meta?.width || 860;
  const mockup = {
    primary: theme.primary,
    accent: theme.accent,
    dark: theme.dark,
    name: content.meta?.productName || content.meta?.title || 'PRODUCT',
    sub: content.meta?.productSub || '',
  };
  const img = createImage(projectDir, { mockup });
  const sections = (content.sections || []).map((s, i) => {
    const render = sectionRenderers[s.type];
    if (!render) throw new Error(`알 수 없는 섹션 타입: "${s.type}" (가능: ${SECTION_TYPES.join(', ')})`);
    const tone = s.tone || DEFAULT_TONE[s.type] || 'light';
    const id = `${pad2(i + 1)}-${s.type}`;
    return `<section class="sec sec-${s.type} tone-${tone}" data-section="${id}">${render(s, { img })}</section>`;
  });

  const css = fs.readFileSync(new URL('./theme.css', import.meta.url), 'utf8');
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=${width}">
<title>${esc(content.meta?.title || '상세페이지')}</title>
<style>
@font-face { font-family: 'Pretendard'; font-weight: 45 920; font-display: block; src: url('${fontUrl}') format('woff2-variations'); }
@font-face { font-family: 'Playfair Display'; font-style: normal; font-weight: 400 900; font-display: block; src: url('${displayFontUrl}') format('woff2-variations'); }
@font-face { font-family: 'Playfair Display'; font-style: italic; font-weight: 400 900; font-display: block; src: url('${displayItalicUrl}') format('woff2-variations'); }
:root {
  --w: ${width}px;
  --primary: ${theme.primary}; --accent: ${theme.accent}; --bg: ${theme.bg}; --soft: ${theme.soft};
  --dark: ${theme.dark}; --text: ${theme.text}; --muted: ${theme.muted};
  --font: '${theme.font}', 'Pretendard', 'Noto Sans KR', sans-serif;
  --display: '${theme.display}', 'Playfair Display', Georgia, serif;
}
${css}
</style>
</head>
<body>
<main class="page">
${sections.join('\n')}
</main>
</body>
</html>
`;
}
