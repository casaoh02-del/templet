// content.json → 상세페이지 HTML
// 편집 가능한 레이어로 내보낼 요소에는 data-layer(이름)와 data-kind(text | image | shape)를 붙인다.
// export.mjs가 이 속성을 읽어 PSD 레이어 / Figma 노드로 변환한다.
import fs from 'node:fs';
import path from 'node:path';

export const DISCLAIMER = '본 제품은 질병의 예방 및 치료를 위한 의약품이 아닙니다.';

const DEFAULT_THEME = {
  primary: '#0F5B4A',
  accent: '#E8A33D',
  bg: '#FFFFFF',
  soft: '#F2F6F4',
  dark: '#12201C',
  text: '#1C2421',
  muted: '#5F6B67',
  font: 'Pretendard',
};

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// **강조** → 포인트 컬러, 줄바꿈(\n) → <br>
const rich = (s) =>
  esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');

// 텍스트 레이어 하나
const t = (tag, cls, name, value) =>
  value == null || value === ''
    ? ''
    : `<${tag} class="${cls}" data-layer="${esc(name)}" data-kind="text">${rich(value)}</${tag}>`;

function createImage(projectDir) {
  // image: "images/a.png" 또는 { src, slot, desc }
  return (image, name, cls = 'img') => {
    if (!image) return '';
    const img = typeof image === 'string' ? { src: image } : image;
    const src = img.src && path.resolve(projectDir, img.src);
    if (src && fs.existsSync(src)) {
      return `<div class="${cls}" data-layer="${esc(name)}" data-kind="image"><img src="../${esc(img.src)}" alt="${esc(img.desc || name)}"></div>`;
    }
    // 사진이 아직 없으면 자리표시자 — 이미지 프롬프트(image-prompts.md)의 slot과 맞춘다
    return `<div class="${cls} placeholder" data-layer="${esc(name)}" data-kind="image">
      <div class="ph-inner"><b>IMAGE · ${esc(img.slot || name)}</b><span>${esc(img.desc || img.src || '')}</span></div></div>`;
  };
}

