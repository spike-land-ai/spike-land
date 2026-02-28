#!/bin/bash
# run-cached-tests.sh
#
# Runs Vitest unit tests with coverage-based caching in Docker CI.
# Uses the test cache to skip tests whose dependencies haven't changed.
#
# Environment variables:
#   TEST_CACHE_DIR   - Cache directory (default: /app/.test-cache)
#   SHARD_INDEX      - Current shard number (default: 1)
#   SHARD_TOTAL      - Total number of shards (default: 4)
#   GITHUB_REF       - Git ref for main branch detection
#   DEBUG            - Set to "true" for verbose output

set -e

CACHE_DIR="${TEST_CACHE_DIR:-/app/.test-cache}"
SHARD_INDEX="${SHARD_INDEX:-1}"
SHARD_TOTAL="${SHARD_TOTAL:-4}"

echo "::group::Test Cache Check"
echo "Cache directory: $CACHE_DIR"
echo "Shard: $SHARD_INDEX/$SHARD_TOTAL"

# Ensure cache directory exists
mkdir -p "$CACHE_DIR"

# Check if we can skip all tests (main branch with no changes)
if [ "${GITHUB_REF:-}" = "refs/heads/main" ]; then
  echo "On main branch, checking cache..."

  if npx tsx scripts/test-cache-manager.ts should-skip-all 2>/dev/null; then
    echo "::endgroup::"
    echo "::notice::All tests cached and unchanged, skipping shard $SHARD_INDEX"
    echo "SKIP_REASON=all-cached" >> "${GITHUB_OUTPUT:-/dev/null}"
    exit 0
  fi
fi

# Get tests that need to run
echo "Determining which tests need to run..."
TESTS_TO_RUN=$(npx tsx scripts/test-cache-manager.ts get-test-filter 2>/dev/null || echo "")

if [ "$TESTS_TO_RUN" = "--passWithNoTests" ]; then
  echo "::endgroup::"
  echo "::notice::No tests need to run for shard $SHARD_INDEX (all cached)"
  exit 0
fi

if [ -z "$TESTS_TO_RUN" ]; then
  echo "Cache manager returned empty, running all tests..."
  TESTS_TO_RUN=""
fi

echo "::endgroup::"

# Show cache stats in CI
if [ -n "${CI:-}" ]; then
  npx tsx scripts/test-cache-manager.ts stats 2>/dev/null || true
fi

echo "::group::Running Tests (Shard $SHARD_INDEX/$SHARD_TOTAL)"

# Build the vitest command
VITEST_CMD="yarn vitest run --coverage"
VITEST_CMD="$VITEST_CMD --reporter=github-actions"
VITEST_CMD="$VITEST_CMD --reporter=./scripts/vitest-coverage-mapper-reporter.ts"
VITEST_CMD="$VITEST_CMD --shard ${SHARD_INDEX}/${SHARD_TOTAL}"
# Disable coverage thresholds in Docker CI - thresholds are handled by codecov
VITEST_CMD="$VITEST_CMD --coverage.thresholds.lines=0"
VITEST_CMD="$VITEST_CMD --coverage.thresholds.functions=0"
VITEST_CMD="$VITEST_CMD --coverage.thresholds.branches=0"
VITEST_CMD="$VITEST_CMD --coverage.thresholds.statements=0"

# Add test files if specific ones need to run
if [ -n "$TESTS_TO_RUN" ]; then
  echo "Running specific tests:"
  echo "$TESTS_TO_RUN" | tr ' ' '\n' | head -20
  TEST_COUNT=$(echo "$TESTS_TO_RUN" | wc -w | tr -d ' ')
  if [ "$TEST_COUNT" -gt 20 ]; then
    echo "... and $((TEST_COUNT - 20)) more"
  fi

  # shellcheck disable=SC2086
  $VITEST_CMD $TESTS_TO_RUN
else
  echo "Running all tests..."
  $VITEST_CMD
fi

echo "::endgroup::"
echo "::notice::Shard $SHARD_INDEX completed, cache updated"
