#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

R2_BUCKET="spike-app-assets"

for file in $(find dist -type f); do
  key="${file#dist/}"
  case "$file" in
    *.html) ct="text/html; charset=utf-8" ;;
    *.js)   ct="application/javascript" ;;
    *.css)  ct="text/css" ;;
    *.json) ct="application/json" ;;
    *.svg)  ct="image/svg+xml" ;;
    *.png)  ct="image/png" ;;
    *.ico)  ct="image/x-icon" ;;
    *.txt)  ct="text/plain" ;;
    *.xml)  ct="application/xml" ;;
    *.woff2) ct="font/woff2" ;;
    *.woff) ct="font/woff" ;;
    *)      ct="application/octet-stream" ;;
  esac
  echo "Uploading: $key"
  npx wrangler r2 object put "${R2_BUCKET}/${key}" --file "$file" --content-type "$ct" --remote 2>&1 | tail -1
done

echo "Done! All files uploaded."
