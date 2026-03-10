#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

BASE_REF="HEAD"
HEAD_REF="WORKTREE"

while [ $# -gt 0 ]; do
  case "$1" in
    --base)
      BASE_REF="$2"
      shift 2
      ;;
    --head)
      HEAD_REF="$2"
      shift 2
      ;;
    *)
      shift
      ;;
  esac
done

get_changed_files() {
  if [[ "$HEAD_REF" == "WORKTREE" ]]; then
    local tracked
    local untracked
    tracked=$(git -C "$REPO_ROOT" diff --name-only "$BASE_REF")
    untracked=$(git -C "$REPO_ROOT" ls-files --others --exclude-standard)
    printf "%s\n%s\n" "$tracked" "$untracked" | awk 'NF' | sort -u
  else
    git -C "$REPO_ROOT" diff --name-only "$BASE_REF" "$HEAD_REF"
  fi
}

FORMAT_FILES=()
while IFS= read -r path; do
  [[ -n "$path" ]] || continue
  case "$path" in
    *.ts|*.tsx|*.js|*.mjs|*.json)
      ;;
    *)
      continue
      ;;
  esac

  if [[ -f "$REPO_ROOT/$path" ]]; then
    FORMAT_FILES+=("$path")
  fi
done < <(get_changed_files)

if [[ ${#FORMAT_FILES[@]} -eq 0 ]]; then
  echo "No Biome-formattable changes detected. Skipping format check."
  exit 0
fi

cd "$REPO_ROOT"
echo "==> Checking formatting for ${#FORMAT_FILES[@]} changed file(s)..." >&2
yarn biome format --no-errors-on-unmatched "${FORMAT_FILES[@]}"
