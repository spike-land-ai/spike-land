/**
 * Tests for src/edge-api/main/api/routes/support.ts
 *
 * Covers:
 *   POST /api/support/migration-checkout
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Hono } from "hono";
import { support } from "../routes/support.js";
import type { Env } from "../../core-logic/env.js";

// ─── Helpers ────────────────────────────────────────────────────────────────

function createMockDB() {
  const runFn = vi.fn().mockResolvedValue({ success: true });
  const bindFn = vi.fn().mockReturnValue({ run: runFn });
  const prepareFn = vi.fn().mockReturnValue({ bind: bindFn });

  return { prepare: prepareFn, bind: bindFn, run: runFn } as unknown as D1Database;
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
