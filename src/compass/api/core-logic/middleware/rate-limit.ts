import type { Context, Next } from "hono";
import type { ContextVariables } from "../../types.js";

interface WindowEntry {
  /** Unix ms timestamps of requests within the current window. */
  timestamps: number[];
}

/**
 * In-memory sliding-window rate limiter.
 *
 * Uses a Map keyed by client identifier (IP address or userId).  Each entry
 * stores only the request timestamps that fall inside the rolling window, so
 * memory per key is bounded to `maxRequests` numbers.
 *
 * NOTE: this state is per-Worker-instance.  For true global rate limiting on
 * Cloudflare Workers use a Durable Object instead.
 */
export class RateLimiter {
  private readonly maxRequests: number;
  private readonly windowMs: number;
  private readonly store = new Map<string, WindowEntry>();

  constructor(maxRequests: number, windowMs: number) {
    if (maxRequests < 1) {
      throw new RangeError("maxRequests must be >= 1");
    }
    if (windowMs < 1) {
      throw new RangeError("windowMs must be >= 1");
    }
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Returns true when the key is within its allowed quota, false when it has
   * exceeded the limit.  Always records the attempt when returning true.
   */
  check(key: string): boolean {
    const now = Date.now();
    const cutoff = now - this.windowMs;

    let entry = this.store.get(key);
    if (!entry) {
      entry = { timestamps: [] };
      this.store.set(key, entry);
    }

    // Evict timestamps outside the sliding window
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

    if (entry.timestamps.length >= this.maxRequests) {
      return false;
    }

    entry.timestamps.push(now);
    return true;
  }

  /**
   * Returns the number of milliseconds until the oldest request in the window
   * expires, giving the caller a Retry-After value.
   */
  retryAfterMs(key: string): number {
    const entry = this.store.get(key);
    if (!entry || entry.timestamps.length === 0) return 0;
    const oldest = entry.timestamps[0];
    if (oldest === undefined) return 0;
    return Math.max(0, oldest + this.windowMs - Date.now());
  }

  /**
   * Hono middleware factory.  Identifies clients by X-Forwarded-For, CF-Connecting-IP,
   * or the context userId (whichever is most specific).
   */
  get middleware() {
    return async (
      c: Context<{ Variables: ContextVariables }>,
      next: Next,
    ): Promise<Response | void> => {
      const key = this.resolveKey(c);
      const allowed = this.check(key);

      if (!allowed) {
        const retryAfterSec = Math.ceil(this.retryAfterMs(key) / 1000);
        c.header("Retry-After", String(retryAfterSec));
        c.header("X-RateLimit-Limit", String(this.maxRequests));
        c.header("X-RateLimit-Remaining", "0");
        return c.json(
          {
            success: false,
            error: {
              code: "RATE_LIMITED",
              message: `Too many requests. Retry after ${retryAfterSec}s.`,
            },
          },
          429,
        );
      }

      return next();
    };
  }

  private resolveKey(c: Context<{ Variables: ContextVariables }>): string {
    // Prefer authenticated userId so limits are per-user, not per-IP
    try {
      const userId = c.get("userId");
      if (userId) return `user:${userId}`;
    } catch {
      // userId not set yet (middleware runs before auth)
    }
    const ip =
      c.req.header("cf-connecting-ip") ??
      c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";
    return `ip:${ip}`;
  }
}
