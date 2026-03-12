#!/usr/bin/env bash
# Start local.spike.land development environment with HTTPS
#
# Prerequisites:
#   1. mkcert installed: brew install mkcert nss
#   2. Local CA installed: mkcert -install
#   3. /etc/hosts entry: 127.0.0.1 local.spike.land
#
# Usage: bash scripts/dev-local.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CERT_DIR="$ROOT/.dev-certs"
CERT_FILE="$CERT_DIR/local.spike.land.pem"
KEY_FILE="$CERT_DIR/local.spike.land-key.pem"
INSPECTOR_PORT_EDGE="${INSPECTOR_PORT_EDGE:-9230}"
INSPECTOR_PORT_MCP="${INSPECTOR_PORT_MCP:-9231}"
INSPECTOR_PORT_AUTH="${INSPECTOR_PORT_AUTH:-9232}"

# Check /etc/hosts
if ! grep -q 'local\.spike\.land' /etc/hosts 2>/dev/null; then
  echo "Missing /etc/hosts entry. Run:"
  echo "  sudo bash -c 'echo \"127.0.0.1 local.spike.land\" >> /etc/hosts'"
  exit 1
fi

# Generate certs if missing
if [ ! -f "$CERT_FILE" ] || [ ! -f "$KEY_FILE" ]; then
  echo "Generating TLS certificates..."
  if ! command -v mkcert &>/dev/null; then
    echo "mkcert not found. Install it: brew install mkcert nss"
    exit 1
  fi
  mkdir -p "$CERT_DIR"
  mkcert -cert-file "$CERT_FILE" -key-file "$KEY_FILE" \
    local.spike.land localhost 127.0.0.1
  echo "Certificates generated in $CERT_DIR"
fi

cleanup() {
  echo "Shutting down..."
  kill $PID_EDGE $PID_MCP $PID_AUTH $PID_APP 2>/dev/null || true
  wait 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "Starting mcp-auth on https://local.spike.land:8791 ..."
(cd "$ROOT/packages/mcp-auth" && npx wrangler dev --port 8791 --local-protocol=https \
  --inspector-port "$INSPECTOR_PORT_AUTH" \
  --https-key-path="$KEY_FILE" \
  --https-cert-path="$CERT_FILE") &
PID_AUTH=$!

echo "Starting spike-land-mcp on https://local.spike.land:8790 ..."
(cd "$ROOT/packages/spike-land-mcp" && npx wrangler dev --port 8790 --local-protocol=https \
  --inspector-port "$INSPECTOR_PORT_MCP" \
  --https-key-path="$KEY_FILE" \
  --https-cert-path="$CERT_FILE") &
PID_MCP=$!

echo "Starting spike-edge on https://local.spike.land:8787 ..."
(cd "$ROOT/packages/spike-edge" && npx wrangler dev --port 8787 --local-protocol=https \
  --inspector-port "$INSPECTOR_PORT_EDGE" \
  --https-key-path="$KEY_FILE" \
  --https-cert-path="$CERT_FILE") &
PID_EDGE=$!

echo "Starting spike-web on http://local.spike.land:5173 ..."
(cd "$ROOT/packages/spike-web" && npm run dev -- --host local.spike.land --port 5173) &
PID_APP=$!

echo ""
echo "  spike-web:      http://local.spike.land:5173"
echo "  spike-edge:     https://local.spike.land:8787"
echo "  spike-land-mcp: https://local.spike.land:8790"
echo "  mcp-auth:       https://local.spike.land:8791"
echo ""

wait
