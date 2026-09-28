// 사용법: node new.mjs <프로젝트 폴더>   예) node new.mjs projects/vitamin-d
// brief.md, plan.md, image-prompts.md, content.json(샘플 구조), images/ 를 만든다.
import fs from 'node:fs';
import path from 'node:path';

const target = process.argv[2];
if (!target) {
  console.error('사용법: node new.mjs <프로젝트 폴더>');
  process.exit(1);
}
const dir = path.resolve(target);
const slug = path.basename(dir);
const tpl = new URL('../templates/', import.meta.url);

fs.mkdirSync(path.join(dir, 'images'), { recursive: true });

const write = (name, text) => {
  const file = path.join(dir, name);
  if (fs.existsSync(file)) return console.log(`· 건너뜀 (이미 있음): ${name}`);
  fs.writeFileSync(file, text.replaceAll('{{slug}}', slug));
  console.log(`✅ ${name}`);
};

write('brief.md', fs.readFileSync(new URL('brief.md', tpl), 'utf8'));
write('plan.md', fs.readFileSync(new URL('plan.md', tpl), 'utf8'));
write('image-prompts.md', `# 이미지 프롬프트 — ${slug}\n\n> 규칙: <skill>/references/image-guide.md (인물 컷은 인물 프롬프트 규칙 필수)\n`);
write('content.json', fs.readFileSync(new URL('content.starter.json', tpl), 'utf8'));
console.log(`\n다음: ${path.relative(process.cwd(), dir)}/brief.md 채우기 → plan.md 기획안 → content.json → build.mjs`);
