#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

# ── 1. Current HEAD info ──
HEAD_SHA="$(git rev-parse HEAD)"
COMMIT_TIME="$(git log -1 --format=%cI HEAD)"

echo "HEAD: ${HEAD_SHA}"
echo "Commit time: ${COMMIT_TIME}"

# ── 2. Check deployed version ──
DEPLOYED_SHA=""
if [ "${FORCE_DEPLOY:-}" != "1" ]; then
  DEPLOYED_SHA="$(
    curl -sf --max-time 5 https://image-studio-mcp.spike.land/version \
      | python3 -c "import sys,json; print(json.load(sys.stdin).get('sha',''))" 2>/dev/null
  )" || DEPLOYED_SHA=""

  if [ "$DEPLOYED_SHA" = "$HEAD_SHA" ]; then
    echo "Deployed SHA matches HEAD — nothing to do."
    exit 0
  fi

  echo "Deployed SHA: ${DEPLOYED_SHA:-<unknown>}"
fi

# ── 3. Frontend build caching ──
CACHE_DIR=".deploy-cache"
mkdir -p "$CACHE_DIR"

TREE_HASH="$(git ls-tree -r HEAD -- frontend/ | git hash-object --stdin)"
CACHED_HASH=""
if [ -f "$CACHE_DIR/frontend.treehash" ]; then
  CACHED_HASH="$(cat "$CACHE_DIR/frontend.treehash")"
fi

if [ "$TREE_HASH" = "$CACHED_HASH" ] && [ -d "frontend/dist" ]; then
  echo "Frontend unchanged (tree hash: ${TREE_HASH:0:12}) — skipping build."
else
  echo "Building frontend..."
  npm run build:frontend
  echo "$TREE_HASH" > "$CACHE_DIR/frontend.treehash"
fi

# ── 4. D1 migrations ──
echo "Running D1 migrations..."
npm run db:migrate

# ── 5. Deploy worker ──
echo "Deploying worker..."
yarn wrangler deploy \
  --define "__BUILD_SHA__:\"'${HEAD_SHA}'\"" \
  --define "__BUILD_TIME__:\"'${COMMIT_TIME}'\""

echo "Deployed ${HEAD_SHA:0:12} @ ${COMMIT_TIME}"
