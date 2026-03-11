/**
 * Tests for src/edge-api/main/api/routes/support.ts
 *
 * Covers:
 *   POST /api/support/fistbump
 *   GET  /api/support/engagement/:slug
 *   POST /api/support/donate
 *   POST /api/support/migration-checkout
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Hono } from "hono";
import { support } from "../routes/support.js";
import type { Env } from "../../core-logic/env.js";

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Build a minimal D1 mock covering the fistbump / donation queries. */
function createMockDB(
  opts: { insertError?: Error | null; fistbumpCount?: number; donationCount?: number } = {},
) {
  const { insertError = null, fistbumpCount = 1, donationCount: _donationCount = 0 } = opts;

  const runFn = insertError
    ? vi.fn().mockRejectedValue(insertError)
    : vi.fn().mockResolvedValue({ success: true });

  const firstFn = vi.fn().mockImplementation((sql?: string) => {
    void sql;
    // support_donations query returns donation count; fistbump query returns bump count
    return Promise.resolve({ cnt: fistbumpCount });
  });

  const bindFn = vi.fn().mockReturnValue({ run: runFn, first: firstFn });
  const prepareFn = vi.fn().mockReturnValue({ bind: bindFn, first: firstFn });

  return { prepare: prepareFn, bind: bindFn, run: runFn, first: firstFn } as unknown as D1Database;
}

/** Build a two-query mock (fistbumps + donations) for the engagement endpoint. */
function createEngagementMockDB(fistbumps: number, supporters: number): D1Database {
  let callIndex = 0;
  const counts = [fistbumps, supporters];

  const firstFn = vi.fn(() => Promise.resolve({ cnt: counts[callIndex++] ?? 0 }));
  const bindFn = vi.fn().mockReturnValue({ first: firstFn });
  const prepareFn = vi.fn().mockReturnValue({ bind: bindFn });

  return { prepare: prepareFn } as unknown as D1Database;
}

function createApp(env: Partial<Env> = {}) {
  const app = new Hono<{ Bindings: Env }>();
  app.use("*", async (c, next) => {
    Object.assign(c.env, env);
    await next();
  });
  app.route("/", support);
  return app;
}

