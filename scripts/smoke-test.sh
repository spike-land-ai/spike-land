#!/usr/bin/env bash
# Post-deploy smoke test for spike-edge.
# Usage: bash scripts/smoke-test.sh [BASE_URL]
# Example: bash scripts/smoke-test.sh https://edge.spike.land
set -euo pipefail

BASE_URL="${1:-https://spike.land}"
PASS=0
FAIL=0

check() {
  local name="$1"
  local url="$2"
  local expected_status="${3:-200}"

  local status
  status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" 2>/dev/null || echo "000")

  if [ "$status" = "$expected_status" ]; then
    echo "  PASS: $name ($status)"
    PASS=$((PASS + 1))
  else
    echo "  FAIL: $name — expected $expected_status, got $status"
    FAIL=$((FAIL + 1))
  fi
}

check_json() {
  local name="$1"
  local url="$2"
  local field="$3"
  local expected="$4"

  local body
  body=$(curl -s --max-time 10 "$url" 2>/dev/null || echo "{}")
  local value
  value=$(echo "$body" | jq -r "$field" 2>/dev/null || echo "null")

  if [ "$value" = "$expected" ]; then
    echo "  PASS: $name ($field=$value)"
    PASS=$((PASS + 1))
  else
    echo "  FAIL: $name — expected $field=$expected, got $value"
    echo "        Response: $(echo "$body" | head -c 200)"
    FAIL=$((FAIL + 1))
  fi
}

echo "Smoke testing $BASE_URL ..."
echo ""

# 1. Health endpoint returns ok
check_json "Health endpoint" "$BASE_URL/health" ".status" "ok"

# 2. API health with D1 check
check_json "API health (D1)" "$BASE_URL/api/health" ".d1" "ok"

# 3. Auth endpoint reachable (returns null session or valid session)
check "Auth get-session" "$BASE_URL/api/auth/get-session" "200"

# 4. Version endpoint
check "Version endpoint" "$BASE_URL/api/version" "200"

# 5. Blog API
check "Blog API" "$BASE_URL/api/blog" "200"

# 6. MCP tools listing
check "MCP tools" "$BASE_URL/mcp/tools" "200"

# 7. Store API
check "Store apps" "$BASE_URL/api/apps" "200"

# 8. Pricing API
check "Pricing API" "$BASE_URL/api/pricing" "200"

echo ""
echo "Results: $PASS passed, $FAIL failed"

if [ "$FAIL" -gt 0 ]; then
  echo "SMOKE TEST FAILED"
  exit 1
else
  echo "SMOKE TEST PASSED"
  exit 0
fi
