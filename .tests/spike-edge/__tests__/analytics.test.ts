import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Hono } from "hono";
import type { Env } from "../../../src/spike-edge/env.js";
import { analytics } from "../../../src/spike-edge/routes/analytics.js";

function createMockEnv(): Env {
  return {
    R2: {} as unknown as R2Bucket,
    SPA_ASSETS: {} as unknown as R2Bucket,
    LIMITERS: {} as unknown as DurableObjectNamespace,
    AUTH_MCP: {} as unknown as Fetcher,
    STRIPE_SECRET_KEY: "",
    GEMINI_API_KEY: "",
    CLAUDE_OAUTH_TOKEN: "",
    GITHUB_TOKEN: "",
    ALLOWED_ORIGINS: "https://spike.land",
    QUIZ_BADGE_SECRET: "",
    GA_MEASUREMENT_ID: "G-TEST123",
    GA_API_SECRET: "secret123",
  };
}

function makeApp() {
  const app = new Hono<{ Bindings: Env }>();
  app.route("/", analytics);
  return app;
}

function makeExecutionCtx(): ExecutionContext {
  return {
    waitUntil: vi.fn(),
    passThroughOnException: vi.fn(),
  } as unknown as ExecutionContext;
}

describe("analytics ingest endpoint", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn().mockResolvedValue(new Response("", { status: 200 }));
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns 429 when rate limited", async () => {
    const app = makeApp();
    const env = createMockEnv();
    const ctx = makeExecutionCtx();

    // Exhaust the in-memory rate limit (10 requests per minute per IP)
    for (let i = 0; i < 10; i++) {
      await app.request(
        "/analytics/ingest",
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "cf-connecting-ip": "1.2.3.4" },
          body: JSON.stringify([{ source: "web", eventType: "click" }]),
        },
        env,
        ctx,
      );
    }

    // 11th request should be rate limited
    const res = await app.request(
      "/analytics/ingest",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "cf-connecting-ip": "1.2.3.4" },
        body: JSON.stringify([{ source: "web", eventType: "click" }]),
      },
      env,
    );

    expect(res.status).toBe(429);
    const body = await res.json<{ error: string; retryAfter: number }>();
    expect(body.error).toBe("Rate limited");
    expect(body.retryAfter).toBe(60);
  });

  it("returns 400 for non-array body", async () => {
    const app = makeApp();
    const env = createMockEnv();

    const res = await app.request(
      "/analytics/ingest",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "web", eventType: "click" }),
      },
      env,
    );

    expect(res.status).toBe(400);
    const body = await res.json<{ error: string }>();
    expect(body.error).toContain("array");
  });

  it("returns 400 when all events are invalid (missing source/eventType)", async () => {
    const app = makeApp();
    const env = createMockEnv();

    const res = await app.request(
      "/analytics/ingest",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([{ badField: "value" }, null, 42]),
      },
      env,
    );

    expect(res.status).toBe(400);
    const body = await res.json<{ error: string }>();
    expect(body.error).toContain("No valid events");
  });

  it("accepts valid events and returns { accepted: count }", async () => {
    const app = makeApp();
    const env = createMockEnv();
    const ctx = makeExecutionCtx();

    const res = await app.request(
      "/analytics/ingest",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([
          { source: "web", eventType: "page_view" },
          { source: "api", eventType: "tool_call", metadata: { tool: "test" } },
          { badField: true },
        ]),
      },
      env,
      ctx,
    );

    expect(res.status).toBe(200);
    const body = await res.json<{ accepted: number }>();
    expect(body.accepted).toBe(2);
  });

  it("calls sendGA4Events via waitUntil", async () => {
    const app = makeApp();
    const env = createMockEnv();
    const ctx = makeExecutionCtx();

    const res = await app.request(
      "/analytics/ingest",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([{ source: "web", eventType: "page_view" }]),
      },
      env,
      ctx,
    );

    expect(res.status).toBe(200);

    // waitUntil should have been called with the GA4 promise
    expect(ctx.waitUntil).toHaveBeenCalledTimes(1);

    // Await the promise passed to waitUntil so GA4 fetch runs
    const ga4Promise = (ctx.waitUntil as ReturnType<typeof vi.fn>).mock.calls[0]![0];
    await ga4Promise;

    // GA4 fetch should have been called
    expect(mockFetch).toHaveBeenCalled();
    const [url] = mockFetch.mock.calls[0]!;
    expect(url).toContain("google-analytics.com/mp/collect");
  });

  it("filters invalid events - only valid events are counted", async () => {
    const app = makeApp();
    const env = createMockEnv();
    const ctx = makeExecutionCtx();

    const res = await app.request(
      "/analytics/ingest",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([
          { source: "web", eventType: "click" },
          { eventType: "missing_source" },
          { source: "missing_event_type" },
          { source: "api", eventType: "tool_use" },
        ]),
      },
      env,
      ctx,
    );

    expect(res.status).toBe(200);
    const body = await res.json<{ accepted: number }>();
    expect(body.accepted).toBe(2);
  });
});
