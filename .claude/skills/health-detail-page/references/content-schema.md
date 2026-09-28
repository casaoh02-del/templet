# content.json 스키마

```jsonc
{
  "meta":  { "title": "문서 제목", "width": 860, "scale": 1,     // scale 2 = 고해상도 PNG
             "productName": "제품명", "productSub": "함량 · 구성" },  // 사진이 없을 때 제품 목업에 표시
  "theme": { "primary": "#0F4C5C", "accent": "#F2B544", "soft": "#EEF4F5", "dark": "#0B2027",
             "bg": "#FFFFFF", "text": "#1C2421", "muted": "#5F6B67",
             "font": "Pretendard", "display": "Playfair Display" },  // display = 영문 세리프 포인트(키커·숫자)
  "sections": [ { "type": "...", "tone": "light|soft|primary|dark", ... } ]
}
```

**텍스트 규칙**: `**강조**` → 포인트 컬러, `\n` → 줄바꿈. HTML 태그는 이스케이프된다.

**이미지 값**: `"images/hero.png"` 또는 `{ "src": "images/hero.png", "slot": "hero", "desc": "촬영/생성 메모" }`.
파일이 없으면 slot과 desc가 적힌 자리표시자가 그려진다.

**모든 섹션 공통 필드**
- `kicker`: 영문 세리프 키커(예: "Functional Claims"). 섹션마다 기본값이 있다
- `bgWord`: 배경에 크게 깔리는 영문 워드마크(예: "Omega-3")
- `tone`: 배경 톤

**아이콘**: 목록 항목·배지·스텝·품질 카드·자리표시자에 `icon`을 지정할 수 있다.
check, shield, flask, leaf, drop, capsule, clock, box, sun, eye, fish, factory, cup, moon, monitor, utensils, run, sparkle, award, question, arrow
(예: `{ "text": "생선 섭취가 부족한 분", "icon": "fish" }`)

**사진이 없을 때**: hero·cta 이미지는 테마 색으로 그린 제품 목업, 나머지는 아이콘 자리표시자로 표시된다.

## 섹션 타입

| type | 필드 |
|---|---|
| `hero` | kicker, eyebrow, title, subtitle, image, badges[] (문자열 또는 {text, icon}) |
| `pain` | title, body, items[] (문자열 또는 {text, icon}), image, closing |
| `solution` | eyebrow, title, body, image |
| `function` | eyebrow(기본 "식약처 인정 기능성"), title, claims[{ingredient, text}], note |
| `ingredient` | eyebrow, title, body, items[{name, amount, desc, image}] |
| `numbers` | eyebrow, title, items[{value, unit, label}], note |
| `compare` | eyebrow, title, columns[우리, 비교대상], rows[[항목, 우리값, 비교값]], note |
| `quality` | title, items[{title, desc, icon 또는 image}] (2열) |
| `howto` | title, image, steps[{title, desc, icon}] |
| `target` | title, items[] (문자열 또는 {text, icon}, 2열) |
| `faq` | eyebrow, title, items[{q, a}] |
| `cta` | kicker, title, body, image |
| `info` | title, rows[[항목, 내용]] — 상품정보제공고시 |
| `caution` | title, items[], reviewNumber — "의약품이 아닙니다" 문구는 자동 삽입 |
| `image` | image, name — 따로 디자인한 통이미지 삽입 |

기본 톤: hero·numbers·cta=`dark`, function=`primary`, ingredient·target·caution=`soft`, 나머지=`light`.

## 새 섹션 타입 추가
1. `scripts/render.mjs`의 `sectionRenderers`에 함수를 추가한다. 텍스트는 `t(tag, class, 레이어이름, 값)`, 이미지는 `img(값, 레이어이름, class)`로 만든다.
2. 카드나 배지처럼 PSD/Figma에서 따로 움직일 도형은 `data-layer="이름" data-kind="shape"`로 감싼다.
3. `scripts/theme.css`에 스타일을 추가한다. 텍스트 레이어에는 배경색·그라데이션 글자를 쓰지 않는다(PSD에서 텍스트를 다시 그리면 사라짐). 장식은 data-layer 없는 별도 요소로 만든다.
