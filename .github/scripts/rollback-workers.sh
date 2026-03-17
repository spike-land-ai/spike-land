#!/usr/bin/env bash
# rollback-workers.sh — Roll back one or all Cloudflare Workers to their
# previous deployment using `wrangler rollback`.
#
# Usage:
#   rollback-workers.sh all
#       Roll back every worker listed in WORKERS array below.
#
#   rollback-workers.sh <worker-name>
#       Roll back a single worker by its wrangler service name.
#
#   rollback-workers.sh <worker-name> <version-id>
#       Roll back to a specific Cloudflare deployment version ID (UUID).
#       Use `wrangler deployments list --name <worker>` to find version IDs.
#
# Requirements:
#   - CLOUDFLARE_API_TOKEN must be set in the environment.
#   - npx / wrangler must be available on PATH.
#   - The caller must have Rollback permission on the Cloudflare account.
#
# Exit codes:
#   0 — all rollbacks succeeded
#   1 — one or more rollbacks failed (details printed to stderr)
#
# Notes on wrangler rollback behaviour:
#   `wrangler rollback [--deployment-id <id>]` reverts the named worker to the
#   previous stable deployment. If --deployment-id is provided, wrangler rolls
#   back to that specific version. This is a live traffic switch — it takes
#   effect within seconds, with no cold-start penalty.
#
#   If a deployment has never been published (e.g., a net-new worker), wrangler
#   rollback will exit non-zero with "no previous deployment". The script
#   captures this and continues rolling back other workers.

set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

# Canonical list of all workers in deploy order (wave 1 first, then wave 2).
# These are the wrangler service names (name = "..." in wrangler.toml).
WAVE1_WORKERS=(
  transpile
  mcp-auth
  spike-land-mcp
  spike-review
  image-studio-worker
  status
)

WAVE2_WORKERS=(
  spike-land-backend
  spike-edge
)

ALL_WORKERS=("${WAVE1_WORKERS[@]}" "${WAVE2_WORKERS[@]}")

# Map from script-facing short names to wrangler package directories.
# Entries are relative to the repo root (i.e., packages/<dir>).
declare -A WORKER_DIR=(
  [transpile]="packages/transpile"
  [mcp-auth]="packages/mcp-auth"
  [spike-land-mcp]="packages/spike-land-mcp"
  [spike-review]="packages/spike-review"
  [image-studio-worker]="packages/image-studio-worker"
  [status]="packages/status"
  [spike-land-backend]="packages/spike-land-backend"
  [spike-edge]="packages/spike-edge"
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

log()  { echo "[rollback] $*"; }
err()  { echo "[rollback] ERROR: $*" >&2; }

require_token() {
  if [ -z "${CLOUDFLARE_API_TOKEN:-}" ]; then
    err "CLOUDFLARE_API_TOKEN is not set. Cannot roll back."
    exit 1
  fi
}

# rollback_worker <name> [<version-id>]
# Returns 0 on success, 1 on failure (never exits the script directly so we
# can collect all failures before exiting).
rollback_worker() {
  local name="$1"
  local version_id="${2:-}"
  local dir="${WORKER_DIR[$name]:-}"

  if [ -z "$dir" ]; then
    err "Unknown worker '$name'. Add it to WORKER_DIR in rollback-workers.sh."
    return 1
  fi

  if [ ! -d "$dir" ]; then
    err "Package directory '$dir' does not exist. Is the repo checked out fully?"
    return 1
  fi

  local cmd="npx wrangler rollback"
  if [ -n "$version_id" ]; then
    cmd="$cmd --deployment-id $version_id"
  fi
  # --yes suppresses the interactive confirmation prompt in CI.
  cmd="$cmd --yes"

  log "Rolling back '$name' (dir: $dir)${version_id:+ to version $version_id}..."
  if (cd "$dir" && eval "$cmd"); then
    log "  '$name' rolled back successfully."
    return 0
  else
    local rc=$?
    err "  '$name' rollback failed (exit $rc)."
    return 1
  fi
}

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------

TARGET="${1:-}"
VERSION_ID="${2:-}"

if [ -z "$TARGET" ]; then
  err "Usage: rollback-workers.sh <worker-name|all> [<version-id>]"
  exit 1
fi

require_token

FAIL_COUNT=0

if [ "$TARGET" = "all" ]; then
  if [ -n "$VERSION_ID" ]; then
    err "Cannot specify a version-id when rolling back 'all' workers."
    err "Roll back individual workers by name to pin a specific version."
    exit 1
  fi

  log "Rolling back all ${#ALL_WORKERS[@]} workers..."

  # Roll back wave 2 first (they depend on wave 1), then wave 1.
  # This mirrors the reverse of the deploy order to minimise the window
  # where a new wave-2 worker is pointed at old wave-1 infrastructure.
  log "Wave 2 rollback (spike-land-backend, spike-edge)..."
  for w in "${WAVE2_WORKERS[@]}"; do
    rollback_worker "$w" || ((FAIL_COUNT++))
  done

  log "Wave 1 rollback (independent workers)..."
  for w in "${WAVE1_WORKERS[@]}"; do
    rollback_worker "$w" || ((FAIL_COUNT++))
  done

else
  # Single-worker rollback, with optional version pin.
  rollback_worker "$TARGET" "$VERSION_ID" || ((FAIL_COUNT++))
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------

if [ "$FAIL_COUNT" -gt 0 ]; then
  err "$FAIL_COUNT worker(s) failed to roll back. Check output above."
  err "Manual recovery: wrangler rollback --name <worker> [--deployment-id <id>]"
  exit 1
fi

log "Rollback complete. All targeted workers reverted to previous deployments."
