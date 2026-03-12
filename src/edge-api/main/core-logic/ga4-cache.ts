/**
 * In-memory response cache with TTLs based on time range.
 * Founder-only = very low request volume, in-memory is fine.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

const RANGE_TTLS: Record<string, number> = {
  // Realtime: 30s
  "1m": 30_000,
  "5m": 30_000,
  "15m": 30_000,
  // Short: 5 min
  "1h": 5 * 60_000,
  "6h": 5 * 60_000,
  "24h": 5 * 60_000,
  // Medium: 30 min
  "7d": 30 * 60_000,
  "30d": 30 * 60_000,
  // Long: 2 hours
  "3mo": 2 * 60 * 60_000,
  "6mo": 2 * 60 * 60_000,
  "1y": 2 * 60 * 60_000,
  "3y": 2 * 60 * 60_000,
};

// Special TTL for realtime endpoint (no range param)
const REALTIME_TTL = 30_000;

export function getCachedResponse<T>(endpoint: string, range: string): T | null {
  const key = `${endpoint}:${range}`;
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

export function setCachedResponse<T>(endpoint: string, range: string, data: T): void {
  const key = `${endpoint}:${range}`;
  const ttl = range === "realtime" ? REALTIME_TTL : (RANGE_TTLS[range] ?? 5 * 60_000);
  cache.set(key, { data, expiresAt: Date.now() + ttl });
}
