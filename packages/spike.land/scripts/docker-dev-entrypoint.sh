#!/bin/sh
set -e
echo "[entrypoint] Running db:push in background..."
yarn db:push --accept-data-loss > /tmp/db-push.log 2>&1 &
echo "[entrypoint] Starting Next.js dev server..."
exec yarn dev
