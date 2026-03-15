#!/bin/bash
# ============================================================================
# clean-slate.sh — Run this when spike.land CI is green and you're ready
# ============================================================================
# March 15, 2026 — Zoltan steps back. The platform is the community's now.
# ============================================================================

set -e

echo ""
echo "=========================================="
echo "  CLEAN SLATE — spike.land disconnection"
echo "=========================================="
echo ""

# ── Step 1: Remove spike-land-ai repo ──────────────────────────────────────
echo "[1/6] Removing ~/Developer/spike-land-ai..."
sudo rm -rf ~/Developer/spike-land-ai
echo "  Done."

# ── Step 2: Remove npm registry config for @spike-land-ai ─────────────────
echo "[2/6] Cleaning npm registry config..."
if [ -f ~/.npmrc ]; then
  sed -i '' '/@spike-land-ai/d' ~/.npmrc 2>/dev/null || true
  echo "  Removed @spike-land-ai registry entries from .npmrc"
else
  echo "  No .npmrc found, skipping."
fi

# ── Step 3: Remove Claude Code project memory for spike-land-ai ───────────
echo "[3/6] Removing Claude Code project memory..."
rm -rf ~/.claude/projects/-Users-z-Developer-spike-land-ai/
echo "  Done."

# ── Step 4: Remove spike-land secrets from ~/.secrets ─────────────────────
echo "[4/6] Cleaning spike-land secrets..."
if [ -f ~/.secrets ]; then
  sed -i '' '/SPIKE_LAND\|CLOUDFLARE_API_TOKEN\|CLOUDFLARE_ACCOUNT_ID/d' ~/.secrets 2>/dev/null || true
  echo "  Removed spike-land entries from .secrets"
else
  echo "  No .secrets found, skipping."
fi

# ── Step 5: Remove wrangler config ────────────────────────────────────────
echo "[5/6] Cleaning wrangler credentials..."
if [ -d ~/.wrangler ]; then
  echo "  WARNING: ~/.wrangler contains Cloudflare auth tokens."
  echo "  Run 'wrangler logout' before deleting, or transfer to Felix first."
  echo "  Skipping automatic deletion — do this manually."
else
  echo "  No .wrangler found, skipping."
fi

echo ""
echo "=========================================="
echo "  MANUAL STEPS (do these yourself)"
echo "=========================================="
echo ""
echo "  [ ] Transfer spike-land-ai GitHub org ownership to Felix"
echo "  [ ] Remove yourself from spike-land-ai org on GitHub"
echo "  [ ] Transfer Cloudflare account to Felix (or remove your access)"
echo "  [ ] Run 'wrangler logout' to clear CF auth"
echo "  [ ] Clear spike.land cookies in Chrome (Settings > Privacy > Cookies)"
echo "  [ ] Cancel Google AI Ultra if no longer needed (~£250/mo)"
echo ""
echo "=========================================="
echo "  KEEP THESE (your personal assets)"
echo "=========================================="
echo ""
echo "  ~/Developer/spike-land-ai/new_chapter → github.com/zerdos/new_chapter"
echo "  The BAZDMEG method (in your head + new_chapter repo)"
echo "  The strange loop thesis (published on hup.hu)"
echo "  The GP Brighton case study (published)"
echo "  Your personal GitHub: github.com/zerdos"
echo ""
echo "=========================================="
echo ""
echo "Clean slate. New chapter."
echo "Choose one box."
echo ""
