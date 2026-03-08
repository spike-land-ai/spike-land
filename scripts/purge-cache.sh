#!/usr/bin/env bash
set -uo pipefail

usage() {
  echo "Usage: $0 [--files url1,url2]" >&2
}

warn() {
  echo "WARNING: $*" >&2
}

FILES_ARG=""

while [ $# -gt 0 ]; do
  case "$1" in
    --files)
      if [ $# -lt 2 ]; then
        usage
        exit 2
      fi
      FILES_ARG="$2"
      shift 2
      ;;
    -*)
      usage
      exit 2
      ;;
    *)
      usage
      exit 2
      ;;
  esac
done

if [ -z "${CLOUDFLARE_API_TOKEN:-}" ]; then
  warn "CLOUDFLARE_API_TOKEN is not set; skipping cache purge"
  exit 0
fi

CF_ZONE_ID="$(
  curl -sf --max-time 10 \
    -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
    "https://api.cloudflare.com/client/v4/zones?name=spike.land" \
    | jq -r '.result[0].id // ""' 2>/dev/null
)" || CF_ZONE_ID=""

if [ -z "$CF_ZONE_ID" ]; then
  warn "Could not resolve zone ID for spike.land; skipping cache purge"
  exit 0
fi

payload='{"purge_everything":true}'
purge_target="entire cache"

if [ -n "$FILES_ARG" ]; then
  files_json="$(
    printf '%s' "$FILES_ARG" \
      | tr ',' '\n' \
      | sed 's/^[[:space:]]*//; s/[[:space:]]*$//' \
      | jq -Rsc 'split("\n") | map(select(length > 0))'
  )" || files_json="[]"

  if [ "$files_json" = "[]" ]; then
    warn "No valid file URLs were provided; skipping selective purge"
    exit 0
  fi

  payload="$(jq -nc --argjson files "$files_json" '{files: $files}')" || payload=""
  if [ -z "$payload" ]; then
    warn "Failed to build selective purge payload; skipping cache purge"
    exit 0
  fi

  purge_target="selected files"
fi

echo "Purging Cloudflare ${purge_target}..."

response="$(
  curl -sS --max-time 20 \
    -X POST "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/purge_cache" \
    -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$payload"
)" || {
  warn "Cache purge API call failed (non-fatal)"
  exit 0
}

success="$(printf '%s' "$response" | jq -r '.success // false' 2>/dev/null)" || success="false"
if [ "$success" != "true" ]; then
  errors="$(printf '%s' "$response" | jq -c '.errors // []' 2>/dev/null)" || errors="[]"
  warn "Cloudflare cache purge was not accepted: ${errors}"
  exit 0
fi

echo "Cache purge requested successfully."
