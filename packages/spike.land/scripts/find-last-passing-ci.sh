#!/usr/bin/env bash
# Find the most recent ancestor commit with passing CI

set -e

TASK_NAME="$1"
MAX_COMMITS="${2:-10}"

show_usage() {
  echo "Usage: find-last-passing-ci.sh [task-name] [max-commits]" >&2
  echo "" >&2
  echo "Without task-name: finds last commit where entire CI/CD passed" >&2
  echo "With task-name: finds last commit where specific job passed" >&2
  echo "" >&2
  echo "Examples:" >&2
  echo "  find-last-passing-ci.sh                      # Last fully green CI" >&2
  echo "  find-last-passing-ci.sh 'Unit Tests [3/4]'   # Last passing shard 3" >&2
  exit 1
}

if [ "$TASK_NAME" = "--help" ] || [ "$TASK_NAME" = "-h" ]; then
  show_usage
fi

# Get list of commit SHAs
commits=$(git log --format=%H -n "$MAX_COMMITS")

for sha in $commits; do
  if [ -z "$TASK_NAME" ]; then
    # Check if entire workflow passed
    result=$(gh run list --commit "$sha" --workflow "ci-cd.yml" --json conclusion \
      --jq '.[0].conclusion' 2>/dev/null || echo "")
  else
    # Check if specific job passed
    result=$(gh api "repos/{owner}/{repo}/commits/$sha/check-runs" \
      --jq ".check_runs[] | select(.name == \"$TASK_NAME\") | .conclusion" \
      2>/dev/null || echo "")
  fi

  if [ "$result" = "success" ]; then
    echo "$sha"
    exit 0
  fi
done

# Fallback to main if no passing commit found
echo "main"