const sectionRenderers = {
  hero: (s, { img }) => `
    ${t('p', 'eyebrow', '히어로-아이브로우', s.eyebrow)}
    ${t('h1', 'hero-title', '히어로-타이틀', s.title)}
    ${t('p', 'hero-sub', '히어로-서브', s.subtitle)}
    ${img(s.image, '히어로-제품이미지', 'img hero-img')}
    ${s.badges?.length ? `<div class="badges">${s.badges.map((b, i) => `<div class="badge" data-layer="배지-${i + 1}" data-kind="shape">${t('span', 'badge-t', `배지-${i + 1}-텍스트`, b)}</div>`).join('')}</div>` : ''}`,

  pain: (s, { img }) => `
    ${t('p', 'eyebrow', '공감-아이브로우', s.eyebrow)}
    ${t('h2', 'title', '공감-타이틀', s.title)}
    <div class="checks">${(s.items || []).map((it, i) => `
      <div class="check" data-layer="공감-카드-${i + 1}" data-kind="shape">
        <span class="check-ic">✓</span>${t('p', 'check-t', `공감-카드-${i + 1}-텍스트`, it)}
      </div>`).join('')}</div>
    ${img(s.image, '공감-이미지')}
    ${t('p', 'closing', '공감-마무리', s.closing)}`,

  solution: (s, { img }) => `
    ${t('p', 'eyebrow', '해결-아이브로우', s.eyebrow)}
    ${t('h2', 'title', '해결-타이틀', s.title)}
    ${t('p', 'body', '해결-본문', s.body)}
    ${img(s.image, '해결-이미지')}`,

  function: (s) => `
    ${t('p', 'eyebrow', '기능성-아이브로우', s.eyebrow ?? '식약처 인정 기능성')}
    ${t('h2', 'title', '기능성-타이틀', s.title)}
    <div class="claims">${(s.claims || []).map((c, i) => `
      <div class="claim" data-layer="기능성-${i + 1}" data-kind="shape">
        ${t('p', 'claim-ing', `기능성-${i + 1}-원료`, c.ingredient)}
        ${t('p', 'claim-t', `기능성-${i + 1}-문구`, c.text)}
      </div>`).join('')}</div>
    ${t('p', 'note', '기능성-주석', s.note)}`,

  ingredient: (s, { img }) => `
    ${t('p', 'eyebrow', '원료-아이브로우', s.eyebrow)}
    ${t('h2', 'title', '원료-타이틀', s.title)}
    ${t('p', 'body', '원료-본문', s.body)}
    <div class="ings">${(s.items || []).map((it, i) => `
      <div class="ing" data-layer="원료-${i + 1}" data-kind="shape">
        ${img(it.image, `원료-${i + 1}-이미지`, 'img ing-img')}
        <div class="ing-txt">
          ${t('p', 'ing-name', `원료-${i + 1}-이름`, it.name)}
          ${t('p', 'ing-amt', `원료-${i + 1}-함량`, it.amount)}
          ${t('p', 'ing-desc', `원료-${i + 1}-설명`, it.desc)}
        </div>
      </div>`).join('')}</div>`,

  numbers: (s) => `
    ${t('p', 'eyebrow', '수치-아이브로우', s.eyebrow)}
    ${t('h2', 'title', '수치-타이틀', s.title)}
    <div class="nums">${(s.items || []).map((it, i) => `
      <div class="num" data-layer="수치-${i + 1}" data-kind="shape">
        <p class="num-v" data-layer="수치-${i + 1}-값" data-kind="text">${esc(it.value)}<small>${esc(it.unit || '')}</small></p>
        ${t('p', 'num-l', `수치-${i + 1}-라벨`, it.label)}
      </div>`).join('')}</div>
    ${t('p', 'note', '수치-주석', s.note)}`,

  compare: (s) => `
    ${t('p', 'eyebrow', '비교-아이브로우', s.eyebrow)}
    ${t('h2', 'title', '비교-타이틀', s.title)}
    <div class="cmp" data-layer="비교-표" data-kind="shape">
      <div class="cmp-row cmp-head"><span></span>${(s.columns || []).map((c, i) => t('span', i === 0 ? 'cmp-c ours' : 'cmp-c', `비교-열-${i + 1}`, c)).join('')}</div>
      ${(s.rows || []).map((r, ri) => `<div class="cmp-row">${r.map((cell, ci) => t('span', ci === 0 ? 'cmp-k' : ci === 1 ? 'cmp-c ours' : 'cmp-c', `비교-${ri + 1}-${ci + 1}`, cell)).join('')}</div>`).join('')}
    </div>
    ${t('p', 'note', '비교-주석', s.note)}`,

  quality: (s, { img }) => `
    ${t('p', 'eyebrow', '품질-아이브로우', s.eyebrow)}
    ${t('h2', 'title', '품질-타이틀', s.title)}
    <div class="quals">${(s.items || []).map((it, i) => `
      <div class="qual" data-layer="품질-${i + 1}" data-kind="shape">
        ${img(it.image, `품질-${i + 1}-이미지`, 'img qual-img')}
        ${t('p', 'qual-t', `품질-${i + 1}-제목`, it.title)}
        ${t('p', 'qual-d', `품질-${i + 1}-설명`, it.desc)}
      </div>`).join('')}</div>`,

  howto: (s, { img }) => `
    ${t('p', 'eyebrow', '섭취법-아이브로우', s.eyebrow ?? 'HOW TO TAKE')}
    ${t('h2', 'title', '섭취법-타이틀', s.title)}
    ${img(s.image, '섭취법-이미지')}
    <div class="steps">${(s.steps || []).map((st, i) => `
      <div class="step" data-layer="섭취법-${i + 1}" data-kind="shape">
        <p class="step-n" data-layer="섭취법-${i + 1}-번호" data-kind="text">${String(i + 1).padStart(2, '0')}</p>
        ${t('p', 'step-t', `섭취법-${i + 1}-제목`, st.title)}
        ${t('p', 'step-d', `섭취법-${i + 1}-설명`, st.desc)}
      </div>`).join('')}</div>`,

  target: (s) => `
    ${t('p', 'eyebrow', '추천-아이브로우', s.eyebrow)}
    ${t('h2', 'title', '추천-타이틀', s.title)}
    <div class="targets">${(s.items || []).map((it, i) => `
      <div class="target" data-layer="추천-${i + 1}" data-kind="shape">${t('p', 'target-t', `추천-${i + 1}-텍스트`, it)}</div>`).join('')}</div>`,

  faq: (s) => `
    ${t('p', 'eyebrow', 'FAQ-아이브로우', s.eyebrow ?? 'FAQ')}
    ${t('h2', 'title', 'FAQ-타이틀', s.title ?? '자주 묻는 질문')}
    <div class="faqs">${(s.items || []).map((it, i) => `
      <div class="faq" data-layer="FAQ-${i + 1}" data-kind="shape">
        ${t('p', 'faq-q', `FAQ-${i + 1}-질문`, `Q. ${it.q}`)}
        ${t('p', 'faq-a', `FAQ-${i + 1}-답변`, it.a)}
      </div>`).join('')}</div>`,

  info: (s) => `
    ${t('h2', 'title small', '제품정보-타이틀', s.title ?? '제품 정보')}
    <div class="info" data-layer="제품정보-표" data-kind="shape">
      ${(s.rows || []).map(([k, v], i) => `<div class="info-row">${t('span', 'info-k', `제품정보-${i + 1}-항목`, k)}${t('span', 'info-v', `제품정보-${i + 1}-내용`, v)}</div>`).join('')}
    </div>`,

  caution: (s) => {
    const items = [...(s.items || [])];
    return `
    ${t('h2', 'title small', '주의사항-타이틀', s.title ?? '섭취 시 주의사항')}
    <div class="cautions" data-layer="주의사항-박스" data-kind="shape">
      ${items.map((it, i) => t('p', 'caution-t', `주의사항-${i + 1}`, `· ${it}`)).join('')}
      ${t('p', 'disclaimer', '주의사항-의약품아님', DISCLAIMER)}
    </div>
    ${t('p', 'review-no', '심의필번호', s.reviewNumber)}`;
  },

  cta: (s, { img }) => `
    ${img(s.image, '마무리-이미지')}
    ${t('p', 'eyebrow', '마무리-아이브로우', s.eyebrow)}
    ${t('h2', 'title', '마무리-타이틀', s.title)}
    ${t('p', 'body', '마무리-본문', s.body)}`,

  image: (s, { img }) => img(s.image ?? s, s.name || '전체이미지', 'img full-img'),
};

