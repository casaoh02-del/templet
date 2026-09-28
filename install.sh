#!/usr/bin/env bash
# 스킬을 사용자 전역 폴더에 설치 → 어느 프로젝트에서든 Claude Code / Codex가 사용
# 사용법: ./install.sh            (Claude Code + Codex 둘 다)
#        ./install.sh claude     (Claude Code만)
#        ./install.sh codex      (Codex만)
set -euo pipefail

SKILL=health-detail-page
SRC="$(cd "$(dirname "$0")" && pwd)/.claude/skills/$SKILL"
TARGET="${1:-all}"

install_to() {
  local dest="$1/$SKILL"
  mkdir -p "$1"
  rm -rf "$dest"
  # node_modules는 복사하지 않고 설치 위치에서 새로 설치
  (cd "$SRC" && tar --exclude=node_modules -cf - .) | (mkdir -p "$dest" && cd "$dest" && tar -xf -)
  (cd "$dest/scripts" && npm install --no-audit --no-fund --silent)
  echo "✅ $dest"
}

case "$TARGET" in all|claude|codex) ;; *) echo "사용법: $0 [all|claude|codex]"; exit 1 ;; esac
if [ "$TARGET" = all ] || [ "$TARGET" = claude ]; then install_to "$HOME/.claude/skills"; fi
if [ "$TARGET" = all ] || [ "$TARGET" = codex ]; then install_to "${CODEX_HOME:-$HOME/.codex}/skills"; fi
