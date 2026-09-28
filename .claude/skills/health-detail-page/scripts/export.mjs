// 렌더된 HTML → PNG(전체/섹션별), 레이어 PSD, Figma 가져오기용 JSON
import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';
import { writePsdBuffer } from 'ag-psd';

// ── 브라우저 ─────────────────────────────────────────
export async function launchBrowser() {
  const { chromium } = await import('playwright');
  // CHROME_PATH → Playwright 기본 → 사전 설치 경로 → 로컬 Chrome 순서로 시도
  const attempts = [
    process.env.CHROME_PATH && { executablePath: process.env.CHROME_PATH },
    {},
    fs.existsSync('/opt/pw-browsers/chromium') && { executablePath: '/opt/pw-browsers/chromium' },
    { channel: 'chrome' },
  ].filter(Boolean);
  let lastErr;
  for (const opts of attempts) {
    try {
      return await chromium.launch(opts);
    } catch (e) {
      lastErr = e;
    }
  }
  throw new Error(`브라우저 실행 실패. "npx playwright install chromium"을 실행하거나 CHROME_PATH를 지정하세요.\n${lastErr?.message}`);
}

// 페이지 안에서 실행: 섹션/레이어 좌표, 텍스트 스타일·줄바꿈 추출
function extractLayout() {
  const PX = (v) => parseFloat(v) || 0;
  const parseColor = (c) => {
    const m = c.match(/rgba?\(([^)]+)\)/);
    if (!m) return { r: 0, g: 0, b: 0, a: 1 };
    const [r, g, b, a = 1] = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    return { r, g, b, a };
  };
  const family = (ff) => ff.split(',')[0].trim().replace(/^["']|["']$/g, '');
  const docTop = (el) => el.getBoundingClientRect().top + window.scrollY;
  const docLeft = (el) => el.getBoundingClientRect().left + window.scrollX;

  function extractText(el) {
    const cs = getComputedStyle(el);
    const chars = [];
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const range = document.createRange();
    let prev = null;
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const pcs = getComputedStyle(n.parentElement);
      const style = {
        family: family(pcs.fontFamily),
        weight: Number(pcs.fontWeight) || 400,
        size: PX(pcs.fontSize),
        color: parseColor(pcs.color),
        letterSpacing: pcs.letterSpacing === 'normal' ? 0 : PX(pcs.letterSpacing),
      };
      for (let i = 0; i < n.data.length; i++) {
        range.setStart(n, i);
        range.setEnd(n, i + 1);
        const r = range.getClientRects()[0];
        const isSpace = /\s/.test(n.data[i]);
        if (!r || (isSpace && r.width === 0)) continue; // 접힌 공백
        // 브라우저가 실제로 줄을 바꾼 위치를 그대로 옮긴다 → PSD/Figma에서도 줄바꿈이 동일
        if (prev && (r.top + r.bottom) / 2 > prev.bottom) {
          while (chars.length && chars[chars.length - 1].ch === ' ') chars.pop();
          chars.push({ ch: '\n', style });
        }
        if (isSpace && (!chars.length || chars[chars.length - 1].ch === '\n' || chars[chars.length - 1].ch === ' ')) continue;
        chars.push({ ch: isSpace ? ' ' : n.data[i], style });
        prev = r;
      }
    }
    while (chars.length && /\s/.test(chars[chars.length - 1].ch)) chars.pop();

    // 같은 스타일 문자 묶기
    const runs = [];
    for (const c of chars) {
      const key = JSON.stringify(c.style);
      const last = runs[runs.length - 1];
      if (last && last.key === key) last.length += c.ch.length;
      else runs.push({ key, length: c.ch.length, style: c.style });
    }
    runs.forEach((r) => delete r.key);

    // 첫 줄 기준선(baseline) 측정
    const marker = document.createElement('span');
    marker.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline;';
    el.insertBefore(marker, el.firstChild);
    const baseline = marker.getBoundingClientRect().bottom + window.scrollY;
    marker.remove();

    const size = PX(cs.fontSize);
    return {
      text: chars.map((c) => c.ch).join(''),
      runs,
      align: { start: 'left', end: 'right', justify: 'left' }[cs.textAlign] || cs.textAlign,
      lineHeight: cs.lineHeight === 'normal' ? size * 1.45 : PX(cs.lineHeight),
      baseline,
      padding: { top: PX(cs.paddingTop) + PX(cs.borderTopWidth), left: PX(cs.paddingLeft) + PX(cs.borderLeftWidth), right: PX(cs.paddingRight) + PX(cs.borderRightWidth) },
    };
  }

  let uid = 0;
  const sections = [...document.querySelectorAll('[data-section]')].map((sec) => {
    const sy = docTop(sec);
    const sx = docLeft(sec);
    const layers = [...sec.querySelectorAll('[data-layer]')].map((el) => {
      const id = `L${++uid}`;
      el.setAttribute('data-layer-id', id);
      const r = el.getBoundingClientRect();
      const kind = el.dataset.kind || 'image';
      // 부모 레이어(그룹 구조용)
      const parentEl = el.parentElement.closest('[data-layer]');
      const layer = {
        id,
        name: el.dataset.layer,
        kind,
        parent: parentEl && sec.contains(parentEl) ? parentEl.getAttribute('data-layer-id') : null,
        x: r.left + window.scrollX,
        y: r.top + window.scrollY,
        w: r.width,
        h: r.height,
      };
      if (kind === 'text') layer.text = extractText(el);
      return layer;
    });
    return { id: sec.dataset.section, x: sx, y: sy, w: sec.offsetWidth, h: sec.offsetHeight, layers };
  });
  return { width: document.querySelector('.page').offsetWidth, height: document.querySelector('.page').offsetHeight, sections };
}

