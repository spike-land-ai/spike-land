/**
 * KV-backed sliding window rate limiter.
 * Replaces Upstash Redis from spike.land.
 *
 * Note: KV is eventually consistent so this is best-effort under high
 * concurrency. The await on put() ensures at least single-request
 * consistency and reduces the TOCTOU window vs fire-and-forget.
 */

const WINDOW_MS = 60 * 1000; // 60 seconds
const MAX_REQUESTS = 120;

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

/**
 * @param eloMultiplier - ELO-based rate limit multiplier (1x normal, 2x for low ELO, 4x for very low).
 *   Higher multiplier = stricter limit. Effective max = maxRequests / eloMultiplier.
 */
export async function checkRateLimit(
  key: string,
  kv: KVNamespace,
  maxRequests = MAX_REQUESTS,
  windowMs = WINDOW_MS,
  eloMultiplier = 1,
): Promise<{ isLimited: boolean; resetAt: number; remaining: number }> {
  const effectiveMax = Math.max(1, Math.floor(maxRequests / eloMultiplier));
  const now = Date.now();
  const kvKey = `rl:${key}`;

  const raw = await kv.get(kvKey);
  let entry: RateLimitEntry = { count: 0, windowStart: now };

  if (raw) {
    try {
      const parsed = JSON.parse(raw) as RateLimitEntry;
      // Reset window if expired
      if (now - parsed.windowStart > windowMs) {
        entry = { count: 0, windowStart: now };
      } else {
        entry = parsed;
      }
    } catch {
      entry = { count: 0, windowStart: now };
    }
  }

  entry.count++;
  const resetAt = entry.windowStart + windowMs;
  const isLimited = entry.count > effectiveMax;
  const remaining = Math.max(0, effectiveMax - entry.count);

  // Await the put to reduce the TOCTOU window. KV is still eventually
  // consistent so this isn't fully atomic, but it's significantly better
  // than fire-and-forget under normal load patterns.
  await kv.put(kvKey, JSON.stringify(entry), {
    expirationTtl: Math.ceil(windowMs / 1000) + 10,
  });

  return { isLimited, resetAt, remaining };
}
