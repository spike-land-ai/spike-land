#!/usr/bin/env bash
set -euo pipefail

# Unified rollback CLI for spike-land-ai
#
# Usage:
#   rollback.sh worker <name>    Rollback a Cloudflare Worker
#   rollback.sh spa list         List available SPA rollback SHAs
#   rollback.sh spa <sha>        Rollback SPA to a specific build SHA

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
R2_BUCKET="spike-app-assets"

usage() {
  echo "Usage:"
  echo "  $0 worker <name>    Rollback a Cloudflare Worker (e.g., spike-edge)"
  echo "  $0 spa list         List available SPA rollback SHAs"
  echo "  $0 spa <sha>        Rollback SPA to a specific build SHA"
  exit 1
}

if [ $# -lt 2 ]; then
  usage
fi

case "$1" in
  worker)
    WORKER_NAME="$2"
    WORKER_DIR="${ROOT}/packages/${WORKER_NAME}"
    if [ ! -d "$WORKER_DIR" ]; then
      echo "Error: Worker directory not found: ${WORKER_DIR}"
      exit 1
    fi
    echo "Rolling back worker: ${WORKER_NAME}..."
    cd "$WORKER_DIR" && npx wrangler rollback
    echo "Worker ${WORKER_NAME} rolled back."
    bash "${ROOT}/scripts/purge-cache.sh"
    ;;

  spa)
    case "$2" in
      list)
        echo "Available SPA rollback builds:"
        echo ""
        # List builds/ prefix in R2 and extract unique SHAs
        LIST_OUTPUT="$(cd "${ROOT}/packages/spike-app" && yarn wrangler r2 object list "${R2_BUCKET}" --prefix "builds/" --remote 2>/dev/null || echo "")"
        if [ -z "$LIST_OUTPUT" ]; then
          echo "  (none found)"
          exit 0
        fi
        echo "$LIST_OUTPUT" | python3 -c "
import sys, json
try:
  data = json.load(sys.stdin)
  objs = data.get('objects', data) if isinstance(data, dict) else data
  shas = sorted(set(
    obj.get('key','').split('/')[1]
    for obj in (objs if isinstance(objs, list) else [])
    if isinstance(obj, dict) and obj.get('key','').startswith('builds/') and len(obj['key'].split('/')) > 2
  ))
  for sha in shas:
    print(f'  {sha}')
  if not shas:
    print('  (none found)')
except Exception as e:
  print(f'  Error parsing R2 output: {e}')
"
        ;;

      *)
        SHA="$2"
        echo "Rolling back SPA to build: ${SHA:0:12}..."

        # Verify the build exists
        cd "${ROOT}/packages/spike-app"
        VERIFY="$(yarn wrangler r2 object list "${R2_BUCKET}" --prefix "builds/${SHA}/" --remote 2>/dev/null || echo "")"
        FOUND="$(echo "$VERIFY" | python3 -c "
import sys, json
try:
  data = json.load(sys.stdin)
  objs = data.get('objects', data) if isinstance(data, dict) else data
  print(len([o for o in (objs if isinstance(objs, list) else []) if isinstance(o, dict)]))
except: print(0)
")"
        if [ "$FOUND" = "0" ]; then
          echo "Error: No build found for SHA ${SHA}"
          echo "Run '$0 spa list' to see available builds."
          exit 1
        fi

        echo "Found ${FOUND} files in build ${SHA:0:12}. Copying to root..."

        # Copy archived build back to R2 root
        echo "$VERIFY" | python3 -c "
import sys, json
try:
  data = json.load(sys.stdin)
  objs = data.get('objects', data) if isinstance(data, dict) else data
  for obj in (objs if isinstance(objs, list) else []):
    if isinstance(obj, dict):
      key = obj.get('key', '')
      if key.startswith('builds/') and len(key.split('/')) > 2:
        # Extract the path after builds/{sha}/
        parts = key.split('/', 2)
        if len(parts) == 3:
          print(parts[2])
except: pass
" | while read -r rel_key; do
          yarn wrangler r2 object copy "${R2_BUCKET}/builds/${SHA}/${rel_key}" "${R2_BUCKET}/${rel_key}" --remote 2>/dev/null || true
        done

        echo "SPA rolled back to ${SHA:0:12}."
        bash "${ROOT}/scripts/purge-cache.sh"
        ;;
    esac
    ;;

  *)
    usage
    ;;
esac
