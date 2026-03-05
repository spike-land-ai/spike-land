import { describe, expect, it, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { chat } from "../../../src/spike-edge/routes/chat.js";
import type { Env } from "../../../src/spike-edge/env.js";

function makeEnv(overrides: Partial<Env> = {}): Env {
  return {
    R2: {} as Env["R2"],
    SPA_ASSETS: {} as Env["SPA_ASSETS"],
    DB: {} as Env["DB"],
    LIMITERS: {} as Env["LIMITERS"],
    AUTH_MCP: {} as Env["AUTH_MCP"],
    MCP_SERVICE: {
      fetch: vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ tools: [] }), { status: 200 }),
      ),
    } as unknown as Env["MCP_SERVICE"],
    STRIPE_SECRET_KEY: "",
    STRIPE_WEBHOOK_SECRET: "",
    GEMINI_API_KEY: "",
    CLAUDE_OAUTH_TOKEN: "test-api-key",
    GITHUB_TOKEN: "",
    ALLOWED_ORIGINS: "",
    QUIZ_BADGE_SECRET: "",
    GA_MEASUREMENT_ID: "",
    CACHE_VERSION: "",
    GA_API_SECRET: "",
    INTERNAL_SERVICE_SECRET: "",
    WHATSAPP_APP_SECRET: "",
    WHATSAPP_ACCESS_TOKEN: "",
    WHATSAPP_PHONE_NUMBER_ID: "",
    WHATSAPP_VERIFY_TOKEN: "",
    MCP_INTERNAL_SECRET: "",
    ANALYTICS: {} as Env["ANALYTICS"],
    ...overrides,
  };
}

function makeExecCtx() {
  const promises: Promise<unknown>[] = [];
  return {
    ctx: {
      waitUntil: (p: Promise<unknown>) => { promises.push(p); },
      passThroughOnException: () => {},
    } as unknown as ExecutionContext,
    flush: () => Promise.allSettled(promises),
  };
}

function makeApp() {
  const app = new Hono<{ Bindings: Env }>();
  app.use("*", async (c, next) => {
    c.set("requestId" as never, "test-request-id" as never);
    return next();
  });
  app.route("/", chat);
  return app;
}

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/chat", () => {
  let env: Env;

  beforeEach(() => {
    env = makeEnv();
    vi.restoreAllMocks();
  });

  it("returns 400 when message is missing", async () => {
    const app = makeApp();
    const { ctx } = makeExecCtx();
    const res = await app.fetch(makeRequest({}), env, ctx);
    expect(res.status).toBe(400);
    const data = await res.json<{ error: string }>();
    expect(data.error).toBe("message is required");
  });

  it("returns 400 when message is not a string", async () => {
    const app = makeApp();
    const { ctx } = makeExecCtx();
    const res = await app.fetch(makeRequest({ message: 123 }), env, ctx);
    expect(res.status).toBe(400);
  });

  it("returns 400 when message is empty string", async () => {
    const app = makeApp();
    const { ctx } = makeExecCtx();
    const res = await app.fetch(makeRequest({ message: "" }), env, ctx);
    expect(res.status).toBe(400);
  });

  it("returns SSE content-type headers on valid request", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        [
          'data: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}',
          'data: {"type":"content_block_stop","index":0}',
          'data: {"type":"message_stop"}',
          "",
        ].join("\n"),
        { status: 200 },
      ),
    );

    const app = makeApp();
    const { ctx, flush } = makeExecCtx();
    const res = await app.fetch(makeRequest({ message: "Hello" }), env, ctx);

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/event-stream");
    expect(res.headers.get("Cache-Control")).toBe("no-cache");
    expect(res.headers.get("X-Request-Id")).toBe("test-request-id");

    await res.text();
    await flush();
  });

  it("streams text_delta events", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        [
          'data: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}',
          'data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Hi "}}',
          'data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"there"}}',
          'data: {"type":"content_block_stop","index":0}',
          'data: {"type":"message_stop"}',
          "",
        ].join("\n"),
        { status: 200 },
      ),
    );

    const app = makeApp();
    const { ctx, flush } = makeExecCtx();
    const res = await app.fetch(makeRequest({ message: "Hello" }), env, ctx);
    const body = await res.text();
    await flush();

    expect(body).toContain('"type":"text_delta"');
    expect(body).toContain('"text":"Hi "');
    expect(body).toContain('"text":"there"');
    expect(body).toContain("data: [DONE]");
  });

  it("calls MCP_SERVICE to fetch tools", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        [
          'data: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}',
          'data: {"type":"content_block_stop","index":0}',
          'data: {"type":"message_stop"}',
          "",
        ].join("\n"),
        { status: 200 },
      ),
    );

    const app = makeApp();
    const { ctx, flush } = makeExecCtx();
    const res = await app.fetch(makeRequest({ message: "Hello" }), env, ctx);
    await res.text();
    await flush();

    expect(env.MCP_SERVICE.fetch).toHaveBeenCalledTimes(1);
  });

  it("sends error event when Anthropic returns non-200", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("Bad Request", { status: 400 }),
    );

    const app = makeApp();
    const { ctx, flush } = makeExecCtx();
    const res = await app.fetch(makeRequest({ message: "Hello" }), env, ctx);
    const body = await res.text();
    await flush();

    expect(body).toContain('"type":"error"');
    expect(body).toContain("Anthropic API error: 400");
  });

  it("passes history in Anthropic request", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        [
          'data: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}',
          'data: {"type":"content_block_stop","index":0}',
          'data: {"type":"message_stop"}',
          "",
        ].join("\n"),
        { status: 200 },
      ),
    );

    const app = makeApp();
    const { ctx, flush } = makeExecCtx();
    const res = await app.fetch(
      makeRequest({
        message: "What did I say?",
        history: [
          { role: "user", content: "Hello" },
          { role: "assistant", content: "Hi there!" },
        ],
      }),
      env,
      ctx,
    );
    await res.text();
    await flush();

    // fetchSpy was called for Anthropic API
    expect(fetchSpy).toHaveBeenCalled();
    const anthropicCall = fetchSpy.mock.calls[0];
    const anthropicBody = JSON.parse(anthropicCall[1]?.body as string);
    expect(anthropicBody.messages).toHaveLength(3);
    expect(anthropicBody.messages[0].content).toBe("Hello");
    expect(anthropicBody.messages[1].content).toBe("Hi there!");
    expect(anthropicBody.messages[2].content).toBe("What did I say?");
  });
});
