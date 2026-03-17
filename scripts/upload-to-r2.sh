#!/usr/bin/env bash
set -euo pipefail

# Usage: upload-to-r2.sh <dist-dir> <r2-bucket>
# Uploads files from dist-dir to the given R2 bucket with content-type detection,
# Cache-Control headers, hashed-asset caching, parallel upload, retry logic,
# and progress reporting.

DIST_DIR="${1:?Usage: upload-to-r2.sh <dist-dir> <r2-bucket>}"
R2_BUCKET="${2:?Usage: upload-to-r2.sh <dist-dir> <r2-bucket>}"
WRANGLER="${WRANGLER:-yarn wrangler}"
R2_KEY_PREFIX="${R2_KEY_PREFIX:-}"
UPLOAD_HTML_LAST="${UPLOAD_HTML_LAST:-0}"
CONCURRENCY="${UPLOAD_CONCURRENCY:-20}"
MAX_RETRIES=3

CACHE_DIR="${DIST_DIR}/../.deploy-cache"
mkdir -p "$CACHE_DIR"

# Temp dirs for this run
RUN_TMP="$(mktemp -d)"
trap 'rm -rf "$RUN_TMP"' EXIT

FAILURES_DIR="$RUN_TMP/failures"
PROGRESS_FILE="$RUN_TMP/progress"
mkdir -p "$FAILURES_DIR"
echo 0 > "$PROGRESS_FILE"

if [ -n "$R2_KEY_PREFIX" ]; then
  echo "Uploading to R2 bucket: ${R2_BUCKET} (prefix: ${R2_KEY_PREFIX})..."
else
  echo "Uploading to R2 bucket: ${R2_BUCKET}..."
fi

prefix_slug() {
  if [ -z "$1" ]; then
    printf 'root'
    return
  fi
  printf '%s' "$1" | tr '/:' '__'
}

build_remote_key() {
  local key="$1"
  if [ -n "$R2_KEY_PREFIX" ]; then
    printf '%s/%s' "${R2_KEY_PREFIX%/}" "$key"
    return
  fi
  printf '%s' "$key"
}

is_html_key() {
  case "$1" in
    *.html) return 0 ;;
    *) return 1 ;;
  esac
}

get_content_type() {
  case "$1" in
    *.html)  echo "text/html; charset=utf-8" ;;
    *.js)    echo "application/javascript" ;;
    *.mjs)   echo "application/javascript" ;;
    *.css)   echo "text/css" ;;
    *.json)  echo "application/json" ;;
    *.svg)   echo "image/svg+xml" ;;
    *.png)   echo "image/png" ;;
    *.jpg|*.jpeg) echo "image/jpeg" ;;
    *.gif)   echo "image/gif" ;;
    *.webp)  echo "image/webp" ;;
    *.avif)  echo "image/avif" ;;
    *.ico)   echo "image/x-icon" ;;
    *.txt)   echo "text/plain" ;;
    *.xml)   echo "application/xml" ;;
    *.woff2) echo "font/woff2" ;;
    *.woff)  echo "font/woff" ;;
    *.ttf)   echo "font/ttf" ;;
    *.otf)   echo "font/otf" ;;
    *.map)   echo "application/json" ;;
    *.wasm)  echo "application/wasm" ;;
    *.mp4)   echo "video/mp4" ;;
    *.webm)  echo "video/webm" ;;
    *.mp3)   echo "audio/mpeg" ;;
    *.pdf)   echo "application/pdf" ;;
    *)       echo "application/octet-stream" ;;
  esac
}

