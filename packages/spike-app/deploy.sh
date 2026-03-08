#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

R2_BUCKET="spike-app-assets"
VERSION_URL="https://spike.land/api/version"
WRANGLER="yarn wrangler"
TSX="yarn tsx"

# ── 1. Current HEAD info ──
HEAD_SHA="$(git rev-parse HEAD)"
COMMIT_TIME="$(git log -1 --format=%cI HEAD)"

echo "HEAD: ${HEAD_SHA}"
echo "Commit time: ${COMMIT_TIME}"

# ── 2. Check deployed version ──
DEPLOYED_SHA=""
if [ "${FORCE_DEPLOY:-}" != "1" ]; then
  DEPLOYED_SHA="$(
    curl -sf --max-time 5 "$VERSION_URL" \
      | jq -r '.sha // ""' 2>/dev/null
  )" || DEPLOYED_SHA=""

  if [ "$DEPLOYED_SHA" = "$HEAD_SHA" ]; then
    echo "Deployed SHA matches HEAD — nothing to do."
    exit 0
  fi

  echo "Deployed SHA: ${DEPLOYED_SHA:-<unknown>}"
fi

CACHE_DIR=".deploy-cache"
mkdir -p "$CACHE_DIR"

# ── 2b. Ensure dist was built ──
if [ ! -f "./dist/index.html" ]; then
  echo "ERROR: dist/index.html not found. Run 'npm run build' first."
  exit 1
fi

# ── 3. Inject build metadata into index.html ──
# Only inject build metadata if not already present
if ! grep -q 'name="build-sha"' ./dist/index.html; then
  sed -i.bak "s|</head>|<meta name=\"build-sha\" content=\"${HEAD_SHA}\" /><meta name=\"build-time\" content=\"${COMMIT_TIME}\" /></head>|" ./dist/index.html
  rm -f ./dist/index.html.bak
else
  # Update existing metadata
  sed -i.bak "s|content=\"[a-f0-9]*\" /><meta name=\"build-time\" content=\"[^\"]*\"|content=\"${HEAD_SHA}\" /><meta name=\"build-time\" content=\"${COMMIT_TIME}\"|" ./dist/index.html
  rm -f ./dist/index.html.bak
fi

# ── 4. Archive current build in R2 for rollback ──
# NOTE: wrangler r2 CLI has no "object list" or "object copy" commands,
# so archiving is skipped. To implement rollback, use the S3-compatible API.
if [ -n "$DEPLOYED_SHA" ] && [ "$DEPLOYED_SHA" != "unknown" ]; then
  echo "Previous deploy: ${DEPLOYED_SHA:0:12} (archiving skipped — not supported by wrangler CLI)"
fi

# ── 5. Upload new dist/ to R2 ──
echo "Uploading to R2 bucket: ${R2_BUCKET}..."

# Load previously uploaded keys for content-hash diffing
UPLOADED_KEYS_FILE="$CACHE_DIR/uploaded-keys.txt"
touch "$UPLOADED_KEYS_FILE"

upload_file() {
  local file="$1"
  local key="${file#./dist/}"
  local content_type

  case "$file" in
    *.html) content_type="text/html; charset=utf-8" ;;
    *.js)   content_type="application/javascript" ;;
    *.css)  content_type="text/css" ;;
    *.json) content_type="application/json" ;;
    *.svg)  content_type="image/svg+xml" ;;
    *.png)  content_type="image/png" ;;
    *.ico)  content_type="image/x-icon" ;;
    *.txt)  content_type="text/plain" ;;
    *.xml)  content_type="application/xml" ;;
    *.woff2) content_type="font/woff2" ;;
    *.woff) content_type="font/woff" ;;
    *.map)  content_type="application/json" ;;
    *)      content_type="application/octet-stream" ;;
  esac

  $WRANGLER r2 object put "${R2_BUCKET}/${key}" \
    --file "$file" \
    --content-type "$content_type" \
    --remote
}

export -f upload_file
export R2_BUCKET WRANGLER

# Build list of files to upload, skipping hashed assets already uploaded
FILES_TO_UPLOAD=()
NEW_KEYS=()

find ./dist -type f -print0 > "$CACHE_DIR/files.tmp"
while IFS= read -r -d '' file; do
  key="${file#./dist/}"
  # Hashed assets (contain content hash in filename) can be skipped if already uploaded
  if [[ "$key" =~ \.[0-9a-f]{8,}\. ]] && grep -qxF "$key" "$UPLOADED_KEYS_FILE" 2>/dev/null; then
    continue
  fi
  FILES_TO_UPLOAD+=("$file")
  NEW_KEYS+=("$key")
done < "$CACHE_DIR/files.tmp"

echo "Uploading ${#FILES_TO_UPLOAD[@]} files (skipped $(( $(find ./dist -type f | wc -l) - ${#FILES_TO_UPLOAD[@]} )) cached)..."

# Upload in parallel (4 concurrent to avoid R2 rate limits)
printf '%s\0' "${FILES_TO_UPLOAD[@]}" | xargs -0 -P 4 -I {} bash -c 'upload_file "$@"' _ {}

# Update uploaded keys cache
printf '%s\n' "${NEW_KEYS[@]}" >> "$UPLOADED_KEYS_FILE"
sort -u -o "$UPLOADED_KEYS_FILE" "$UPLOADED_KEYS_FILE"

# ── 5b. Purge Cloudflare edge cache ──
bash "$(dirname "$0")/../../scripts/purge-cache.sh"

# ── 6. Seed blog posts to D1 and upload images to R2 ──
BLOG_DIR="../../content/blog"
BLOG_HASH=""
if [ -d "$BLOG_DIR" ]; then
  BLOG_HASH="$(git ls-tree -r HEAD -- "$BLOG_DIR" 2>/dev/null | git hash-object --stdin 2>/dev/null || echo "")"
fi
CACHED_BLOG_HASH=""
if [ -f "$CACHE_DIR/blog.treehash" ]; then
  CACHED_BLOG_HASH="$(cat "$CACHE_DIR/blog.treehash")"
fi

if [ "$BLOG_HASH" != "$CACHED_BLOG_HASH" ] || [ -z "$BLOG_HASH" ]; then
  echo "Seeding blog content to D1 + R2..."
  (cd ../.. && yarn tsx scripts/seed-blog.ts --remote) || echo "⚠ Blog seed failed (non-fatal)"
  if [ -n "$BLOG_HASH" ]; then
    echo "$BLOG_HASH" > "$CACHE_DIR/blog.treehash"
  fi
else
  echo "Blog content unchanged — skipping seed."
fi

echo "Deployed ${HEAD_SHA:0:12} @ ${COMMIT_TIME}"
