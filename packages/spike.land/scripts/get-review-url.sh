#!/bin/bash
# Get the Vercel preview URL for the current branch

set -e

# Get current branch
BRANCH=$(git branch --show-current)

if [ -z "$BRANCH" ]; then
  echo "Error: Not in a git repository or no branch checked out" >&2
  exit 1
fi

# Get the latest ready deployment URL from Vercel
# Filter by the branch name in the deployment URL or use the most recent preview
REVIEW_URL=$(yarn vercel ls 2>&1 | grep -E "● Ready.*Preview" | head -1 | awk '{print $2}')

if [ -z "$REVIEW_URL" ]; then
  echo "Error: No ready preview deployment found" >&2
  exit 1
fi

echo "$REVIEW_URL"
