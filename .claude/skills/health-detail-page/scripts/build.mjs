// 사용법: node build.mjs <프로젝트 폴더> [--html-only] [--no-psd] [--no-figma] [--scale=2] [--force]
//   <프로젝트 폴더>/content.json 을 읽어 <프로젝트 폴더>/out/ 에 결과물을 만든다.
import fs from 'node:fs';
import path from 'node:path';
import { renderHtml } from './render.mjs';
import { lintContent, formatReport } from './lint.mjs';

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const opt = (name, def) => args.find((a) => a.startsWith(`--${name}=`))?.split('=')[1] ?? def;
const projectDir = path.resolve(args.find((a) => !a.startsWith('--')) || '.');
const contentPath = path.join(projectDir, 'content.json');

if (!fs.existsSync(contentPath)) {
  console.error(`content.json 없음: ${contentPath}`);
  process.exit(1);
}
const content = JSON.parse(fs.readFileSync(contentPath, 'utf8'));
const outDir = path.join(projectDir, 'out');
fs.mkdirSync(outDir, { recursive: true });

// 1) 광고 표현 점검
const lint = lintContent(content);
fs.writeFileSync(path.join(outDir, 'compliance-report.md'), formatReport(lint, content.meta?.title));
console.log(`🔎 광고 표현 점검: 수정 필수 ${lint.errors.length} / 확인 필요 ${lint.warnings.length} → out/compliance-report.md`);
if (lint.errors.length && !flag('force')) {
  for (const e of lint.errors) console.log(`   ✖ ${e.word ?? ''} — ${e.reason} (${e.where})`);
  console.error('수정 필수 항목이 있어 중단합니다. 고친 뒤 다시 실행하거나 시안 확인용이면 --force');
  process.exit(1);
}

// 2) HTML (폰트는 out/fonts/ 로 복사해 오프라인에서도 동일하게 보이게)
const fonts = {
  'PretendardVariable.woff2': './node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2',
  'PlayfairDisplay.woff2': './node_modules/@fontsource-variable/playfair-display/files/playfair-display-latin-wght-normal.woff2',
  'PlayfairDisplay-Italic.woff2': './node_modules/@fontsource-variable/playfair-display/files/playfair-display-latin-wght-italic.woff2',
};
fs.mkdirSync(path.join(outDir, 'fonts'), { recursive: true });
for (const [name, src] of Object.entries(fonts)) fs.copyFileSync(new URL(src, import.meta.url), path.join(outDir, 'fonts', name));
const htmlPath = path.join(outDir, 'index.html');
fs.writeFileSync(
  htmlPath,
  renderHtml(content, {
    projectDir,
    fontUrl: 'fonts/PretendardVariable.woff2',
    displayFontUrl: 'fonts/PlayfairDisplay.woff2',
    displayItalicUrl: 'fonts/PlayfairDisplay-Italic.woff2',
  }),
);
console.log('✅ HTML: out/index.html');
if (flag('html-only')) process.exit(0);

// 3) PNG / PSD / Figma
const { exportAll } = await import('./export.mjs');
await exportAll({
  htmlPath,
  outDir,
  scale: Number(opt('scale', content.meta?.scale || 1)),
  psd: !flag('no-psd'),
  figma: !flag('no-figma'),
});
console.log(`📁 ${path.relative(process.cwd(), outDir) || outDir}`);
