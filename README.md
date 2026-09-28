# templet — 건강기능식품 상세페이지 자동화 스킬

Claude Code와 Codex에서 쓰는 **건기식 상세페이지 제작 스킬**입니다.
제품 정보를 넣으면 기획안부터 업로드용 이미지, 편집 가능한 디자인 파일까지 만듭니다.

```
브리프(제품 정보·보유 사진) → 기획안 → 이미지(보유 사진 / 프롬프트 / 생성)
  → content.json → [광고 표현 점검] → HTML → PNG → PSD(Photoshop) + Figma
```

| 결과물 | 파일 | 용도 |
|---|---|---|
| 기획안 | `plan.md` | 섹션 구성, 카피, 이미지 계획 (승인 후 제작) |
| 이미지 프롬프트 | `image-prompts.md` | 부족한 컷의 AI 생성 프롬프트 |
| HTML | `out/index.html` | 자사몰 삽입, 브라우저 미리보기 |
| PNG | `out/detail-full.png`, `out/sections/*.png` | 스마트스토어·쿠팡 업로드 |
| PSD | `out/detail.psd` | Photoshop 편집 (섹션별 그룹, 텍스트 레이어 편집 가능) |
| Figma | `out/figma.json` + 플러그인 | Figma 편집 (섹션별 프레임, 텍스트 편집 가능) |
| 점검 리포트 | `out/compliance-report.md` | 금지·주의 광고 표현 목록 |

## 설치

필요한 것: Node.js 18 이상.

```bash
git clone https://github.com/casaoh02-del/templet.git
cd templet/.claude/skills/health-detail-page/scripts
npm install
npx playwright install chromium   # PNG/PSD 변환용 브라우저 (최초 1회)
```

### 이 저장소 안에서 쓰기
- **Claude Code**: 저장소 폴더에서 `claude`를 실행하면 스킬이 자동으로 인식됩니다.
- **Codex**: 저장소 폴더에서 `codex`를 실행하면 `AGENTS.md`가 스킬을 안내합니다.

### 다른 폴더에서도 쓰기 (전역 설치)
```bash
./install.sh          # Claude Code(~/.claude/skills) + Codex(~/.codex/skills)
./install.sh claude   # Claude Code만
./install.sh codex    # Codex만
```
Windows에서는 `.claude/skills/health-detail-page` 폴더를 `%USERPROFILE%\.claude\skills\`에 복사한 뒤 그 안의 `scripts`에서 `npm install`을 실행하세요.
Codex 버전에 따라 스킬 폴더 위치가 다를 수 있습니다. 전역 설치가 인식되지 않으면 저장소 안에서 쓰는 방식(AGENTS.md)을 쓰세요.

## 사용법

Claude Code나 Codex에 이렇게 요청하면 됩니다.

> 비타민D 건기식 상세페이지 만들어줘. 인정서랑 제품 사진 첨부할게.

에이전트는 다음 순서로 진행합니다.
1. `projects/<제품>/` 폴더와 브리프 질문지를 만들고, 기능성 인정 문구, 함량, 고시 정보, **보유 사진**을 묻습니다.
2. 기획안(`plan.md`)을 쓰고 승인을 받습니다.
3. 없는 사진은 프롬프트를 쓰거나, 이미지 생성 도구가 연결되어 있으면 생성합니다.
4. 빌드하고 광고 표현 점검 결과를 알려줍니다.

직접 실행할 수도 있습니다.
```bash
S=.claude/skills/health-detail-page/scripts
node $S/new.mjs projects/vitamin-d               # 새 프로젝트
node $S/build.mjs projects/vitamin-d             # 전체 빌드
node $S/build.mjs projects/vitamin-d --html-only # 빠른 미리보기
node $S/build.mjs projects/vitamin-d --scale=2   # 고해상도 PNG
node $S/lint.mjs projects/vitamin-d              # 광고 표현 점검만
```

샘플: `node $S/build.mjs projects/sample-omega3` (가상의 rTG 오메가3 제품)

## 편집 파일 여는 법

**Photoshop (PSD)**
1. [Pretendard](https://github.com/orioncactus/pretendard)와 [Playfair Display](https://fonts.google.com/specimen/Playfair+Display) 폰트를 설치합니다(모두 무료).
2. `out/detail.psd`를 열고 "텍스트 레이어를 업데이트하시겠습니까?" 창에서 **업데이트**를 누릅니다.
3. 섹션별 그룹 안에 배경, 이미지, 도형, 텍스트 레이어가 나뉘어 있습니다.

**Figma**
1. Figma 데스크톱 앱에서 Plugins → Development → **Import plugin from manifest…**를 누릅니다.
2. `.claude/skills/health-detail-page/figma-plugin/manifest.json`을 선택합니다(최초 1회).
3. Plugins → Development → **상세페이지 가져오기**를 실행하고 `out/figma.json`을 선택합니다.
4. Pretendard가 설치되어 있지 않으면 Noto Sans KR로 대체됩니다.

## 광고 표현 점검에 대해
빌드할 때 질병 치료·예방 표현, 의약품 용어, 인증 오표기, 체험기, 최상급 표현 등을 자동으로 찾고, 상품정보제공고시 필수 항목이 빠졌는지 확인합니다.
**수정 필수** 항목이 있으면 빌드가 멈춥니다. 이 점검은 1차 필터일 뿐이므로 게재 전에 반드시 **한국건강기능식품협회 표시·광고 자율심의**를 받으세요.

## 폴더 구조
```
.claude/skills/health-detail-page/
  SKILL.md               스킬 워크플로 (에이전트가 읽음)
  references/            광고 규정, 섹션 가이드, 이미지·인물 프롬프트 규칙, 데이터 스키마
  templates/             브리프 질문지, 기획안 양식, content.json 스타터
  scripts/               new / build / lint / render / export, theme.css
  figma-plugin/          Figma 가져오기 플러그인
projects/<제품>/          제품별 작업 폴더 (out/은 git에서 제외)
AGENTS.md, CLAUDE.md     Codex / Claude Code 진입점
install.sh               전역 설치
```

## 디자인 바꾸기
- 색상: `content.json`의 `theme`
- 섹션별 배경 톤: 섹션에 `"tone": "light|soft|primary|dark"`
- 레이아웃·폰트 크기: `scripts/theme.css`
- 새 섹션 종류: `scripts/render.mjs` (references/content-schema.md 참고)
