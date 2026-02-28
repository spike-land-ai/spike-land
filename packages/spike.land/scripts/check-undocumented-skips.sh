#!/bin/bash
# Check for undocumented skipped tests
# This script enforces that all .skip(), .todo(), xit, and xdescribe calls
# are properly documented with SKIP REASON, CATEGORY, TRACKING, and ACTION comments

set -e

# Find all skipped tests
skipped=$(grep -rn "\.skip(\|\.todo(\|^\s*xit(\|^\s*xdescribe(" packages/ src/ \
  --include="*.test.ts" --include="*.test.tsx" \
  --include="*.spec.ts" --include="*.spec.tsx" 2>/dev/null || true)

if [ -z "$skipped" ]; then
  echo "✓ No skipped tests found"
  exit 0
fi

# Check each skip for proper documentation
undocumented=""
while IFS= read -r line; do
  if [ -z "$line" ]; then
    continue
  fi

  file=$(echo "$line" | cut -d: -f1)
  linenum=$(echo "$line" | cut -d: -f2)

  # Check for SKIP REASON comment within 10 lines above
  start_line=$((linenum-10))
  if [ $start_line -lt 1 ]; then
    start_line=1
  fi
  end_line=$((linenum-1))

  context=$(sed -n "${start_line},${end_line}p" "$file" 2>/dev/null || true)

  # Check for all required documentation elements
  has_reason=$(echo "$context" | grep -c "SKIP REASON:" || true)
  has_category=$(echo "$context" | grep -c "CATEGORY:" || true)
  has_tracking=$(echo "$context" | grep -c "TRACKING:" || true)
  has_action=$(echo "$context" | grep -c "ACTION:" || true)

  if [ "$has_reason" -eq 0 ] || [ "$has_category" -eq 0 ] || [ "$has_tracking" -eq 0 ] || [ "$has_action" -eq 0 ]; then
    undocumented="${undocumented}\n${file}:${linenum}"
  fi
done <<< "$skipped"

if [ -n "$undocumented" ]; then
  echo "❌ ERROR: Found skipped tests without proper documentation:"
  echo -e "$undocumented"
  echo ""
  echo "Please add comment above each .skip() / .todo() / xit / xdescribe:"
  echo "// SKIP REASON: <brief explanation>"
  echo "// CATEGORY: [intentional|environment|unfinished]"
  echo "// TRACKING: #<issue-number>"
  echo "// ACTION: [keep|fix|remove]"
  echo ""
  echo "See docs/SKIPPED_TESTS.md for more information"
  exit 1
fi

echo "✓ All skipped tests are properly documented"
exit 0
