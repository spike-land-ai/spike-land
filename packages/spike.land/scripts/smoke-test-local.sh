#!/bin/bash
# Smoke test for local Docker stack
# Usage: bash scripts/smoke-test-local.sh
# Or: yarn smoke:local

set -euo pipefail

WORKERD_URL="${WORKERD_URL:-http://localhost:8080}"
NEXTJS_URL="${NEXTJS_URL:-http://localhost:3000}"
PASS=0
FAIL=0

check() {
  local name="$1"
  local cmd="$2"
  if eval "$cmd" > /dev/null 2>&1; then
    echo "  PASS  $name"
    PASS=$((PASS + 1))
  else
    echo "  FAIL  $name"
    FAIL=$((FAIL + 1))
  fi
}

echo "=== spike.land Local Smoke Tests ==="
echo ""

# workerd tests
echo "-- workerd ($WORKERD_URL) --"
check "workerd /ping" \
  "curl -sf '$WORKERD_URL/ping'"

check "transpiler POST /transpile" \
  "curl -sf -X POST '$WORKERD_URL/transpile' -H 'Content-Type: application/json' -d '{\"code\":\"const x: number = 1;\"}' | grep -q 'output\\|code'"

check "collab GET /live/test/session.json" \
  "curl -sf '$WORKERD_URL/live/test/session.json' | grep -q 'codeSpace'"

check "storage-proxy health" \
  "curl -sf '$WORKERD_URL/storage/health' | grep -q 'ok'"

echo ""

# Next.js tests
echo "-- Next.js ($NEXTJS_URL) --"
check "Next.js health" \
  "curl -sf '$NEXTJS_URL' -o /dev/null -w '%{http_code}' | grep -q '200'"

check "Home page content" \
  "curl -sf '$NEXTJS_URL' | grep -qi 'spike'"

check "MCP endpoint" \
  "curl -sf -X POST '$NEXTJS_URL/api/mcp' -H 'Content-Type: application/json' -d '{\"jsonrpc\":\"2.0\",\"method\":\"tools/list\",\"id\":1}' | grep -q 'tools\\|result'"

echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
