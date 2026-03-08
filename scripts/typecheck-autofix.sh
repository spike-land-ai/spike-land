#!/usr/bin/env bash
set -uo pipefail

# ── Typecheck with Gemini Auto-Fix ─────────────────────────────────────
# Runs `yarn typecheck`. On first failure, records timestamp and exits 1.
# If failure persists >60s, invokes Gemini to auto-fix the errors.
#
# Usage:
#   bash scripts/typecheck-autofix.sh
#   AUTOFIX_GRACE=120 bash scripts/typecheck-autofix.sh  # custom grace period

REPO_ROOT="/Users/z/Developer/spike-land-ai"
FAIL_MARKER="/tmp/spike-typecheck-failed-since"
AUTOFIX_GRACE="${AUTOFIX_GRACE:-60}"
NOW=$(date +%s)

cd "$REPO_ROOT"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ── Run typecheck ──────────────────────────────────────────────────────
echo -e "${BLUE}Running yarn typecheck...${NC}"
TC_OUTPUT=$(yarn typecheck 2>&1)
TC_EXIT=$?

if [ $TC_EXIT -eq 0 ]; then
  echo -e "${GREEN}Typecheck passed${NC}"
  [ -f "$FAIL_MARKER" ] && rm -f "$FAIL_MARKER"
  exit 0
fi

# ── Typecheck failed ──────────────────────────────────────────────────
echo -e "${RED}Typecheck failed${NC}"
echo "$TC_OUTPUT" | tail -20

# Check grace period
if [ ! -f "$FAIL_MARKER" ]; then
  echo "$NOW" > "$FAIL_MARKER"
  echo -e "${YELLOW}First failure recorded. Grace period: ${AUTOFIX_GRACE}s${NC}"
  exit 1
fi

FAILED_SINCE=$(cat "$FAIL_MARKER")
AGE=$(( NOW - FAILED_SINCE ))

if [ "$AGE" -lt "$AUTOFIX_GRACE" ]; then
  REMAINING=$(( AUTOFIX_GRACE - AGE ))
  echo -e "${YELLOW}Within grace period (${AGE}s/${AUTOFIX_GRACE}s). ${REMAINING}s remaining.${NC}"
  exit 1
fi

# ── Grace period exceeded — invoke Gemini auto-fix ────────────────────
echo -e "${BLUE}Grace period exceeded (${AGE}s). Invoking Gemini auto-fix...${NC}"

if ! command -v gemini &>/dev/null; then
  echo -e "${RED}gemini CLI not found. Install it or fix errors manually.${NC}"
  exit 1
fi

# Extract affected files from typecheck output
AFFECTED_FILES=$(echo "$TC_OUTPUT" | grep -oE 'src/[^ ]+\.(ts|tsx)' | sort -u | head -20)

if [ -z "$AFFECTED_FILES" ]; then
  echo -e "${RED}Could not extract affected files from typecheck output.${NC}"
  exit 1
fi

echo -e "${BLUE}Affected files:${NC}"
echo "$AFFECTED_FILES"

# Build prompt with error context
PROMPT="Fix these TypeScript typecheck errors. Edit the files directly.

Typecheck errors:
${TC_OUTPUT}

Working directory: ${REPO_ROOT}"

echo "$PROMPT" | gemini -p "Fix these TypeScript errors. Edit the files directly." \
  --yolo -m gemini-2.5-flash 2>&1 | tail -20

# ── Verify fix ────────────────────────────────────────────────────────
echo -e "${BLUE}Re-running typecheck to verify fix...${NC}"
VERIFY_OUTPUT=$(yarn typecheck 2>&1)
VERIFY_EXIT=$?

if [ $VERIFY_EXIT -eq 0 ]; then
  echo -e "${GREEN}Gemini auto-fix succeeded! Typecheck passes.${NC}"
  rm -f "$FAIL_MARKER"
  exit 0
else
  echo -e "${RED}Gemini auto-fix did not resolve all errors:${NC}"
  echo "$VERIFY_OUTPUT" | tail -10
  exit 1
fi