get_cache_control() {
  local key="$1"
  # Hashed assets under _astro/ are immutable (content-addressed filenames)
  case "$key" in
    _astro/*) echo "public, max-age=31536000, immutable" ;;
    *.html)   echo "public, max-age=60, s-maxage=300" ;;
    *)        echo "public, max-age=3600, s-maxage=86400" ;;
  esac
}

# Upload a single file with retry logic
# Args: $1=file $2=dist_dir $3=total_count $4=progress_file $5=failures_dir
upload_file_with_retry() {
  local file="$1"
  local dist="$2"
  local total="$3"
  local progress_file="$4"
  local failures_dir="$5"
  local local_key="${file#${dist}/}"
  local remote_key
  remote_key="$(build_remote_key "$local_key")"
  local content_type
  content_type="$(get_content_type "$file")"
  local cache_control
  cache_control="$(get_cache_control "$local_key")"

  local attempt=0
  local success=0
  while [ $attempt -lt $MAX_RETRIES ]; do
    attempt=$((attempt + 1))
    if $WRANGLER r2 object put "${R2_BUCKET}/${remote_key}" \
      --file "$file" \
      --content-type "$content_type" \
      --cache-control "$cache_control" \
      --remote 2>/dev/null; then
      success=1
      break
    fi
    if [ $attempt -lt $MAX_RETRIES ]; then
      # Exponential backoff: 1s, 2s, 4s
      sleep $((1 << (attempt - 1)))
    fi
  done

  # Atomic progress update (works on macOS with awk)
  local count
  count=$(awk 'BEGIN{srand()} {print $1+1}' "$progress_file")
  echo "$count" > "$progress_file"
  printf "\r  Uploading %d/%d..." "$count" "$total" >&2

  if [ $success -eq 0 ]; then
    echo "$remote_key" > "$failures_dir/$(echo "$remote_key" | tr '/' '_')"
    return 1
  fi
  return 0
}

export -f upload_file_with_retry build_remote_key get_content_type get_cache_control is_html_key
export R2_BUCKET WRANGLER R2_KEY_PREFIX MAX_RETRIES

# Load previously uploaded keys for content-hash diffing
UPLOADED_KEYS_FILE="$CACHE_DIR/uploaded-keys-${R2_BUCKET}-$(prefix_slug "$R2_KEY_PREFIX").txt"
CHECKSUM_FILE="$CACHE_DIR/checksums-${R2_BUCKET}-$(prefix_slug "$R2_KEY_PREFIX").txt"
touch "$UPLOADED_KEYS_FILE" "$CHECKSUM_FILE"

# Build list of files, computing checksums to skip unchanged files
FILES_TO_UPLOAD=()
HTML_FILES_TO_UPLOAD=()
NEW_KEYS=()
NEW_CHECKSUMS=()
TOTAL_FILES=0
SKIPPED_HASH=0
SKIPPED_CHECKSUM=0

# Old checksums file is a TSV of checksum<tab>path — we grep it directly
# (avoids bash 4+ associative arrays for macOS compatibility)

find "$DIST_DIR" -type f -print0 > "$CACHE_DIR/files.tmp"
while IFS= read -r -d '' file; do
  TOTAL_FILES=$((TOTAL_FILES + 1))
  key="${file#${DIST_DIR}/}"
  remote_key="$(build_remote_key "$key")"

  # 1) Hashed assets with content hash in filename can be skipped if already uploaded
  if [[ "$key" =~ \.[0-9a-f]{8,}\. ]] && grep -qxF "$remote_key" "$UPLOADED_KEYS_FILE" 2>/dev/null; then
    SKIPPED_HASH=$((SKIPPED_HASH + 1))
    continue
  fi

  # 2) For non-hashed files, compare MD5 checksum to skip unchanged files
  current_checksum="$(md5 -q "$file" 2>/dev/null || md5sum "$file" | cut -d' ' -f1)"
  old_checksum="$(grep -F "	${remote_key}" "$CHECKSUM_FILE" 2>/dev/null | head -1 | cut -f1)" || true
  if [ -n "$old_checksum" ] && [ "$old_checksum" = "$current_checksum" ]; then
    SKIPPED_CHECKSUM=$((SKIPPED_CHECKSUM + 1))
    # Still record in new checksums so it persists
    NEW_CHECKSUMS+=("${current_checksum}	${remote_key}")
    NEW_KEYS+=("$remote_key")
    continue
  fi

  NEW_CHECKSUMS+=("${current_checksum}	${remote_key}")

  if [ "$UPLOAD_HTML_LAST" = "1" ] && is_html_key "$key"; then
    HTML_FILES_TO_UPLOAD+=("$file")
  else
    FILES_TO_UPLOAD+=("$file")
  fi

  NEW_KEYS+=("$remote_key")
done < "$CACHE_DIR/files.tmp"

TOTAL_TO_UPLOAD=$(( ${#FILES_TO_UPLOAD[@]} + ${#HTML_FILES_TO_UPLOAD[@]} ))
TOTAL_SKIPPED=$(( SKIPPED_HASH + SKIPPED_CHECKSUM ))
echo "Found ${TOTAL_FILES} files: uploading ${TOTAL_TO_UPLOAD}, skipped ${TOTAL_SKIPPED} (${SKIPPED_HASH} hashed, ${SKIPPED_CHECKSUM} unchanged)"

if [ "$TOTAL_TO_UPLOAD" -eq 0 ]; then
  echo "Nothing to upload — all files are up to date."
  # Still update checksum cache
  if [ ${#NEW_CHECKSUMS[@]} -gt 0 ]; then
    printf '%s\n' "${NEW_CHECKSUMS[@]}" > "$CHECKSUM_FILE"
  fi
  echo "R2 upload to ${R2_BUCKET} complete."
  exit 0
fi

# Reset progress counter
echo 0 > "$PROGRESS_FILE"

# Upload non-HTML files in parallel
if [ ${#FILES_TO_UPLOAD[@]} -gt 0 ]; then
  printf '%s\0' "${FILES_TO_UPLOAD[@]}" | \
    xargs -0 -P "$CONCURRENCY" -I {} bash -c \
      'upload_file_with_retry "$@" "'"$DIST_DIR"'" "'"$TOTAL_TO_UPLOAD"'" "'"$PROGRESS_FILE"'" "'"$FAILURES_DIR"'"' _ {} \
    || true  # Don't exit on individual failures; we collect them
fi

# Upload HTML files last (sequentially for atomic switchover)
if [ ${#HTML_FILES_TO_UPLOAD[@]} -gt 0 ]; then
  echo ""
  echo "  Uploading ${#HTML_FILES_TO_UPLOAD[@]} HTML files last (atomic switchover)..."
  for file in "${HTML_FILES_TO_UPLOAD[@]}"; do
    upload_file_with_retry "$file" "$DIST_DIR" "$TOTAL_TO_UPLOAD" "$PROGRESS_FILE" "$FAILURES_DIR" || true
  done
fi

echo ""  # Clear the progress line

# Collect failures
FAILED_FILES=()
if [ -d "$FAILURES_DIR" ] && [ "$(ls -A "$FAILURES_DIR" 2>/dev/null)" ]; then
  for f in "$FAILURES_DIR"/*; do
    FAILED_FILES+=("$(cat "$f")")
  done
fi

# Update caches (only for successfully uploaded keys)
if [ ${#NEW_KEYS[@]} -gt 0 ]; then
  printf '%s\n' "${NEW_KEYS[@]}" >> "$UPLOADED_KEYS_FILE"
  sort -u -o "$UPLOADED_KEYS_FILE" "$UPLOADED_KEYS_FILE"
fi

if [ ${#NEW_CHECKSUMS[@]} -gt 0 ]; then
  printf '%s\n' "${NEW_CHECKSUMS[@]}" > "$CHECKSUM_FILE"
fi

# Report results
if [ ${#FAILED_FILES[@]} -gt 0 ]; then
  echo "WARNING: ${#FAILED_FILES[@]} file(s) FAILED after ${MAX_RETRIES} retries:"
  for key in "${FAILED_FILES[@]}"; do
    echo "  - $key"
  done
  echo ""
  echo "R2 upload to ${R2_BUCKET} completed with errors."
  exit 1
else
  SUCCEEDED=$((TOTAL_TO_UPLOAD - ${#FAILED_FILES[@]}))
  echo "R2 upload to ${R2_BUCKET} complete. ${SUCCEEDED} files uploaded, ${TOTAL_SKIPPED} skipped."
fi
