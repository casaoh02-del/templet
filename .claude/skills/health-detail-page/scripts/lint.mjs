// 건강기능식품 표시·광고 1차 자동 점검
// - 금지/주의 표현 탐지, 법정 표기 항목 누락 확인
// - 법률 판단을 대신하지 않는다. 최종 게재 전 한국건강기능식품협회 자율심의를 받아야 한다.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { DISCLAIMER } from './render.mjs';

// [정규식, 사유, 대안]
const ERROR_RULES = [
  [/치료|치유|완치|낫게|낫는/, '질병 치료 표현 (의약품 오인)', '기능성 인정 문구만 사용'],
  [/(질병|질환)\s*(을|의)?\s*예방|예방\s*(효과|에)|예방해|예방하/, '질병 예방 표현', '인정받은 “~위험 감소에 도움을 줄 수 있음” 문구만 사용'],
  [/특효|약효|명약|만병|기적의|신비의/, '과장·의약품 오인 표현', '삭제'],
  [/처방|복용량|복용법|투약|투여/, '의약품 용어', '“섭취”, “섭취량”, “섭취 방법”'],
  [/항암|암\s*(예방|억제|세포)|당뇨|고혈압|고지혈증|관절염|치매|우울증|아토피|골다공증\s*(치료|개선)/, '질병명 직접 언급', '인정 기능성 문구 범위에서만 표현'],
  [/부작용\s*(이|은)?\s*(전혀\s*)?없/, '부작용 부정 표현', '삭제'],
  [/100\s*%\s*(안전|효과)|완벽(한|하게)?\s*(효과|개선)/, '절대적 효과 보장', '삭제'],
  [/식약처\s*(인증|승인|허가|보증)|FDA\s*(승인|인증)/, '인증·승인 오표기', '“식약처 인정” (기능성 원료 인정)'],
  [/디톡스|해독|독소\s*(배출|제거)|노폐물\s*배출/, '해독·디톡스 표현', '삭제'],
  [/살\s*(이)?\s*빠|체중\s*감량|식욕\s*억제|지방\s*(을)?\s*태/, '다이어트 과장 표현', '인정 문구 예: “체지방 감소에 도움을 줄 수 있음”'],
  [/즉효|즉시\s*효과|하루\s*만에|먹자마자/, '즉각 효과 표현', '삭제'],
];

const WARN_RULES = [
  [/최고|최상|최초|유일|1\s*위|No\.?\s*1|넘버\s*원|독보적/i, '최상급·배타적 표현 — 객관적 근거(출처·기간) 필요'],
  [/체험기|체험\s*후기|사용\s*후기|먹어\s*보니|효과\s*(를)?\s*봤/, '소비자 체험기 — 기능성 오인 우려, 심의 제한'],
  [/의사|약사|한의사|교수|박사|전문가\s*(가)?\s*(추천|인정)/, '전문가 추천·보증 — 심의 제한'],
  [/효과|효능/, '“효과/효능” — “도움을 줄 수 있음”으로 완화 권장'],
  [/면역력\s*(강화|증강|UP|업)/i, '면역 관련 — 인정 문구 “면역 기능 증진에 도움을 줄 수 있음” 등으로'],
  [/임상|인체\s*적용\s*시험|논문/, '시험·논문 인용 — 출처 표기와 심의 필요'],
  [/천연|무첨가|무방부제|유기농|특허/, '근거 필요 표현 (인증서·특허 번호 등)'],
  [/회복|재생|개선된다|좋아진다|젊어/, '효과 단정 표현 — 기능성 인정 범위 확인'],
];

// 전자상거래 상품정보제공고시(건강기능식품) + 건강기능식품 표시기준 핵심 항목
export const REQUIRED_INFO = [
  ['제품명'],
  ['식품의 유형', '식품유형'],
  ['제조업소', '제조원', '제조사'],
  ['소비기한'],
  ['내용량', '용량', '중량'],
  ['원료명', '원재료'],
  ['영양정보', '영양·기능정보', '영양 기능정보'],
  ['기능정보', '기능성', '영양·기능정보'],
  ['섭취량', '섭취방법', '섭취 방법'],
  ['주의사항'],
  ['유전자변형'],
  ['수입'],
  ['소비자상담', '고객센터', '상담'],
];

function collectStrings(node, where, out) {
  if (typeof node === 'string') out.push({ where, text: node });
  else if (Array.isArray(node)) node.forEach((v, i) => collectStrings(v, `${where}[${i}]`, out));
  else if (node && typeof node === 'object')
    for (const [k, v] of Object.entries(node)) {
      if (['src', 'slot', 'type', 'tone', 'name'].includes(k)) continue;
      collectStrings(v, where ? `${where}.${k}` : k, out);
    }
  return out;
}

