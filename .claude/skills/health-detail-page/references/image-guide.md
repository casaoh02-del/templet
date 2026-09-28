# 이미지 가이드

## 1. 순서: 보유 사진 → 프롬프트 → 생성

1. **보유 사진 확인**: 아래 체크리스트를 사용자에게 보여주고 가진 파일을 받는다. 파일명은 `images/<slot>.png|jpg`로 맞춘다.
2. **부족한 컷**: slot별 프롬프트를 `image-prompts.md`에 쓴다.
3. **생성 도구가 있으면**(이미지 생성 MCP, Codex/Claude 이미지 도구 등) 사용자 확인 후 생성해 `images/<slot>.png`로 저장한다. 없으면 프롬프트만 전달하고 자리표시자로 빌드한다.

> 제품 자체(패키지, 라벨, 캡슐 병)는 **실물 사진을 쓴다.** AI로 만든 패키지는 실제 제품과 달라서 표시·광고 문제가 될 수 있다. AI 생성은 배경, 원료, 라이프스타일, 분위기 컷에만 쓴다.

## 2. 사진 체크리스트

| slot 예시 | 컷 | 권장 사양 | 우선순위 |
|---|---|---|---|
| `hero` | 제품(단상자+용기) 정면 누끼 | PNG 투명 배경, 2000px 이상 | 필수 |
| `package-side` | 라벨·영양기능정보 면 | 글자가 읽히는 해상도 | 필수 |
| `capsule` | 제형(캡슐·정제·분말) 클로즈업 | 매크로 | 권장 |
| `ing-*` | 원료 이미지 | 정사각 | 권장 |
| `q-*` | GMP 지정서, 시험성적서, 제조 시설 | 문서 스캔 | 권장 |
| `lifestyle`, `cta` | 섭취 장면, 식탁·사무실 연출컷 | 가로 4:3 | 선택 |

## 3. 프롬프트 작성 형식 (`image-prompts.md`)

```markdown
## hero-bg — 히어로 배경 (제품 누끼 합성용)
- 용도/비율: 히어로 배경, 1:1, 1720×1720
- 대상 모델: GPT Image
- Prompt: ...
- Negative: ... (모델별 규칙에 따라 필드 분리)
```

### 제품·원료·배경 컷 기본 문구
`clean commercial product photography, soft diffused studio light, gentle shadows, balanced exposure, clean natural color grading, minimal composition, generous negative space for text`

- 텍스트나 로고는 생성하지 않는다(`no text, no logo, no label` / 부정 필드). 카피는 HTML에서 얹는다.
- 브랜드 컬러를 배경 톤에 반영한다(예: `soft pale teal background (#EEF4F5)`).
- 의료 연상 요소(병원, 가운, 주사기, 알약 더미)는 넣지 않는다.

## 4. 인물 컷 프롬프트 규칙 (필수 적용)

사람 이미지에서는 **분위기보다 얼굴의 깨끗함을 우선**한다. 노이즈는 긍정 서술로 먼저 막고, 그다음 위험 단어를 빼고, 부정문은 최소한만 쓴다.

**우선순위**: ① 얼굴과 인물의 일관성 ② 피부·머리카락의 깨끗한 표현 ③ 자연스러운 조명과 색감 ④ 구도와 포즈 ⑤ 영화적 질감(배경에만)

### 기본 품질 문구 (인물용 표준)
```
Photorealistic human subject, clean digital cinema quality, natural facial proportions, clear expressive eyes, smooth natural skin texture, realistic hair, soft tonal transitions, controlled highlights, balanced exposure, low-noise image, natural skin tones.
```
- 피부는 플라스틱처럼 보이면 안 되지만, 모공과 결을 과장하지도 않는다: `sharp eyes and facial features, softly rendered skin texture`
- 조명: `soft diffused key light, gentle fill light, controlled rim light, smooth highlight roll-off, clean shadows`
  - 역광: `soft controlled backlight, subtle clean rim light, no blown highlights`
- 색보정: `clean natural color grading, moderate contrast, controlled saturation, smooth skin tones`
  - 강한 컬러 씬: `vibrant environment colors, but natural and clean skin tones`
- 시네마틱 질감이 필요하면 배경에만: `the subject remains clean and noise-free, while only the background carries a very subtle cinematic texture`

### 본문에 쓰지 않는 단어 (부정형으로도 금지)
- film grain, grainy texture, gritty, analog noise, heavy cinematic grain
- ultra-detailed pores, extreme skin detail, razor-sharp face
- 8K, hyper-realistic, HDR, high contrast 같은 품질 강조어를 겹쳐 쓰지 않는다
- intense lens flare, explosive bloom, extreme backlight, crushed shadows

품질 표현은 `photorealistic, clean digital cinema quality, natural facial detail` 정도로 단순하게 쓴다.

### 부정문: 3~4개로 압축
`no film grain, no digital noise, clean noise-free face and skin`
얼굴이 중요한 컷에만 추가: `no noise around the eyes, hairline, or jaw`

### 모델별 분기
| 모델 | 부정 내용 위치 |
|---|---|
| GPT Image | 압축 부정문을 프롬프트 **끝**에 인라인으로 쓴다 |
| Kling / Seedance | 부정 내용은 **네거티브 프롬프트 필드**에 쓰고, 본문에는 긍정 서술만 쓴다 |
| Midjourney / SD 계열 | 본문에 grain/noise 관련 단어 **절대 금지**. `--no grain, noise, oversharpening` 또는 negative 필드만 쓴다 |

### 반복 수정 시 (세대 손실 방지)
기존 질감을 유지하라는 지시보다 재구성 지시를 우선한다:
`preserve the original clean facial structure, remove accumulated noise and generation artifacts, do not reinterpret noise as skin texture — clean reconstruction of the face, not a sharpened copy`

### 건기식 인물 컷 연출
- 일상의 건강한 루틴: 아침 식탁, 사무실 책상, 산책 후. 밝고 차분한 톤.
- 제품을 쥐거나 물과 함께 섭취하는 동작. 제품은 실물 사진을 합성하거나 라벨이 보이지 않는 각도로 연출한다.
- 의사·약사 복장, 병원 배경, 신체 비포/애프터는 쓰지 않는다(compliance.md 4항).

### 예시 — 라이프스타일 컷 (GPT Image)
```
A woman in her 40s sitting at a bright kitchen table in the morning, holding a glass of water and smiling softly, calm healthy daily routine. Photorealistic human subject, clean digital cinema quality, natural facial proportions, clear expressive eyes, smooth natural skin texture, realistic hair, soft tonal transitions, controlled highlights, balanced exposure, low-noise image, natural skin tones. Soft diffused key light from a window, gentle fill light, clean shadows, clean natural color grading, moderate contrast. Pale teal and warm white palette, generous empty space on the left for text. No text, no logo. No film grain, no digital noise, clean noise-free face and skin.
```
