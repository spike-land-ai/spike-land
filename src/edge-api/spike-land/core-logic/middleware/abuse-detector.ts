interface AbuseState {
  calls: number;
  errors: number;
  flagged: boolean;
}

/**
 * Tracks per-user: call count in 10s window (KV, 60s TTL)
 * - >20 calls in 10s -> abuse_flag
 * - >10 errors in 10s -> abuse_flag
 */
export async function detectAbuse(
  kv: KVNamespace,
  userId: string,
  outcome: "success" | "error",
): Promise<boolean> {
  const now = Date.now();
  const windowKey = `abuse:${userId}:${Math.floor(now / 10000)}`; // 10s window

  const raw = await kv.get(windowKey);
  let state: AbuseState = { calls: 0, errors: 0, flagged: false };
  if (raw) {
    try {
      state = JSON.parse(raw);
    } catch {
      // Corrupt KV data — treat as fresh state (safe default)
    }
  }

  if (state.flagged) return false; // Already flagged this window

  state.calls++;
  if (outcome === "error") {
    state.errors++;
  } else {
    // Reset errors if there's a success, acting like a consecutive error counter within the window
    state.errors = 0;
  }

  let shouldFlag = false;
  if (state.calls > 20 || state.errors > 10) {
    shouldFlag = true;
    state.flagged = true;
  }

  await kv.put(windowKey, JSON.stringify(state), { expirationTtl: 60 });

  return shouldFlag;
}