export const SECTION_TYPES = Object.keys(sectionRenderers);

// 섹션 배경: "light"(흰색) | "soft"(연한 톤) | "primary"(브랜드 컬러) | "dark"
const DEFAULT_TONE = { hero: 'soft', function: 'primary', numbers: 'dark', target: 'soft', cta: 'primary', caution: 'soft' };

export function renderHtml(content, { projectDir, fontUrl }) {
  const theme = { ...DEFAULT_THEME, ...(content.theme || {}) };
  const width = content.meta?.width || 860;
  const img = createImage(projectDir);
  const sections = (content.sections || []).map((s, i) => {
    const render = sectionRenderers[s.type];
    if (!render) throw new Error(`알 수 없는 섹션 타입: "${s.type}" (가능: ${SECTION_TYPES.join(', ')})`);
    const tone = s.tone || DEFAULT_TONE[s.type] || 'light';
    const id = `${String(i + 1).padStart(2, '0')}-${s.type}`;
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
:root {
  --w: ${width}px;
  --primary: ${theme.primary}; --accent: ${theme.accent}; --bg: ${theme.bg}; --soft: ${theme.soft};
  --dark: ${theme.dark}; --text: ${theme.text}; --muted: ${theme.muted};
  --font: '${theme.font}', 'Pretendard', 'Noto Sans KR', sans-serif;
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
