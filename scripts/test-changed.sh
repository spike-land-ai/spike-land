#!/usr/bin/env bash
# test-changed.sh
# Runs vitest only for packages that changed between two git refs.
#
# Usage:
#   bash scripts/test-changed.sh [--base <ref>] [--head <ref>]
#
# Examples:
#   bash scripts/test-changed.sh                         # HEAD vs origin/main
#   bash scripts/test-changed.sh --base origin/main      # explicit base, HEAD
#   bash scripts/test-changed.sh --base main --head HEAD # named refs

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
VITEST_CONFIG=".tests/vitest.config.ts"

# ---------------------------------------------------------------------------
# Pass all args through to detect-changed-packages.sh
# ---------------------------------------------------------------------------
START_TIME=$(date +%s)

echo "==> Detecting changed packages..." >&2
PACKAGES=$(bash "$SCRIPT_DIR/detect-changed-packages.sh" "$@") || {
  echo "ERROR: detect-changed-packages.sh failed" >&2
  exit 1
}

echo "==> Detected: $PACKAGES" >&2
echo "" >&2

# ---------------------------------------------------------------------------
# Dispatch
# ---------------------------------------------------------------------------
cd "$REPO_ROOT"

if [[ "$PACKAGES" == "NO_CHANGES" ]]; then
  echo "No test-relevant changes detected. Skipping tests."
  exit 0
fi

if [[ "$PACKAGES" == "ALL" ]]; then
  echo "==> Running ALL test suites (config change or broad impact detected)" >&2
  yarn vitest run --config "$VITEST_CONFIG"
else
  # Build --project flags
  PROJECT_FLAGS=()
  while IFS= read -r pkg; do
    [[ -n "$pkg" ]] && PROJECT_FLAGS+=( "--project=$pkg" )
  done <<< "$PACKAGES"

  echo "==> Running tests for ${#PROJECT_FLAGS[@]} package(s):" >&2
  for flag in "${PROJECT_FLAGS[@]}"; do
    echo "    $flag" >&2
  done
  echo "" >&2

  yarn vitest run --config "$VITEST_CONFIG" "${PROJECT_FLAGS[@]}"
fi

END_TIME=$(date +%s)
ELAPSED=$(( END_TIME - START_TIME ))
echo "" >&2
echo "==> Done in ${ELAPSED}s" >&2
