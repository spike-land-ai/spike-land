#!/bin/bash
# Smoke tests for post-deployment validation
# Usage: ./scripts/smoke-test.sh <deployment-url> [bypass-token]

set -e

DEPLOYMENT_URL="${1}"
BYPASS_TOKEN="${2}"

if [ -z "$DEPLOYMENT_URL" ]; then
  echo "Error: Deployment URL not provided"
  echo "Usage: $0 <deployment-url> [bypass-token]"
  exit 1
fi

# Normalize URL (remove trailing slash)
DEPLOYMENT_URL="${DEPLOYMENT_URL%/}"

echo "🔍 Running smoke tests against: $DEPLOYMENT_URL"
echo ""

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function to test endpoint
test_endpoint() {
  local name=$1
  local method=$2
  local path=$3
  local expected_status=$4

  echo -n "Testing $name... "

  # Build URL with bypass token if available
  local test_url="$DEPLOYMENT_URL$path"
  if [ -n "$BYPASS_TOKEN" ]; then
    # Use query parameters for Vercel deployment protection bypass
    test_url="$test_url?x-vercel-set-bypass-cookie=true&x-vercel-protection-bypass=$BYPASS_TOKEN"
  fi

  response=$(curl -s -w "\n%{http_code}" -X "$method" "$test_url")
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')

  if [ "$http_code" = "$expected_status" ]; then
    echo "✓ (HTTP $http_code)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    echo "✗ (Expected HTTP $expected_status, got $http_code)"
    echo "  Response: $body"
    TESTS_FAILED=$((TESTS_FAILED + 1))
  fi
}

# Helper function to test endpoint contains text
test_endpoint_contains() {
  local name=$1
  local path=$2
  local text=$3

  echo -n "Testing $name... "

  # Build curl command with bypass cookie if available
  local curl_cmd="curl -s -w \"\n%{http_code}\""
  if [ -n "$BYPASS_TOKEN" ]; then
    curl_cmd="$curl_cmd -H \"Cookie: __Secure-vercel-protection-bypass=$BYPASS_TOKEN\""
  fi
  curl_cmd="$curl_cmd \"$DEPLOYMENT_URL$path\""

  response=$(eval "$curl_cmd")
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')

  if [ "$http_code" = "200" ] && echo "$body" | grep -q "$text"; then
    echo "✓"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    echo "✗"
    if [ "$http_code" != "200" ]; then
      echo "  Expected HTTP 200, got $http_code"
    else
      echo "  Response does not contain: $text"
    fi
    TESTS_FAILED=$((TESTS_FAILED + 1))
  fi
}

# Run tests
echo "=== Basic Connectivity Tests ==="
test_endpoint "Homepage" "GET" "/" "200"
test_endpoint "Favicon" "GET" "/favicon.ico" "200"

echo ""
echo "=== Content Tests ==="
test_endpoint_contains "Homepage loads" "/" "html"

echo ""
echo "=== Health Check Tests ==="
test_endpoint "API availability" "GET" "/api/health" "200"

echo ""
echo "=================================================="
echo "Test Results: $TESTS_PASSED passed, $TESTS_FAILED failed"
echo "=================================================="

if [ $TESTS_FAILED -gt 0 ]; then
  exit 1
fi

echo "✓ All smoke tests passed!"
exit 0
