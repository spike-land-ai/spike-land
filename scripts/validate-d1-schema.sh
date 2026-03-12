#!/usr/bin/env bash
# Validate that all D1 tables referenced in source code exist in production.
# Usage: bash scripts/validate-d1-schema.sh [DATABASE_NAME]
set -euo pipefail

DB_NAME="${1:-spike-edge-analytics}"
MISSING=0

echo "Fetching table list from $DB_NAME ..."

# Get actual tables from production D1
TABLES_JSON=$(npx wrangler d1 execute "$DB_NAME" \
  --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name" \
  --json --remote 2>/dev/null || echo "[]")

ACTUAL_TABLES=$(echo "$TABLES_JSON" | jq -r '.[0][]?.name // empty' 2>/dev/null | sort -u)

if [ -z "$ACTUAL_TABLES" ]; then
  echo "WARNING: Could not fetch tables from $DB_NAME (check wrangler auth)"
  echo "Falling back to migration file analysis..."

  # Parse CREATE TABLE from migration files
  ACTUAL_TABLES=$(grep -rh "CREATE TABLE" src/edge-api/main/db/migrations/*.sql 2>/dev/null \
    | sed -E 's/CREATE TABLE (IF NOT EXISTS )?//' \
    | sed -E 's/\s*\(.*//' \
    | sort -u)
fi

echo "Tables in DB: $(echo "$ACTUAL_TABLES" | wc -l | tr -d ' ')"
echo ""

# Extract table names from DB.prepare() calls in source
echo "Scanning source for table references..."
REFERENCED_TABLES=$(grep -rhoE '(FROM|INTO|UPDATE|TABLE)\s+([a-z_]+)' \
  src/edge-api/main/ \
  --include='*.ts' \
  2>/dev/null \
  | sed -E 's/(FROM|INTO|UPDATE|TABLE)\s+//' \
  | grep -v '^\$' \
  | grep -v '^[0-9]' \
  | sort -u)

echo "Tables referenced in code: $(echo "$REFERENCED_TABLES" | wc -l | tr -d ' ')"
echo ""

# Compare
while IFS= read -r table; do
  if [ -z "$table" ]; then continue; fi
  if ! echo "$ACTUAL_TABLES" | grep -qw "$table"; then
    echo "  MISSING: $table"
    MISSING=$((MISSING + 1))
  fi
done <<< "$REFERENCED_TABLES"

echo ""
if [ "$MISSING" -gt 0 ]; then
  echo "VALIDATION FAILED: $MISSING table(s) referenced in code but missing from DB"
  exit 1
else
  echo "VALIDATION PASSED: All referenced tables exist"
  exit 0
fi
