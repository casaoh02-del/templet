---
name: health-detail-page
description: 건강기능식품(건기식·영양제) 상세페이지를 기획안부터 HTML, PNG, 편집 가능한 PSD·Figma 파일까지 만드는 워크플로. "상세페이지 만들어줘", "건기식 상세페이지", "영양제 상세", "스마트스토어/쿠팡 상세 이미지", "상세페이지 기획안" 요청에 사용한다. 광고 표현 심의 기준(식품표시광고법) 점검이 포함된다.
---

# 건강기능식품 상세페이지 스킬

한 제품 = 한 프로젝트 폴더. 모든 산출물은 `projects/<slug>/` 안에 만든다.

```
projects/<slug>/
  brief.md           ← 1. 제품 정보 인테이크
  plan.md            ← 2. 기획안 (사용자 승인 필요)
  image-prompts.md   ← 3. 부족한 이미지의 생성 프롬프트
  images/            ← 3. 보유 사진 / 생성 이미지 (파일명 = slot 이름)
  content.json       ← 4. 기획안을 구조화한 데이터 (빌드 입력)
  out/               ← 5. index.html, detail-full.png, sections/*.png, detail.psd, figma.json, compliance-report.md
```

`<skill>` = 이 SKILL.md가 있는 폴더. 스크립트는 `<skill>/scripts`에 있고 처음 한 번 `npm install`이 필요하다.

## 진행 순서

각 단계 끝에서 사용자에게 결과를 보여주고, **기획안 승인 전에는 빌드하지 않는다.**

### 1. 인테이크 — 제품 정보와 보유 사진 받기
1. `node <skill>/scripts/new.mjs projects/<slug>`로 폴더와 템플릿을 만든다.
2. `brief.md`의 질문으로 정보를 모은다. 사용자가 준 자료(인정서, 원료 스펙, 기존 상세, 경쟁사 링크)가 있으면 먼저 읽고 채울 수 있는 칸은 채운 뒤 **빈칸만** 묻는다.
3. 반드시 받아야 하는 정보:
   - **기능성 내용 원문**: 식약처 고시형 원료 또는 개별인정형 인정서의 문구 그대로. 추측해서 쓰지 않는다.
   - 원료명·함량, 1일 섭취량, 섭취 방법, 섭취 시 주의사항
   - 상품정보제공고시 항목(제조원, 소비기한, 내용량 등), 심의필 번호(있으면)
4. **사진은 먼저 보유 여부를 묻는다.** `brief.md`의 사진 체크리스트(제품 누끼, 단상자, 제형 클로즈업, 원료, 인증서, 라이프스타일 등)를 보여주고 가진 파일을 `images/`에 넣어 달라고 한다.

### 2. 기획안 — `plan.md`
`templates/plan.md` 형식으로 쓴다. 섹션 구성과 카피 원칙은 [references/section-guide.md](references/section-guide.md)를 따른다.
- 한 줄 컨셉, 타깃, 핵심 메시지 3개
- 섹션표: 순서 · 섹션 타입 · 목적 · 헤드카피 · 서브카피 · 비주얼(slot 이름, 보유/생성 구분)
- 카피를 쓸 때 [references/compliance.md](references/compliance.md)의 금지·주의 표현을 적용한다. 기능성 문구는 원문 그대로 쓴다.
- 사용자 승인을 받고 수정사항을 반영한다.

### 3. 이미지 — 보유 사진 우선, 부족분은 프롬프트 또는 생성
[references/image-guide.md](references/image-guide.md)를 따른다.
- 보유 사진은 `images/<slot>.png|jpg`로 이름을 맞춘다.
- 없는 컷은 `image-prompts.md`에 slot별 프롬프트를 쓴다. 인물이 나오는 컷은 image-guide의 **인물 프롬프트 규칙**(깨끗한 피부 표현, 위험 단어 제외, 모델별 부정문 처리)을 반드시 따른다.
- 세션에 이미지 생성 도구(MCP 등)가 있으면 사용자 확인 후 생성해서 `images/<slot>.png`로 저장한다. 없으면 프롬프트만 넘기고 자리표시자로 빌드한다(자리표시자에 slot 이름이 표시됨).

### 4. 데이터 — `content.json`
승인된 기획안을 [references/content-schema.md](references/content-schema.md) 형식으로 옮긴다. `projects/sample-omega3/content.json`이 전체 예시다.
- `**강조**` = 포인트 컬러, `\n` = 줄바꿈. 줄바꿈은 디자인 의도대로 직접 넣는다(한 줄 12~16자 권장).
- 브랜드 컬러가 있으면 `theme`에 넣는다.

### 5. 빌드와 검수
```bash
node <skill>/scripts/build.mjs projects/<slug>            # lint → HTML → PNG → PSD → Figma JSON
node <skill>/scripts/build.mjs projects/<slug> --html-only # 카피 수정 중 빠른 미리보기
node <skill>/scripts/build.mjs projects/<slug> --scale=2   # 고해상도 PNG
```
- 빌드는 먼저 광고 표현 점검을 한다. **수정 필수** 항목이 있으면 중단된다. 카피를 고쳐 다시 빌드한다. 시안 확인용일 때만 `--force`를 쓴다.
- 빌드 뒤 `out/sections/*.png`를 직접 열어 보고 넘침, 어색한 줄바꿈, 빈 자리표시자를 확인한다.
- `out/compliance-report.md`의 **확인 필요** 항목을 사용자에게 요약해서 전달한다.

### 6. 전달
- **업로드용**: `out/sections/*.png`(섹션별) 또는 `out/detail-full.png`(한 장)
- **Photoshop**: `out/detail.psd`. 처음 열 때 "텍스트 레이어 업데이트" 창에서 **업데이트**를 누른다. 폰트는 Pretendard 설치 필요.
- **Figma**: `<skill>/figma-plugin`을 Figma 데스크톱 앱의 Plugins → Development → Import plugin from manifest로 등록하고 `out/figma.json`을 선택한다.
- 마지막 안내: 게재 전 **한국건강기능식품협회 표시·광고 자율심의**를 받고 심의필 번호를 `caution.reviewNumber`에 넣어 다시 빌드한다.

## 규칙
- 기능성 문구, 함량, 인증 사실은 사용자가 준 자료에만 근거한다. 없으면 묻는다. 지어내지 않는다.
- 질병명, 치료·예방, 체험기, 전문가 추천, 최상급 표현은 쓰지 않는다(상세는 compliance.md).
- 섹션 타입이 부족하면 `scripts/render.mjs`에 렌더러를, `scripts/theme.css`에 스타일을 추가한다. 편집 가능한 레이어로 내보낼 요소에는 `data-layer`와 `data-kind`(text/image/shape)를 붙인다.
