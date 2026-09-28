// figma.json(빌드 결과물) → 섹션별 프레임, 텍스트/이미지 레이어
figma.showUI(__html__, { width: 320, height: 210 });

const STYLE_WEIGHT = { Thin: 100, ExtraLight: 200, Light: 300, Regular: 400, Medium: 500, SemiBold: 600, Bold: 700, ExtraBold: 800, Black: 900 };
const FALLBACK_FAMILIES = ['Pretendard', 'Noto Sans KR', 'Inter'];

let available = null;
const fontCache = new Map();

// 요청 폰트 → 같은 굵기의 대체 폰트 순서로 로드
async function resolveFont(family, style, weight) {
  const key = `${family}/${style}`;
  if (fontCache.has(key)) return fontCache.get(key);
  if (!available) available = await figma.listAvailableFontsAsync();
  let chosen = null;
  for (const fam of [family, ...FALLBACK_FAMILIES]) {
    const styles = available.filter((f) => f.fontName.family === fam).map((f) => f.fontName.style);
    if (!styles.length) continue;
    const exact = styles.find((s) => s.replace(/\s+/g, '') === style);
    const nearest = styles
      .map((s) => ({ s, w: STYLE_WEIGHT[s.replace(/\s+/g, '')] ?? 400 }))
      .sort((a, b) => Math.abs(a.w - weight) - Math.abs(b.w - weight))[0];
    chosen = { family: fam, style: exact || nearest.s };
    break;
  }
  if (!chosen) chosen = { family: 'Inter', style: 'Regular' };
  await figma.loadFontAsync(chosen);
  fontCache.set(key, chosen);
  return chosen;
}

const paint = (c) => ({ type: 'SOLID', color: { r: c.r / 255, g: c.g / 255, b: c.b / 255 }, opacity: c.a ?? 1 });
const imagePaint = (b64) => ({ type: 'IMAGE', scaleMode: 'FILL', imageHash: figma.createImage(figma.base64Decode(b64)).hash });

async function makeText(layer) {
  const t = layer.text;
  const node = figma.createText();
  node.name = layer.name;
  const first = t.runs[0];
  node.fontName = await resolveFont(first.family, first.style, first.weight);
  node.characters = t.characters;
  node.lineHeight = { unit: 'PIXELS', value: t.lineHeight };
  node.textAlignHorizontal = t.align === 'center' ? 'CENTER' : t.align === 'right' ? 'RIGHT' : 'LEFT';
  let i = 0;
  for (const r of t.runs) {
    const end = Math.min(i + r.length, t.characters.length);
    if (end > i) {
      node.setRangeFontName(i, end, await resolveFont(r.family, r.style, r.weight));
      node.setRangeFontSize(i, end, r.size);
      node.setRangeFills(i, end, [paint(r.color)]);
      node.setRangeLetterSpacing(i, end, { unit: 'PIXELS', value: r.letterSpacing || 0 });
    }
    i = end;
  }
  // 줄바꿈은 이미 브라우저 기준으로 들어가 있으므로 폭에 여유를 둬 추가 줄바꿈을 막는다
  const slack = 12;
  const contentW = layer.w - t.padding.left - t.padding.right;
  node.textAutoResize = 'HEIGHT';
  node.resize(Math.max(1, contentW + slack), node.height);
  const shift = t.align === 'center' ? slack / 2 : t.align === 'right' ? slack : 0;
  node.x = layer.x + t.padding.left - shift;
  node.y = layer.y + t.padding.top;
  return node;
}

function makeImage(layer) {
  const node = figma.createRectangle();
  node.name = layer.name;
  node.resize(Math.max(1, layer.w), Math.max(1, layer.h));
  node.x = layer.x;
  node.y = layer.y;
  node.fills = [imagePaint(layer.image)];
  return node;
}

async function build(data) {
  const root = figma.createFrame();
  root.name = data.name || '상세페이지';
  root.resize(data.width, data.height);
  root.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
  const vp = figma.viewport.center;
  root.x = Math.round(vp.x - data.width / 2);
  root.y = Math.round(vp.y);

  let done = 0;
  for (const sec of data.sections) {
    const frame = figma.createFrame();
    frame.name = sec.name;
    frame.resize(sec.w, sec.h);
    frame.x = sec.x;
    frame.y = sec.y;
    frame.clipsContent = true;
    frame.fills = [imagePaint(sec.background)];
    root.appendChild(frame);
    for (const layer of sec.layers) {
      const node = layer.kind === 'text' && layer.text ? await makeText(layer) : makeImage(layer);
      frame.appendChild(node);
    }
    done++;
    figma.ui.postMessage({ type: 'status', text: `섹션 ${done}/${data.sections.length}` });
  }
  figma.currentPage.selection = [root];
  figma.viewport.scrollAndZoomIntoView([root]);
  const missing = [...fontCache.entries()].filter(([k, v]) => !k.startsWith(v.family + '/')).map(([k]) => k.split('/')[0]);
  const note = missing.length ? ` (폰트 대체: ${[...new Set(missing)].join(', ')} → 설치 후 다시 가져오면 동일하게 보입니다)` : '';
  figma.ui.postMessage({ type: 'status', text: `완료! 섹션 ${done}개${note}` });
  figma.notify(`상세페이지 가져오기 완료${note ? ' — 일부 폰트 대체됨' : ''}`);
}

figma.ui.onmessage = async (msg) => {
  if (msg.type !== 'import') return;
  try {
    await build(msg.data);
  } catch (e) {
    figma.ui.postMessage({ type: 'status', text: '오류: ' + e.message });
    figma.notify('가져오기 실패: ' + e.message, { error: true });
  }
};