// ── PNG 유틸 ───────────────────────────────────────
const decodePng = (buf) => {
  const png = PNG.sync.read(buf);
  return { width: png.width, height: png.height, data: new Uint8ClampedArray(png.data.buffer, png.data.byteOffset, png.data.length) };
};

async function soloShot(page, id) {
  await page.evaluate((id) => {
    document.documentElement.classList.add('x-solo');
    document.querySelector(`[data-layer-id="${id}"]`).classList.add('x-target');
  }, id);
  const buf = await page.locator(`[data-layer-id="${id}"]`).screenshot({ omitBackground: true, animations: 'disabled' });
  await page.evaluate((id) => {
    document.documentElement.classList.remove('x-solo');
    document.querySelector(`[data-layer-id="${id}"]`).classList.remove('x-target');
  }, id);
  return buf;
}

async function sectionBgShot(page, secId) {
  await page.evaluate(() => document.documentElement.classList.add('x-bg'));
  const buf = await page.locator(`[data-section="${secId}"]`).screenshot({ animations: 'disabled' });
  await page.evaluate(() => document.documentElement.classList.remove('x-bg'));
  return buf;
}

// ── 폰트 이름 매핑 ───────────────────────────────────
const WEIGHT_STYLE = { 100: 'Thin', 200: 'ExtraLight', 300: 'Light', 400: 'Regular', 500: 'Medium', 600: 'SemiBold', 700: 'Bold', 800: 'ExtraBold', 900: 'Black' };
const weightStyle = (w) => WEIGHT_STYLE[Math.min(900, Math.max(100, Math.round(w / 100) * 100))];
const psFontName = (familyName, weight) => `${familyName.replace(/\s+/g, '')}-${weightStyle(weight)}`;