function makeEnv(overrides: Partial<Env> = {}): Partial<Env> {
  return {
    DB: createMockDB() as D1Database,
    STRIPE_SECRET_KEY: "sk_test_fake",
    ...overrides,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// ─── POST /api/support/fistbump ──────────────────────────────────────────────

describe("POST /api/support/fistbump", () => {
  it("returns count on successful fist bump", async () => {
    const db = createMockDB({ fistbumpCount: 7 });
    const app = createApp(makeEnv({ DB: db }));

    const res = await app.request(
      "/api/support/fistbump",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: "my-post", clientId: "client-abc" }),
      },
      makeEnv({ DB: db }) as unknown as Env,
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.count).toBe(7);
    expect(body.alreadyBumped).toBeUndefined();
  });

  it("returns 400 for invalid JSON body", async () => {
    const app = createApp(makeEnv());

    const res = await app.request(
      "/api/support/fistbump",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "NOT JSON",
      },
      makeEnv() as unknown as Env,
    );

    expect(res.status).toBe(400);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe("Invalid JSON");
  });

  it("returns 400 when slug is missing", async () => {
    const app = createApp(makeEnv());

    const res = await app.request(
      "/api/support/fistbump",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: "client-abc" }),
      },
      makeEnv() as unknown as Env,
    );

    expect(res.status).toBe(400);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toMatch(/required/i);
  });

  it("returns 400 when clientId is missing", async () => {
    const app = createApp(makeEnv());

    const res = await app.request(
      "/api/support/fistbump",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: "my-post" }),
      },
      makeEnv() as unknown as Env,
    );

    expect(res.status).toBe(400);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toMatch(/required/i);
  });

  it("returns 400 when slug exceeds 200 characters", async () => {
    const app = createApp(makeEnv());

    const res = await app.request(
      "/api/support/fistbump",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: "a".repeat(201), clientId: "cid" }),
      },
      makeEnv() as unknown as Env,
    );

    expect(res.status).toBe(400);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe("Invalid input");
  });

  it("returns 400 when clientId exceeds 100 characters", async () => {
    const app = createApp(makeEnv());

    const res = await app.request(
      "/api/support/fistbump",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: "valid-slug", clientId: "x".repeat(101) }),
      },
      makeEnv() as unknown as Env,
    );

    expect(res.status).toBe(400);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe("Invalid input");
  });

  it("returns alreadyBumped=true on UNIQUE constraint violation", async () => {
    const uniqueError = new Error(
      "UNIQUE constraint failed: blog_engagement.slug, blog_engagement.client_id",
    );
    const db = createMockDB({ insertError: uniqueError, fistbumpCount: 3 });
    const app = createApp(makeEnv({ DB: db }));

    const res = await app.request(
      "/api/support/fistbump",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: "my-post", clientId: "client-abc" }),
      },
      makeEnv({ DB: db }) as unknown as Env,
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.alreadyBumped).toBe(true);
    expect(body.count).toBe(3);
  });

  it("returns 500 on unexpected DB error", async () => {
    const dbError = new Error("unexpected db failure");
    const db = createMockDB({ insertError: dbError });
    const app = createApp(makeEnv({ DB: db }));

    const res = await app.request(
      "/api/support/fistbump",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: "my-post", clientId: "client-abc" }),
      },
      makeEnv({ DB: db }) as unknown as Env,
    );

    expect(res.status).toBe(500);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toMatch(/fist bump/i);
  });

  it("accepts slug exactly 200 characters long", async () => {
    const db = createMockDB({ fistbumpCount: 1 });
    const app = createApp(makeEnv({ DB: db }));

    const res = await app.request(
      "/api/support/fistbump",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: "a".repeat(200), clientId: "cid" }),
      },
      makeEnv({ DB: db }) as unknown as Env,
    );

    expect(res.status).toBe(200);
  });

  it("defaults count to 1 when DB first() returns null", async () => {
    const runFn = vi.fn().mockResolvedValue({ success: true });
    const firstFn = vi.fn().mockResolvedValue(null);
    const bindFn = vi.fn().mockReturnValue({ run: runFn, first: firstFn });
    const prepareFn = vi.fn().mockReturnValue({ bind: bindFn });
    const db = { prepare: prepareFn } as unknown as D1Database;

    const app = createApp(makeEnv({ DB: db }));

    const res = await app.request(
      "/api/support/fistbump",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: "my-post", clientId: "cid" }),
      },
      makeEnv({ DB: db }) as unknown as Env,
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.count).toBe(1);
  });
});

// ─── GET /api/support/engagement/:slug ──────────────────────────────────────

describe("GET /api/support/engagement/:slug", () => {
  it("returns fistBumps and supporters counts", async () => {
    const db = createEngagementMockDB(12, 3);
    const app = createApp(makeEnv({ DB: db }));

    const res = await app.request(
      "/api/support/engagement/my-post",
      {},
      makeEnv({ DB: db }) as unknown as Env,
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.fistBumps).toBe(12);
    expect(body.supporters).toBe(3);
  });

  it("sets Cache-Control header for 60 seconds", async () => {
    const db = createEngagementMockDB(5, 1);
    const app = createApp(makeEnv({ DB: db }));

    const res = await app.request(
      "/api/support/engagement/my-post",
      {},
      makeEnv({ DB: db }) as unknown as Env,
    );

    expect(res.status).toBe(200);
    const cacheControl = res.headers.get("Cache-Control") ?? "";
    expect(cacheControl).toContain("max-age=60");
    expect(cacheControl).toContain("public");
  });

  it("returns zeros when DB results are null", async () => {
    const firstFn = vi.fn().mockResolvedValue(null);
    const bindFn = vi.fn().mockReturnValue({ first: firstFn });
    const prepareFn = vi.fn().mockReturnValue({ bind: bindFn });
    const db = { prepare: prepareFn } as unknown as D1Database;
    const app = createApp(makeEnv({ DB: db }));

    const res = await app.request(
      "/api/support/engagement/any-post",
      {},
      makeEnv({ DB: db }) as unknown as Env,
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.fistBumps).toBe(0);
    expect(body.supporters).toBe(0);
  });

  it("returns 400 when slug exceeds 200 characters", async () => {
    const app = createApp(makeEnv());

    const res = await app.request(
      `/api/support/engagement/${"a".repeat(201)}`,
      {},
      makeEnv() as unknown as Env,
    );

    expect(res.status).toBe(400);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe("Invalid slug");
  });

  it("returns zeros on DB error (graceful degradation)", async () => {
    const prepareFn = vi.fn().mockImplementation(() => {
      throw new Error("D1 unavailable");
    });
    const db = { prepare: prepareFn } as unknown as D1Database;
    const app = createApp(makeEnv({ DB: db }));

    const res = await app.request(
      "/api/support/engagement/my-post",
      {},
      makeEnv({ DB: db }) as unknown as Env,
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.fistBumps).toBe(0);
    expect(body.supporters).toBe(0);
  });
});

