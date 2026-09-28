# AGENTS.md

이 저장소는 **건강기능식품 상세페이지 자동화 스킬**입니다. Codex와 Claude Code 모두 같은 스킬 폴더를 씁니다.

## 상세페이지 작업 요청을 받으면
"상세페이지", "건기식 상세", "영양제 상세", "상세 기획안" 같은 요청이면 **먼저 `.claude/skills/health-detail-page/SKILL.md`를 읽고 그 워크플로를 그대로 따른다.**
참고 문서는 같은 폴더의 `references/`에 있다(광고 규정, 섹션 구성, 이미지·인물 프롬프트 규칙, content.json 스키마).

## 명령
```bash
cd .claude/skills/health-detail-page/scripts && npm install          # 최초 1회
node .claude/skills/health-detail-page/scripts/new.mjs projects/<slug>    # 새 프로젝트
node .claude/skills/health-detail-page/scripts/build.mjs projects/<slug>  # lint → HTML → PNG → PSD → Figma
node .claude/skills/health-detail-page/scripts/lint.mjs projects/<slug>   # 광고 표현 점검만
```

## 규칙
- 제품 프로젝트는 `projects/<slug>/`에 만든다. `projects/sample-omega3/`는 전체 예시다.
- 기능성 문구, 함량, 인증 사실은 사용자가 준 자료에만 근거한다. 지어내지 않는다.
- 기획안(plan.md)을 사용자가 승인하기 전에는 빌드하지 않는다.
