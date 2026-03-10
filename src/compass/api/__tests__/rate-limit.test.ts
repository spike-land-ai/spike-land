import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RateLimiter } from "../core-logic/middleware/rate-limit.js";

// ---------------------------------------------------------------------------
// Unit tests for RateLimiter.check (pure logic — no HTTP)
// ---------------------------------------------------------------------------

describe("RateLimiter — constructor validation", () => {
  it("throws when maxRequests < 1", () => {
    expect(() => new RateLimiter(0, 1000)).toThrow(RangeError);
  });

  it("throws when windowMs < 1", () => {
    expect(() => new RateLimiter(5, 0)).toThrow(RangeError);
  });

  it("constructs successfully with valid arguments", () => {
    expect(() => new RateLimiter(10, 60_000)).not.toThrow();
  });
});

describe("RateLimiter.check — sliding window", () => {
  it("allows requests up to the limit", () => {
    const limiter = new RateLimiter(3, 60_000);
    expect(limiter.check("user:1")).toBe(true);
    expect(limiter.check("user:1")).toBe(true);
    expect(limiter.check("user:1")).toBe(true);
  });

  it("blocks the request that exceeds the limit", () => {
    const limiter = new RateLimiter(3, 60_000);
    limiter.check("user:2");
    limiter.check("user:2");
    limiter.check("user:2");
    expect(limiter.check("user:2")).toBe(false);
  });

  it("isolates counters per key", () => {
    const limiter = new RateLimiter(2, 60_000);
    limiter.check("user:a");
    limiter.check("user:a");
    expect(limiter.check("user:a")).toBe(false);
    // user:b has its own fresh counter
    expect(limiter.check("user:b")).toBe(true);
  });

  it("evicts timestamps outside the window", () => {
    vi.useFakeTimers();
    const limiter = new RateLimiter(2, 1_000); // 1-second window
    limiter.check("user:3");
    limiter.check("user:3");
    expect(limiter.check("user:3")).toBe(false);

    // Advance past the window — old timestamps evicted
    vi.advanceTimersByTime(1_100);
    expect(limiter.check("user:3")).toBe(true);
    vi.useRealTimers();
  });
});

describe("RateLimiter.retryAfterMs", () => {
  it("returns 0 for an unknown key", () => {
    const limiter = new RateLimiter(5, 10_000);
    expect(limiter.retryAfterMs("unknown")).toBe(0);
  });

  it("returns a positive value when the window is not yet expired", () => {
    vi.useFakeTimers();
    const limiter = new RateLimiter(1, 5_000);
    limiter.check("user:x");
    limiter.check("user:x"); // triggers limit recording

    const ms = limiter.retryAfterMs("user:x");
    expect(ms).toBeGreaterThan(0);
    expect(ms).toBeLessThanOrEqual(5_000);
    vi.useRealTimers();
  });
});

// ---------------------------------------------------------------------------
// HTTP-level tests using Hono test client
// ---------------------------------------------------------------------------

import { Hono } from "hono";
import type { ContextVariables } from "../types.js";

function buildTestApp(maxRequests: number, windowMs: number) {
  const app = new Hono<{ Variables: ContextVariables }>();
  const limiter = new RateLimiter(maxRequests, windowMs);
  app.use("*", limiter.middleware);
  app.get("/ping", (c) => c.json({ ok: true }));
  return app;
}

describe("RateLimiter middleware — HTTP responses", () => {
  let app: ReturnType<typeof buildTestApp>;

  beforeEach(() => {
    vi.useFakeTimers();
    app = buildTestApp(2, 60_000);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 200 for requests within the limit", async () => {
    const r1 = await app.request("/ping", {
      headers: { "cf-connecting-ip": "1.2.3.4" },
    });
    expect(r1.status).toBe(200);

    const r2 = await app.request("/ping", {
      headers: { "cf-connecting-ip": "1.2.3.4" },
    });
    expect(r2.status).toBe(200);
  });

  it("returns 429 when the limit is exceeded", async () => {
    const headers = { "cf-connecting-ip": "5.6.7.8" };
    await app.request("/ping", { headers });
    await app.request("/ping", { headers });
    const r3 = await app.request("/ping", { headers });

    expect(r3.status).toBe(429);
    const body = await r3.json<{ success: boolean; error: { code: string } }>();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("RATE_LIMITED");
  });

  it("includes Retry-After header on 429", async () => {
    const headers = { "cf-connecting-ip": "9.10.11.12" };
    await app.request("/ping", { headers });
    await app.request("/ping", { headers });
    const r = await app.request("/ping", { headers });

    expect(r.status).toBe(429);
    expect(r.headers.get("retry-after")).not.toBeNull();
  });

  it("allows requests again after the window expires", async () => {
    const headers = { "cf-connecting-ip": "13.14.15.16" };
    await app.request("/ping", { headers });
    await app.request("/ping", { headers });
    const blocked = await app.request("/ping", { headers });
    expect(blocked.status).toBe(429);

    vi.advanceTimersByTime(61_000);
    const r = await app.request("/ping", { headers });
    expect(r.status).toBe(200);
  });
});