// ─── POST /api/support/donate ────────────────────────────────────────────────

describe("POST /api/support/donate", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            id: "cs_test_123",
            url: "https://checkout.stripe.com/pay/cs_test_123",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );
  });

  it("returns a checkout URL for a valid donation", async () => {
    const app = createApp(makeEnv());

    const res = await app.request(
      "/api/support/donate",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: "my-post", amount: 10, clientId: "cid" }),
      },
      makeEnv() as unknown as Env,
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.url).toBe("https://checkout.stripe.com/pay/cs_test_123");
  });

  it("returns 503 when Stripe key is not configured", async () => {
    const app = createApp({ ...makeEnv(), STRIPE_SECRET_KEY: "" });

    const res = await app.request(
      "/api/support/donate",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: "my-post", amount: 10 }),
      },
      { ...makeEnv(), STRIPE_SECRET_KEY: "" } as unknown as Env,
    );

    expect(res.status).toBe(503);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toMatch(/stripe/i);
  });

  it("returns 400 for invalid JSON", async () => {
    const app = createApp(makeEnv());

    const res = await app.request(
      "/api/support/donate",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "INVALID JSON",
      },
      makeEnv() as unknown as Env,
    );

    expect(res.status).toBe(400);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe("Invalid JSON");
  });

  it("returns 400 when slug is missing", async () => {
    const app = createApp(makeEnv());

    const res = await app.request(
      "/api/support/donate",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 10, clientId: "cid" }),
      },
      makeEnv() as unknown as Env,
    );

    expect(res.status).toBe(400);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toMatch(/slug/i);
  });

  it("returns 400 when slug exceeds 200 characters", async () => {
    const app = createApp(makeEnv());

    const res = await app.request(
      "/api/support/donate",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: "a".repeat(201), amount: 10 }),
      },
      makeEnv() as unknown as Env,
    );

    expect(res.status).toBe(400);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toMatch(/slug/i);
  });

  it("returns 400 when amount is below minimum (£1)", async () => {
    const app = createApp(makeEnv());

    const res = await app.request(
      "/api/support/donate",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: "my-post", amount: 0 }),
      },
      makeEnv() as unknown as Env,
    );

    expect(res.status).toBe(400);
    const body = (await res.json()) as Record<string, unknown>;
    expect(String(body.error)).toMatch(/amount/i);
  });

  it("returns 400 when amount exceeds maximum (£999)", async () => {
    const app = createApp(makeEnv());

    const res = await app.request(
      "/api/support/donate",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: "my-post", amount: 1000 }),
      },
      makeEnv() as unknown as Env,
    );

    expect(res.status).toBe(400);
    const body = (await res.json()) as Record<string, unknown>;
    expect(String(body.error)).toMatch(/amount/i);
  });

  it("returns 400 when amount is not a number", async () => {
    const app = createApp(makeEnv());

    const res = await app.request(
      "/api/support/donate",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: "my-post", amount: "ten" }),
      },
      makeEnv() as unknown as Env,
    );

    expect(res.status).toBe(400);
  });

  it("snaps amounts in the magic range (411–429) to 420", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ id: "cs_420", url: "https://checkout.stripe.com/pay/cs_420" }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    const app = createApp(makeEnv());

    await app.request(
      "/api/support/donate",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: "my-post", amount: 415 }),
      },
      makeEnv() as unknown as Env,
    );

    // The stripe call should use 42000 cents (420 * 100)
    const stripeBody = (fetchMock.mock.calls[0]?.[1] as RequestInit | undefined)?.body as string;
    const params = new URLSearchParams(stripeBody);
    expect(params.get("line_items[0][price_data][unit_amount]")).toBe("42000");
  });

  it("sends correct currency (GBP) to Stripe", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ id: "cs_gbp", url: "https://checkout.stripe.com/pay/cs_gbp" }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    const app = createApp(makeEnv());

    await app.request(
      "/api/support/donate",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: "my-post", amount: 5 }),
      },
      makeEnv() as unknown as Env,
    );

    const stripeBody = (fetchMock.mock.calls[0]?.[1] as RequestInit | undefined)?.body as string;
    const params = new URLSearchParams(stripeBody);
    expect(params.get("line_items[0][price_data][currency]")).toBe("gbp");
  });

  it("sends mode=payment and submit_type=donate to Stripe", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ id: "cs_pay", url: "https://checkout.stripe.com/pay/cs_pay" }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    const app = createApp(makeEnv());

    await app.request(
      "/api/support/donate",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: "my-post", amount: 5 }),
      },
      makeEnv() as unknown as Env,
    );

    const stripeBody = (fetchMock.mock.calls[0]?.[1] as RequestInit | undefined)?.body as string;
    const params = new URLSearchParams(stripeBody);
    expect(params.get("mode")).toBe("payment");
    expect(params.get("submit_type")).toBe("donate");
  });

  it("encodes slug in success/cancel URLs", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ id: "cs_enc", url: "https://checkout.stripe.com/pay/cs_enc" }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    const app = createApp(makeEnv());

    await app.request(
      "/api/support/donate",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: "my-special-post", amount: 5 }),
      },
      makeEnv() as unknown as Env,
    );

    const stripeBody = (fetchMock.mock.calls[0]?.[1] as RequestInit | undefined)?.body as string;
    const params = new URLSearchParams(stripeBody);
    expect(params.get("success_url")).toContain("my-special-post");
    expect(params.get("cancel_url")).toContain("my-special-post");
  });

  it("returns 502 when Stripe API returns an error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: { message: "Invalid API key" } }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    const app = createApp(makeEnv());

    const res = await app.request(
      "/api/support/donate",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: "my-post", amount: 10 }),
      },
      makeEnv() as unknown as Env,
    );

    expect(res.status).toBe(502);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toMatch(/checkout/i);
  });

  it("still returns URL even if DB insert for pending donation fails", async () => {
    const dbError = new Error("D1 connection refused");
    const runFn = vi.fn().mockRejectedValue(dbError);
    const bindFn = vi.fn().mockReturnValue({ run: runFn });
    const prepareFn = vi.fn().mockReturnValue({ bind: bindFn });
    const db = { prepare: prepareFn } as unknown as D1Database;

    const app = createApp(makeEnv({ DB: db }));

    const res = await app.request(
      "/api/support/donate",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: "my-post", amount: 10 }),
      },
      makeEnv({ DB: db }) as unknown as Env,
    );

    // The response should still succeed because the DB insert failure is non-fatal
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.url).toBeTruthy();
  });

  it("truncates clientId to 100 chars when constructing Stripe metadata", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ id: "cs_cid", url: "https://checkout.stripe.com/pay/cs_cid" }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    const app = createApp(makeEnv());
    const longClientId = "x".repeat(200);

    await app.request(
      "/api/support/donate",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: "my-post", amount: 5, clientId: longClientId }),
      },
      makeEnv() as unknown as Env,
    );

    const stripeBody = (fetchMock.mock.calls[0]?.[1] as RequestInit | undefined)?.body as string;
    const params = new URLSearchParams(stripeBody);
    const sentClientId = params.get("metadata[client_id]") ?? "";
    expect(sentClientId.length).toBe(100);
  });
});

