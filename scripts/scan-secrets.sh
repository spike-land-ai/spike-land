#!/usr/bin/env bash
# Scan for accidentally committed secrets in staged or all files.
# Usage:
#   bash scripts/scan-secrets.sh --staged   # pre-commit hook mode
#   bash scripts/scan-secrets.sh --all      # CI mode (scan tracked files)
set -euo pipefail

MODE="${1:---staged}"
FOUND=0

# Patterns: name + regex
declare -a PATTERNS=(
  "Stripe secret key:sk_(test|live)_[A-Za-z0-9]{24,}"
  "AWS access key:AKIA[A-Z0-9]{16}"
  "GitHub PAT:ghp_[A-Za-z0-9]{36}"
  "GitHub App token:ghs_[A-Za-z0-9]{36}"
  "JWT token:eyJ[A-Za-z0-9._-]{40,}"
  "Wrangler token:CLOUDFLARE_API_TOKEN\s*=\s*['\"]?[A-Za-z0-9_-]{30,}"
  "Slack token:xox[bpsa]-[A-Za-z0-9-]{10,}"
  "NPM token:npm_[A-Za-z0-9]{36}"
  "Sentry auth token:sntrys_[A-Za-z0-9]{20,}"
  "PEM private key:-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----"
)

# Get list of files to scan
if [ "$MODE" = "--staged" ]; then
  FILES=$(git diff --cached --name-only --diff-filter=ACM 2>/dev/null || true)
elif [ "$MODE" = "--all" ]; then
  FILES=$(git ls-files 2>/dev/null || true)
else
  echo "Usage: $0 [--staged|--all]"
  exit 1
fi

if [ -z "$FILES" ]; then
  echo "No files to scan."
  exit 0
fi

# Exclude known safe patterns (test fixtures, examples, docs)
EXCLUDE_PATTERN='(\.example$|\.md$|scan-secrets\.sh$|\.test\.(ts|js)$|__tests__/)'

for entry in "${PATTERNS[@]}"; do
  NAME="${entry%%:*}"
  REGEX="${entry#*:}"

  # Scan each file
  while IFS= read -r file; do
    # Skip excluded files
    if echo "$file" | grep -qE "$EXCLUDE_PATTERN"; then
      continue
    fi
    # Skip binary files
    if file "$file" 2>/dev/null | grep -q "binary"; then
      continue
    fi
    if [ -f "$file" ]; then
      MATCHES=$(grep -nE "$REGEX" "$file" 2>/dev/null || true)
      if [ -n "$MATCHES" ]; then
        echo "BLOCKED: $NAME found in $file"
        echo "$MATCHES" | head -3
        echo ""
        FOUND=1
      fi
    fi
  done <<< "$FILES"
done

if [ "$FOUND" -eq 1 ]; then
  echo "Secret scan FAILED — remove secrets before committing."
  echo "If this is a false positive, add the file to the exclude pattern in scripts/scan-secrets.sh"
  exit 1
else
  echo "Secret scan passed."
  exit 0
fi
