# content.json 스키마

```jsonc
{
  "meta":  { "title": "문서 제목", "width": 860, "scale": 1 },   // scale 2 = 고해상도 PNG
  "theme": { "primary": "#0F4C5C", "accent": "#F2B544", "soft": "#EEF4F5", "dark": "#0B2027",
             "bg": "#FFFFFF", "text": "#1C2421", "muted": "#5F6B67", "font": "Pretendard" },
  "sections": [ { "type": "...", "tone": "light|soft|primary|dark", ... } ]
}
```

**텍스트 규칙**: `**강조**` → 포인트 컬러, `\n` → 줄바꿈. HTML 태그는 이스케이프된다.

**이미지 값**: `"images/hero.png"` 또는 `{ "src": "images/hero.png", "slot": "hero", "desc": "촬영/생성 메모" }`.
파일이 없으면 slot과 desc가 적힌 자리표시자가 그려진다.

## 섹션 타입

| type | 필드 |
|---|---|
| `hero` | eyebrow, title, subtitle, image, badges[] |
| `pain` | eyebrow, title, items[] (문장), image, closing |
| `solution` | eyebrow, title, body, image |
| `function` | eyebrow(기본 "식약처 인정 기능성"), title, claims[{ingredient, text}], note |
| `ingredient` | eyebrow, title, body, items[{name, amount, desc, image}] |
| `numbers` | eyebrow, title, items[{value, unit, label}], note |
| `compare` | eyebrow, title, columns[우리, 비교대상], rows[[항목, 우리값, 비교값]], note |
| `quality` | eyebrow, title, items[{title, desc, image}] (2열) |
| `howto` | eyebrow, title, image, steps[{title, desc}] |
| `target` | eyebrow, title, items[] (2열) |
| `faq` | eyebrow, title, items[{q, a}] |
| `cta` | image, eyebrow, title, body |
| `info` | title, rows[[항목, 내용]] — 상품정보제공고시 |
| `caution` | title, items[], reviewNumber — "의약품이 아닙니다" 문구는 자동 삽입 |
| `image` | image, name — 따로 디자인한 통이미지 삽입 |

기본 톤: hero·target·caution=`soft`, function·cta=`primary`, numbers=`dark`, 나머지=`light`.

## 새 섹션 타입 추가
1. `scripts/render.mjs`의 `sectionRenderers`에 함수를 추가한다. 텍스트는 `t(tag, class, 레이어이름, 값)`, 이미지는 `img(값, 레이어이름, class)`로 만든다.
2. 카드나 배지처럼 PSD/Figma에서 따로 움직일 도형은 `data-layer="이름" data-kind="shape"`로 감싼다.
3. `scripts/theme.css`에 스타일을 추가한다.