export function lintContent(content) {
  const errors = [];
  const warnings = [];
  const sections = content.sections || [];

  // 인정받은 기능성 문구와 의무 문구는 금지어 검사에서 제외
  const allow = [DISCLAIMER, ...sections.filter((s) => s.type === 'function').flatMap((s) => (s.claims || []).map((c) => c.text))].filter(Boolean);

  // 이미지 설명(image.desc)은 촬영/생성 메모라 검사하지 않는다
  const strings = collectStrings(sections, 'sections', []).filter(({ where }) => !/image\.desc$/.test(where));
  for (const { where, text } of strings) {
    if (/\.claims\[\d+\]\.text$/.test(where)) continue;
    let scan = text.replace(/\*\*/g, '');
    for (const a of allow) scan = scan.split(a).join(' ');
    const sectionType = sections[+where.match(/^sections\[(\d+)\]/)?.[1]]?.type;
    // 제품정보·주의사항 표는 법정 문구라 질병명이 들어갈 수 있다 → 경고만
    const legal = sectionType === 'info' || sectionType === 'caution';
    for (const [re, reason, fix] of ERROR_RULES) {
      const m = scan.match(re);
      if (m) (legal ? warnings : errors).push({ where, word: m[0], reason, fix, text });
    }
    for (const [re, reason] of WARN_RULES) {
      const m = scan.match(re);
      if (m && !legal) warnings.push({ where, word: m[0], reason, text });
    }
  }

  // 구조 필수 요소
  const types = new Set(sections.map((s) => s.type));
  if (!types.has('function')) errors.push({ where: 'sections', reason: '기능성(function) 섹션 없음 — 식약처 인정 기능성 문구를 그대로 표기해야 함' });
  for (const s of sections.filter((s) => s.type === 'function'))
    for (const [i, c] of (s.claims || []).entries())
      if (!/도움을\s*줄\s*수\s*있음|필요(함)?\.?$/.test(c.text || ''))
        warnings.push({ where: `function.claims[${i}]`, word: c.text, reason: '기능성 문구는 보통 “~에 도움을 줄 수 있음”(원료 기능성) 또는 “~에 필요”(영양소 기능) 형태 — 원료 인정서 문구와 글자 그대로 일치하는지 확인' });
  if (!types.has('caution')) errors.push({ where: 'sections', reason: '섭취 시 주의사항(caution) 섹션 없음' });
  if (!types.has('info')) errors.push({ where: 'sections', reason: '제품 정보(info, 상품정보제공고시) 섹션 없음' });
  else {
    const keys = sections.filter((s) => s.type === 'info').flatMap((s) => (s.rows || []).map((r) => String(r[0])));
    for (const [k, v] of sections.filter((s) => s.type === 'info').flatMap((s) => s.rows || []))
      if (!String(v ?? '').trim()) warnings.push({ where: 'info.rows', word: k, reason: `제품 정보 값이 비어 있음: “${k}”` });
    for (const alts of REQUIRED_INFO)
      if (!keys.some((k) => alts.some((a) => k.includes(a))))
        warnings.push({ where: 'info.rows', word: alts[0], reason: `제품 정보 항목 누락 추정: “${alts[0]}”` });
  }
  const reviewNo = sections.find((s) => s.type === 'caution')?.reviewNumber;
  if (!reviewNo) warnings.push({ where: 'caution.reviewNumber', reason: '표시·광고 심의필 번호 미기재 — 자율심의 통과 후 기재' });

  return { errors, warnings };
}

export function formatReport({ errors, warnings }, title = '') {
  const line = (x) => `- ${x.word ? `**${x.word}** — ` : ''}${x.reason}${x.fix ? ` → ${x.fix}` : ''}  \n  \`${x.where}\`${x.text ? `: ${x.text.replace(/\n/g, ' ')}` : ''}`;
  return [
    `# 광고 표현 점검 리포트${title ? ` — ${title}` : ''}`,
    '',
    '> 자동 점검은 1차 필터입니다. 게재 전 반드시 **한국건강기능식품협회 표시·광고 자율심의**를 받으세요.',
    '',
    `## 수정 필수 (${errors.length})`,
    ...(errors.length ? errors.map(line) : ['- 없음']),
    '',
    `## 확인 필요 (${warnings.length})`,
    ...(warnings.length ? warnings.map(line) : ['- 없음']),
    '',
  ].join('\n');
}

// CLI: node lint.mjs <프로젝트 폴더>
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const dir = path.resolve(process.argv[2] || '.');
  const content = JSON.parse(fs.readFileSync(path.join(dir, 'content.json'), 'utf8'));
  const result = lintContent(content);
  console.log(formatReport(result, content.meta?.title));
  process.exit(result.errors.length ? 1 : 0);
}
