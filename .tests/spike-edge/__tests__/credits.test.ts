import { describe, expect, it, vi } from "vitest";
import { Hono } from "hono";
import type { Env } from "../../../src/spike-edge/env.js";
import { credits } from "../../../src/spike-edge/routes/credits.js";

function createMockEnv(overrides: Partial<Env> = {}): Env {
  return {
    DB: {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
        all: vi.fn().mockResolvedValue({ results: [] }),
        run: vi.fn().mockResolvedValue({}),
      }),
      batch: vi.fn().mockResolvedValue([]),
    } as unknown as D1Database,
    STRIPE_SECRET_KEY: "sk_test_xxx",
    INTERNAL_SERVICE_SECRET: "secret",
    ...overrides,
  } as unknown as Env;
}

function makeApp(userId?: string) {
  const app = new Hono<{ Bindings: Env }>();
  if (userId) {
    app.use("*", async (c, next) => {
      c.set("userId" as never, userId as never);
      await next();
    });
  }
  app.route("/", credits);
  return app;
}

describe("credits — GET /api/credits/balance", () => {
  it("returns 401 when no userId", async () => {
    const app = makeApp();
    const env = createMockEnv();
    const res = await app.request("/api/credits/balance", {}, env);
    expect(res.status).toBe(401);
  });

  it("returns balance data for authenticated user", async () => {
    const today = new Date().toISOString().slice(0, 10);
    const prepareMock = vi.fn().mockImplementation((sql: string) => ({
      bind: vi.fn().mockReturnThis(),
      run: vi.fn().mockResolvedValue({}),
      all: vi.fn().mockResolvedValue({ results: [] }),
      first: vi.fn().mockImplementation(() => {
        if (sql.includes("access_grants")) return Promise.resolve(null);
        if (sql.includes("subscriptions")) return Promise.resolve(null);
        if (sql.includes("credit_balances") && sql.includes("last_daily_grant")) {
          return Promise.resolve({ balance: 45, daily_limit: 50, last_daily_grant: today });
        }
        if (sql.includes("credit_ledger") && sql.includes("SUM")) {
          return Promise.resolve({ used: 5 });
        }
        return Promise.resolve(null);
      }),
    }));

    const env = createMockEnv({
      DB: { prepare: prepareMock, batch: vi.fn().mockResolvedValue([]) } as unknown as D1Database,
    });

    const app = makeApp("user1");
    const res = await app.request("/api/credits/balance", {}, env);
    expect(res.status).toBe(200);
    const body = await res.json<{ balance: number; dailyLimit: number; tier: string; usedToday: number }>();
    expect(body.balance).toBe(45);
    expect(body.dailyLimit).toBe(50);
    expect(typeof body.tier).toBe("string");
  });
});

describe("credits — POST /api/credits/purchase", () => {
  it("returns 401 when no userId", async () => {
    const app = makeApp();
    const env = createMockEnv();
    const res = await app.request("/api/credits/purchase", {
      method: "POST",
      body: JSON.stringify({ pack: 500 }),
      headers: { "Content-Type": "application/json" },
    }, env);
    expect(res.status).toBe(401);
  });

  it("returns 503 when no Stripe key", async () => {
    const app = makeApp("user1");
    const env = createMockEnv({ STRIPE_SECRET_KEY: "" });
    const res = await app.request("/api/credits/purchase", {
      method: "POST",
      body: JSON.stringify({ pack: 500 }),
      headers: { "Content-Type": "application/json" },
    }, env);
    expect(res.status).toBe(503);
  });

  it("returns 400 for invalid JSON body", async () => {
    const app = makeApp("user1");
    const env = createMockEnv();
    const res = await app.request("/api/credits/purchase", {
      method: "POST",
      body: "not json",
      headers: { "Content-Type": "application/json" },
    }, env);
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid pack size", async () => {
    const app = makeApp("user1");
    const env = createMockEnv();
    const res = await app.request("/api/credits/purchase", {
      method: "POST",
      body: JSON.stringify({ pack: 999 }),
      headers: { "Content-Type": "application/json" },
    }, env);
    expect(res.status).toBe(400);
    const body = await res.json<{ error: string }>();
    expect(body.error).toContain("Invalid pack");
    expect(body.error).toContain("500");
  });

  it("returns 502 when Stripe price lookup fails", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: "not found" }), { status: 404 }),
    );

    const app = makeApp("user1");
    const env = createMockEnv();
    const res = await app.request("/api/credits/purchase", {
      method: "POST",
      body: JSON.stringify({ pack: 500 }),
      headers: { "Content-Type": "application/json" },
    }, env);
    expect(res.status).toBe(502);
  });

  it("returns 404 when no price found for pack", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: [] }), { status: 200 }),
    );

    const app = makeApp("user1");
    const env = createMockEnv();
    const res = await app.request("/api/credits/purchase", {
      method: "POST",
      body: JSON.stringify({ pack: 500 }),
      headers: { "Content-Type": "application/json" },
    }, env);
    expect(res.status).toBe(404);
  });

  it("creates checkout session for valid pack", async () => {
    let fetchCallCount = 0;
    globalThis.fetch = vi.fn().mockImplementation(() => {
      fetchCallCount++;
      if (fetchCallCount === 1) {
        // Stripe price lookup
        return Promise.resolve(new Response(JSON.stringify({ data: [{ id: "price_abc" }] }), { status: 200 }));
      }
      // Checkout session creation
      return Promise.resolve(new Response(JSON.stringify({ url: "https://checkout.stripe.com/session" }), { status: 200 }));
    });

    const app = makeApp("user1");
    const env = createMockEnv();
    const res = await app.request("/api/credits/purchase", {
      method: "POST",
      body: JSON.stringify({ pack: 500 }),
      headers: { "Content-Type": "application/json" },
    }, env);
    expect(res.status).toBe(200);
    const body = await res.json<{ url: string }>();
    expect(body.url).toContain("stripe.com");
  });

  it("returns 502 when checkout session creation fails", async () => {
    let fetchCallCount = 0;
    globalThis.fetch = vi.fn().mockImplementation(() => {
      fetchCallCount++;
      if (fetchCallCount === 1) {
        return Promise.resolve(new Response(JSON.stringify({ data: [{ id: "price_abc" }] }), { status: 200 }));
      }
      return Promise.resolve(new Response(JSON.stringify({ error: "session failed" }), { status: 500 }));
    });

    const app = makeApp("user1");
    const env = createMockEnv();
    const res = await app.request("/api/credits/purchase", {
      method: "POST",
      body: JSON.stringify({ pack: 2500 }),
      headers: { "Content-Type": "application/json" },
    }, env);
    expect(res.status).toBe(502);
  });

  it("returns 502 when no checkout URL returned", async () => {
    let fetchCallCount = 0;
    globalThis.fetch = vi.fn().mockImplementation(() => {
      fetchCallCount++;
      if (fetchCallCount === 1) {
        return Promise.resolve(new Response(JSON.stringify({ data: [{ id: "price_abc" }] }), { status: 200 }));
      }
      return Promise.resolve(new Response(JSON.stringify({ id: "cs_123" /* no url */ }), { status: 200 }));
    });

    const app = makeApp("user1");
    const env = createMockEnv();
    const res = await app.request("/api/credits/purchase", {
      method: "POST",
      body: JSON.stringify({ pack: 7500 }),
      headers: { "Content-Type": "application/json" },
    }, env);
    expect(res.status).toBe(502);
  });
});