// ─── POST /api/support/migration-checkout ────────────────────────────────────

describe("POST /api/support/migration-checkout", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(
            JSON.stringify({ id: "cs_mig_123", url: "https://checkout.stripe.com/pay/cs_mig_123" }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          ),
        ),
    );
  });

  it("returns checkout URL for the 'blog' tier", async () => {
    const app = createApp(makeEnv());

    const res = await app.request(
      "/api/support/migration-checkout",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: "blog", clientId: "cid" }),
      },
      makeEnv() as unknown as Env,
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.url).toBe("https://checkout.stripe.com/pay/cs_mig_123");
  });

  it("returns checkout URL for the 'script' tier", async () => {
    const app = createApp(makeEnv());

    const res = await app.request(
      "/api/support/migration-checkout",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: "script" }),
      },
      makeEnv() as unknown as Env,
    );

    expect(res.status).toBe(200);
  });

  it("returns checkout URL for the 'mcp' tier", async () => {
    const app = createApp(makeEnv());

    const res = await app.request(
      "/api/support/migration-checkout",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: "mcp" }),
      },
      makeEnv() as unknown as Env,
    );

    expect(res.status).toBe(200);
  });

  it("sends the correct amount for the blog tier (42000 cents)", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ id: "cs_blog", url: "https://checkout.stripe.com/pay/cs_blog" }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    const app = createApp(makeEnv());

    await app.request(
      "/api/support/migration-checkout",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: "blog" }),
      },
      makeEnv() as unknown as Env,
    );

    const stripeBody = (fetchMock.mock.calls[0]?.[1] as RequestInit | undefined)?.body as string;
    const params = new URLSearchParams(stripeBody);
    expect(params.get("line_items[0][price_data][unit_amount]")).toBe("42000");
  });

  it("sends the correct amount for the script tier (100000 cents)", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ id: "cs_script", url: "https://checkout.stripe.com/pay/cs_script" }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    const app = createApp(makeEnv());

    await app.request(
      "/api/support/migration-checkout",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: "script" }),
      },
      makeEnv() as unknown as Env,
    );

    const stripeBody = (fetchMock.mock.calls[0]?.[1] as RequestInit | undefined)?.body as string;
    const params = new URLSearchParams(stripeBody);
    expect(params.get("line_items[0][price_data][unit_amount]")).toBe("100000");
  });

  it("sends the correct amount for the mcp tier (1000000 cents)", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ id: "cs_mcp", url: "https://checkout.stripe.com/pay/cs_mcp" }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    const app = createApp(makeEnv());

    await app.request(
      "/api/support/migration-checkout",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: "mcp" }),
      },
      makeEnv() as unknown as Env,
    );

    const stripeBody = (fetchMock.mock.calls[0]?.[1] as RequestInit | undefined)?.body as string;
    const params = new URLSearchParams(stripeBody);
    expect(params.get("line_items[0][price_data][unit_amount]")).toBe("1000000");
  });

  it("uses submit_type=pay (not donate) for migration checkout", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ id: "cs_pay", url: "https://checkout.stripe.com/pay/cs_pay" }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    const app = createApp(makeEnv());

    await app.request(
      "/api/support/migration-checkout",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: "blog" }),
      },
      makeEnv() as unknown as Env,
    );

    const stripeBody = (fetchMock.mock.calls[0]?.[1] as RequestInit | undefined)?.body as string;
    const params = new URLSearchParams(stripeBody);
    expect(params.get("submit_type")).toBe("pay");
  });

  it("returns 503 when Stripe key is not configured", async () => {
    const app = createApp({ ...makeEnv(), STRIPE_SECRET_KEY: "" });

    const res = await app.request(
      "/api/support/migration-checkout",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: "blog" }),
      },
      { ...makeEnv(), STRIPE_SECRET_KEY: "" } as unknown as Env,
    );

    expect(res.status).toBe(503);
  });

  it("returns 400 for invalid JSON", async () => {
    const app = createApp(makeEnv());

    const res = await app.request(
      "/api/support/migration-checkout",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "INVALID JSON",
      },
      makeEnv() as unknown as Env,
    );

    expect(res.status).toBe(400);
  });

  it("returns 400 for unknown tier", async () => {
    const app = createApp(makeEnv());

    const res = await app.request(
      "/api/support/migration-checkout",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: "platinum" }),
      },
      makeEnv() as unknown as Env,
    );

    expect(res.status).toBe(400);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toMatch(/blog.*script.*mcp/i);
  });

  it("returns 400 when tier is missing", async () => {
    const app = createApp(makeEnv());

    const res = await app.request(
      "/api/support/migration-checkout",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: "cid" }),
      },
      makeEnv() as unknown as Env,
    );

    expect(res.status).toBe(400);
  });

  it("returns 502 when Stripe returns an error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: { message: "card declined" } }), {
          status: 402,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    const app = createApp(makeEnv());

    const res = await app.request(
      "/api/support/migration-checkout",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: "blog" }),
      },
      makeEnv() as unknown as Env,
    );

    expect(res.status).toBe(502);
  });

  it("uses slug migration-<tier> in the DB insert", async () => {
    const runFn = vi.fn().mockResolvedValue({ success: true });
    const bindFn = vi.fn().mockReturnValue({ run: runFn });
    const prepareFn = vi.fn().mockReturnValue({ bind: bindFn });
    const db = { prepare: prepareFn } as unknown as D1Database;

    const app = createApp(makeEnv({ DB: db }));

    await app.request(
      "/api/support/migration-checkout",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: "script" }),
      },
      makeEnv({ DB: db }) as unknown as Env,
    );

    // The bind call includes the slug as the second argument
    const bindArgs = (bindFn.mock.calls[0] as unknown[]) ?? [];
    expect(bindArgs[1]).toBe("migration-script");
  });

  it("still returns URL even if DB insert for pending purchase fails", async () => {
    const runFn = vi.fn().mockRejectedValue(new Error("D1 timeout"));
    const bindFn = vi.fn().mockReturnValue({ run: runFn });
    const prepareFn = vi.fn().mockReturnValue({ bind: bindFn });
    const db = { prepare: prepareFn } as unknown as D1Database;

    const app = createApp(makeEnv({ DB: db }));

    const res = await app.request(
      "/api/support/migration-checkout",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: "blog" }),
      },
      makeEnv({ DB: db }) as unknown as Env,
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.url).toBeTruthy();
  });

  it("truncates clientId to 100 chars in Stripe metadata", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ id: "cs_cid2", url: "https://checkout.stripe.com/pay/cs_cid2" }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    const app = createApp(makeEnv());

    await app.request(
      "/api/support/migration-checkout",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: "blog", clientId: "z".repeat(200) }),
      },
      makeEnv() as unknown as Env,
    );

    const stripeBody = (fetchMock.mock.calls[0]?.[1] as RequestInit | undefined)?.body as string;
    const params = new URLSearchParams(stripeBody);
    expect((params.get("metadata[client_id]") ?? "").length).toBe(100);
  });

  it("uses GBP currency for the 'script' tier", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "cs_gbp_script",
          url: "https://checkout.stripe.com/pay/cs_gbp_script",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const app = createApp(makeEnv());

    await app.request(
      "/api/support/migration-checkout",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: "script" }),
      },
      makeEnv() as unknown as Env,
    );

    const stripeBody = (fetchMock.mock.calls[0]?.[1] as RequestInit | undefined)?.body as string;
    const params = new URLSearchParams(stripeBody);
    expect(params.get("line_items[0][price_data][currency]")).toBe("gbp");
  });

  it("uses USD currency for the 'blog' tier", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ id: "cs_usd_blog", url: "https://checkout.stripe.com/pay/cs_usd_blog" }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    const app = createApp(makeEnv());

    await app.request(
      "/api/support/migration-checkout",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: "blog" }),
      },
      makeEnv() as unknown as Env,
    );

    const stripeBody = (fetchMock.mock.calls[0]?.[1] as RequestInit | undefined)?.body as string;
    const params = new URLSearchParams(stripeBody);
    expect(params.get("line_items[0][price_data][currency]")).toBe("usd");
  });

  it("sets success_url to /migrate?success=<tier>", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ id: "cs_url", url: "https://checkout.stripe.com/pay/cs_url" }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    const app = createApp(makeEnv());

    await app.request(
      "/api/support/migration-checkout",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: "mcp" }),
      },
      makeEnv() as unknown as Env,
    );

    const stripeBody = (fetchMock.mock.calls[0]?.[1] as RequestInit | undefined)?.body as string;
    const params = new URLSearchParams(stripeBody);
    expect(params.get("success_url")).toContain("success=mcp");
    expect(params.get("cancel_url")).toContain("spike.land/migrate");
  });

  it("prevents prototype pollution via __proto__ tier key", async () => {
    const app = createApp(makeEnv());

    const res = await app.request(
      "/api/support/migration-checkout",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: "__proto__" }),
      },
      makeEnv() as unknown as Env,
    );

    // __proto__ is not in MIGRATION_TIERS, must return 400
    expect(res.status).toBe(400);
  });

  it("prevents access via constructor tier key", async () => {
    const app = createApp(makeEnv());

    const res = await app.request(
      "/api/support/migration-checkout",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: "constructor" }),
      },
      makeEnv() as unknown as Env,
    );

    expect(res.status).toBe(400);
  });
});