// ── 메인 ────────────────────────────────────────────
export async function exportAll({ htmlPath, outDir, scale = 1, psd = true, figma = true, log = console.log }) {
  const browser = await launchBrowser();
  try {
    const url = 'file://' + path.resolve(htmlPath);
    const width = 860; // 초기 뷰포트 — 실제 폭은 .page 너비로 맞춘다

    // 1) PNG: 업로드용 (scale 배율)
    const ctxPng = await browser.newContext({ viewport: { width, height: 1200 }, deviceScaleFactor: scale });
    const pagePng = await ctxPng.newPage();
    await pagePng.goto(url, { waitUntil: 'load' });
    await pagePng.evaluate(() => document.fonts.ready);
    const fontOk = await pagePng.evaluate(() => document.fonts.check('700 20px Pretendard'));
    if (!fontOk) log('⚠️  Pretendard 폰트 로드 실패 — 시스템 폰트로 렌더링됨');
    const pageW = await pagePng.evaluate(() => document.querySelector('.page').offsetWidth);
    await pagePng.setViewportSize({ width: pageW, height: 1200 });

    fs.mkdirSync(path.join(outDir, 'sections'), { recursive: true });
    await pagePng.locator('.page').screenshot({ path: path.join(outDir, 'detail-full.png'), animations: 'disabled' });
    const secIds = await pagePng.$$eval('[data-section]', (els) => els.map((e) => e.dataset.section));
    for (const id of secIds) await pagePng.locator(`[data-section="${id}"]`).screenshot({ path: path.join(outDir, 'sections', `${id}.png`), animations: 'disabled' });
    await ctxPng.close();
    log(`✅ PNG: detail-full.png + sections/ (${secIds.length}장, ${scale}x)`);
    if (!psd && !figma) return;

    // 2) 레이어 추출 (1x 좌표)
    const ctx = await browser.newContext({ viewport: { width: pageW, height: 1200 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const layout = await page.evaluate(extractLayout);
    const page0 = await page.evaluate(() => {
      const r = document.querySelector('.page').getBoundingClientRect();
      return { x: r.left + window.scrollX, y: r.top + window.scrollY };
    });

    const shots = new Map(); // layerId → png buffer
    const bgShots = new Map();
    for (const sec of layout.sections) {
      bgShots.set(sec.id, await sectionBgShot(page, sec.id));
      for (const l of sec.layers) shots.set(l.id, await soloShot(page, l.id));
    }
    await ctx.close();

    // 페이지 원점 기준 좌표로 정규화
    for (const sec of layout.sections) {
      sec.x -= page0.x; sec.y -= page0.y;
      for (const l of sec.layers) {
        l.x -= page0.x; l.y -= page0.y;
        if (l.text) l.text.baseline -= page0.y;
      }
    }

    if (psd) {
      const psdPath = path.join(outDir, 'detail.psd');
      fs.writeFileSync(psdPath, buildPsd(layout, shots, bgShots));
      if (layout.height > 30000) log('⚠️  높이 30,000px 초과 — Photoshop에서 PSB로 저장하거나 섹션을 나누세요');
      log('✅ PSD: detail.psd (섹션별 그룹, 텍스트 레이어 편집 가능)');
    }
    if (figma) {
      fs.writeFileSync(path.join(outDir, 'figma.json'), JSON.stringify(buildFigma(layout, shots, bgShots)));
      log('✅ Figma: figma.json (figma-plugin으로 가져오기)');
    }
    fs.writeFileSync(path.join(outDir, 'layout.json'), JSON.stringify(layout, null, 1));
  } finally {
    await browser.close();
  }
}

// ── PSD ─────────────────────────────────────────────
function buildPsd(layout, shots, bgShots) {
  const W = Math.round(layout.width);
  const H = Math.round(layout.height);

  const makeLayer = (l) => {
    const img = decodePng(shots.get(l.id));
    const base = { name: l.name, left: Math.round(l.x), top: Math.round(l.y), imageData: img };
    if (l.kind !== 'text' || !l.text?.text) return base;
    const t = l.text;
    const first = t.runs[0]?.style || {};
    const colorOf = (c) => ({ r: c.r, g: c.g, b: c.b });
    const contentLeft = l.x + t.padding.left;
    const contentRight = l.x + l.w - t.padding.right;
    const x = t.align === 'center' ? (contentLeft + contentRight) / 2 : t.align === 'right' ? contentRight : contentLeft;
    return {
      ...base,
      text: {
        text: t.text,
        transform: [1, 0, 0, 1, x, t.baseline],
        antiAlias: 'smooth',
        style: {
          font: { name: psFontName(first.family, first.weight) },
          fontSize: first.size,
          autoLeading: false,
          leading: t.lineHeight,
          fillColor: colorOf(first.color),
        },
        styleRuns: t.runs.map((r) => ({
          length: r.length,
          style: {
            font: { name: psFontName(r.style.family, r.style.weight) },
            fontSize: r.style.size,
            autoLeading: false,
            leading: t.lineHeight,
            tracking: Math.round((r.style.letterSpacing / r.style.size) * 1000),
            fillColor: colorOf(r.style.color),
          },
        })),
        paragraphStyle: { justification: t.align === 'center' ? 'center' : t.align === 'right' ? 'right' : 'left' },
      },
    };
  };

  const children = layout.sections.map((sec) => {
    const bg = decodePng(bgShots.get(sec.id));
    return {
      name: sec.id,
      opened: false,
      // ag-psd: 배열 앞쪽이 아래 레이어. DOM 순서 = 부모 → 자식이라 그대로 쌓으면 된다
      children: [{ name: '배경', left: Math.round(sec.x), top: Math.round(sec.y), imageData: bg }, ...sec.layers.map(makeLayer)],
    };
  });

  // 합성 이미지(미리보기) = 전체 페이지를 섹션 배경+레이어로 합성하는 대신 섹션 스크린샷을 이어 붙인다
  const composite = new Uint8ClampedArray(W * H * 4);
  for (const sec of layout.sections) {
    const full = decodePng(bgShots.get(sec.id));
    blit(composite, W, H, full, Math.round(sec.x), Math.round(sec.y));
    for (const l of sec.layers) blit(composite, W, H, decodePng(shots.get(l.id)), Math.round(l.x), Math.round(l.y));
  }
  return writePsdBuffer({ width: W, height: H, imageData: { width: W, height: H, data: composite }, children }, { generateThumbnail: false });
}

// 알파 합성
function blit(dst, W, H, src, ox, oy) {
  for (let y = 0; y < src.height; y++) {
    const dy = y + oy;
    if (dy < 0 || dy >= H) continue;
    for (let x = 0; x < src.width; x++) {
      const dx = x + ox;
      if (dx < 0 || dx >= W) continue;
      const si = (y * src.width + x) * 4;
      const di = (dy * W + dx) * 4;
      const a = src.data[si + 3] / 255;
      if (a === 0) continue;
      const da = dst[di + 3] / 255;
      const oa = a + da * (1 - a);
      for (let c = 0; c < 3; c++) dst[di + c] = (src.data[si + c] * a + dst[di + c] * da * (1 - a)) / oa;
      dst[di + 3] = oa * 255;
    }
  }
}

// ── Figma ───────────────────────────────────────────
function buildFigma(layout, shots, bgShots) {
  const b64 = (buf) => buf.toString('base64');
  return {
    version: 1,
    name: '상세페이지',
    width: layout.width,
    height: layout.height,
    sections: layout.sections.map((sec) => ({
      name: sec.id,
      x: sec.x,
      y: sec.y,
      w: sec.w,
      h: sec.h,
      background: b64(bgShots.get(sec.id)),
      layers: sec.layers.map((l) => {
        const node = { name: l.name, kind: l.kind, x: l.x - sec.x, y: l.y - sec.y, w: l.w, h: l.h };
        if (l.kind === 'text' && l.text?.text) {
          const t = l.text;
          node.text = {
            characters: t.text,
            align: t.align,
            lineHeight: t.lineHeight,
            padding: t.padding,
            runs: t.runs.map((r) => ({
              length: r.length,
              family: r.style.family,
              style: weightStyle(r.style.weight),
              weight: r.style.weight,
              size: r.style.size,
              color: r.style.color,
              letterSpacing: r.style.letterSpacing,
            })),
          };
        } else {
          node.image = b64(shots.get(l.id));
        }
        return node;
      }),
    })),
  };
}
