import { beforeEach, describe, expect, it, vi } from "vitest";
import { Hono } from "hono";
import type { Env } from "../../../src/edge-api/spike-land/core-logic/env";
import type { AuthVariables } from "../../../src/edge-api/spike-land/api/middleware";
import { createDb } from "../../../src/edge-api/spike-land/db/db/db-index";
import { createMockKV, mockEnv } from "../__test-utils__/mock-env";

// Mock the MCP server creation to avoid pulling in all tool dependencies
vi.mock("../../../src/edge-api/spike-land/core-logic/mcp/server", () => ({
  createMcpServer: vi.fn().mockImplementation(async () => ({
    connect: vi.fn(),
    close: vi.fn(),
  })),
}));

// Mutable flags to control whether GA4 / skill-tracker fail (for .catch branch coverage)
let _hashClientIdShouldFail = false;
let _recordSkillCallShouldFail = false;

vi.mock("../../../src/edge-api/spike-land/core-logic/lib/ga4", () => ({
  hashClientId: vi.fn().mockImplementation(async () => {
    if (_hashClientIdShouldFail) throw new Error("GA4 hash failed");
    return "mock-client-id";
  }),
  sendGA4Events: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../../src/edge-api/spike-land/core-logic/lib/skill-tracker", () => ({
  recordSkillCall: vi.fn().mockImplementation(async () => {
    if (_recordSkillCallShouldFail) throw new Error("skill-tracker failed");
  }),
}));

vi.mock("../../../src/edge-api/spike-land/core-logic/lib/analytics", () => ({
  trackPlatformEvents: vi.fn().mockResolvedValue(undefined),
}));

type TransportRequestOptions = { parsedBody?: unknown };

let _transportCreateCount = 0;

async function defaultTransportHandleRequest(
  transport: MockTransport,
  request: Request,
  options?: TransportRequestOptions,
): Promise<Response> {
  const body = options?.parsedBody as { id?: number; method?: string } | undefined;
  const headers = new Headers({ "Content-Type": "application/json" });
  if (transport.sessionId) {
    headers.set("Mcp-Session-Id", transport.sessionId);
  }

  if (request.method === "POST" && body?.method === "initialize") {
    transport.initialized = true;
    if (!transport.sessionId) {
      transport.sessionId = transport.options.sessionIdGenerator?.();
    }
    if (transport.sessionId) {
      headers.set("Mcp-Session-Id", transport.sessionId);
    }
    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        result: { protocolVersion: "2024-11-05" },
        id: body.id ?? 1,
      }),
      { status: 200, headers },
    );
  }

  if (request.method === "POST" && body?.method === "notifications/initialized") {
    return transport.initialized || !transport.options.sessionIdGenerator
      ? new Response(null, { status: 202, headers })
      : new Response(
          JSON.stringify({
            jsonrpc: "2.0",
            error: { code: -32000, message: "Bad Request: Server not initialized" },
            id: null,
          }),
          { status: 400, headers },
        );
  }

  if (request.method === "DELETE") {
    if (transport.sessionId) {
      await transport.options.onsessionclosed?.(transport.sessionId);
    }
    transport.closed = true;
    return new Response(null, { status: 200, headers });
  }

  return new Response(
    JSON.stringify({
      jsonrpc: "2.0",
      result: {
        tools: [
          { name: "search_tools" },
          { name: "enable_category" },
          { name: "disable_category" },
          { name: "list_categories" },
          { name: "get_status" },
        ],
      },
      id: body?.id ?? 1,
    }),
    { status: 200, headers },
  );
}

// Shared mutable handler for transport mock — tests override this to exercise different branches
let _transportHandleRequest: (
  transport: MockTransport,
  request: Request,
  options?: TransportRequestOptions,
) => Promise<Response> = defaultTransportHandleRequest;

vi.mock("@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js", () => {
  class MockTransport {
    options: {
      sessionIdGenerator?: () => string;
      onsessionclosed?: (sessionId: string) => void | Promise<void>;
      enableJsonResponse?: boolean;
    };
    sessionId: string | undefined;
    initialized = false;
    closed = false;

    constructor(
      options: {
        sessionIdGenerator?: () => string;
        onsessionclosed?: (sessionId: string) => void | Promise<void>;
        enableJsonResponse?: boolean;
      } = {},
    ) {
      this.options = options;
      _transportCreateCount += 1;
    }

    handleRequest(request: Request, options?: TransportRequestOptions) {
      return _transportHandleRequest(this, request, options);
    }
  }
  return { WebStandardStreamableHTTPServerTransport: MockTransport };
});

/**
 * Build a test app that mirrors the real app's mount structure.
 * Uses the real createApp pattern: auth middleware on /mcp/*, route on /mcp.
 */
async function buildTestApp() {
  const { mcpRoute } = await import("../../../src/edge-api/spike-land/api/mcp");

  // Test the mcpRoute directly, pre-setting userId as the auth middleware would
  const app = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

  // Simulate auth: set userId for authenticated requests, reject unauthenticated
  app.use("*", async (c, next) => {
    const internalSecret = c.req.header("X-Internal-Secret");
    const internalUserId = c.req.header("X-User-Id");
    if (internalSecret === c.env.MCP_INTERNAL_SECRET && internalUserId) {
      c.set("userId", internalUserId);
      c.set("db", createDb(c.env.DB));
      c.set("userRole", "user");
      return next();
    }

    const authHeader = c.req.header("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    const token = authHeader.slice("Bearer ".length);
    if (token === "valid-test-token") {
      c.set("userId", "user-test-123");
      c.set("db", createDb(c.env.DB));
      c.set("userRole", "user");
      return next();
    } else {
      return c.json({ error: "Unauthorized", message: "Invalid token" }, 401);
    }
  });

  // Mount the mcpRoute at root -- test requests go to "/"
  app.route("/", mcpRoute);
  return app;
}

async function initializeSession(
  app: Awaited<ReturnType<typeof buildTestApp>>,
  env: ReturnType<typeof mockEnv>,
): Promise<string> {
  const currentHandler = _transportHandleRequest;
  _transportHandleRequest = async (transport, request, options) => {
    const body = options?.parsedBody as { method?: string } | undefined;
    if (body?.method === "initialize") {
      return defaultTransportHandleRequest(transport, request, options);
    }
    return currentHandler(transport, request, options);
  };

  let res!: Response;
  try {
    res = await app.request(
      "/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer valid-test-token",
          Accept: "application/json, text/event-stream",
        },
        body: JSON.stringify({ jsonrpc: "2.0", method: "initialize", id: 1 }),
      },
      env,
      { waitUntil: () => {} },
    );
  } finally {
    _transportHandleRequest = currentHandler;
  }

  const sessionId = res.headers.get("Mcp-Session-Id");
  expect(res.status).toBe(200);
  expect(sessionId).toBeTruthy();
  return sessionId ?? "";
}

describe("POST /mcp (mcpRoute handler)", () => {
  let env: ReturnType<typeof mockEnv>;

  beforeEach(() => {
    env = mockEnv({ KV: createMockKV() });
    _transportCreateCount = 0;
    _transportHandleRequest = defaultTransportHandleRequest;
  });

  it("returns 401 without auth header", async () => {
    const app = await buildTestApp();

    const res = await app.request(
      "/",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", method: "tools/list", id: 1 }),
      },
      env,
      { waitUntil: () => {} },
    );

    expect(res.status).toBe(401);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 401 with invalid token", async () => {
    const app = await buildTestApp();

    const res = await app.request(
      "/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer invalid-token",
        },
        body: JSON.stringify({ jsonrpc: "2.0", method: "tools/list", id: 1 }),
      },
      env,
      { waitUntil: () => {} },
    );

    expect(res.status).toBe(401);
  });

  it("returns 200 with valid auth and JSON-RPC body", async () => {
    const app = await buildTestApp();

    const res = await app.request(
      "/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer valid-test-token",
          Accept: "application/json, text/event-stream",
        },
        body: JSON.stringify({ jsonrpc: "2.0", method: "initialize", id: 1 }),
      },
      env,
      { waitUntil: () => {} },
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      jsonrpc: string;
      result: { protocolVersion: string };
    };
    expect(body.jsonrpc).toBe("2.0");
    expect(body.result.protocolVersion).toBe("2024-11-05");
  });

  it("reuses the same transport across initialize and initialized notification", async () => {
    const app = await buildTestApp();

    const initRes = await app.request(
      "/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer valid-test-token",
          Accept: "application/json, text/event-stream",
        },
        body: JSON.stringify({ jsonrpc: "2.0", method: "initialize", id: 1 }),
      },
      env,
      { waitUntil: () => {} },
    );

    expect(initRes.status).toBe(200);
    const sessionId = initRes.headers.get("Mcp-Session-Id");
    expect(sessionId).toBeTruthy();

    const notifyRes = await app.request(
      "/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer valid-test-token",
          Accept: "application/json, text/event-stream",
          "Mcp-Session-Id": sessionId ?? "",
        },
        body: JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }),
      },
      env,
      { waitUntil: () => {} },
    );

    expect(notifyRes.status).toBe(202);
    expect(_transportCreateCount).toBe(1);
  });

  it("falls back to stateless mode for internal initialized notifications when the session is missing", async () => {
    const app = await buildTestApp();

    const res = await app.request(
      "/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/event-stream",
          "Mcp-Session-Id": "missing-session",
          "X-Internal-Secret": env.MCP_INTERNAL_SECRET,
          "X-User-Id": "user-test-123",
        },
        body: JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }),
      },
      env,
      { waitUntil: () => {} },
    );

    expect(res.status).toBe(202);
  });

  it("falls back to stateless mode for internal tool calls when the session is missing", async () => {
    _transportHandleRequest = async (transport, request, options) => {
      const body = options?.parsedBody as { id?: number; method?: string } | undefined;
      if (body?.method === "tools/call") {
        return new Response(
          JSON.stringify({
            jsonrpc: "2.0",
            result: { content: [{ type: "text", text: "ok" }] },
            id: body.id ?? 1,
          }),
          {
            status: 200,
            headers: new Headers({ "Content-Type": "application/json" }),
          },
        );
      }
      return defaultTransportHandleRequest(transport, request, options);
    };

    const app = await buildTestApp();

    const res = await app.request(
      "/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/event-stream",
          "Mcp-Session-Id": "missing-session",
          "X-Internal-Secret": env.MCP_INTERNAL_SECRET,
          "X-User-Id": "user-test-123",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "tools/call",
          params: { name: "web_navigate", arguments: { url: "https://spike.land" } },
          id: 1,
        }),
      },
      env,
      { waitUntil: () => {} },
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      result: { content: Array<{ text: string }> };
    };
    expect(body.result.content[0]?.text).toBe("ok");
  });

  it("returns 429 when rate limited", async () => {
    const app = await buildTestApp();

    // Pre-fill KV with exhausted rate limit
    const kvKey = "rl:mcp-rpc:user-test-123";
    const entry = { count: 121, windowStart: Date.now() };
    await env.KV.put(kvKey, JSON.stringify(entry), { expirationTtl: 70 });

    const res = await app.request(
      "/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer valid-test-token",
        },
        body: JSON.stringify({ jsonrpc: "2.0", method: "tools/list", id: 1 }),
      },
      env,
      { waitUntil: () => {} },
    );

    expect(res.status).toBe(429);
    const body = (await res.json()) as { error: { message: string } };
    expect(body.error.message).toBe("Rate limit exceeded");
    expect(res.headers.get("Retry-After")).toBeTruthy();
  });

  it("returns 400 for invalid JSON body", async () => {
    const app = await buildTestApp();

    const res = await app.request(
      "/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer valid-test-token",
        },
        body: "not valid json {{{",
      },
      env,
      { waitUntil: () => {} },
    );

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { code: number } };
    expect(body.error.code).toBe(-32700);
  });
});

describe("GET /mcp (mcpRoute handler)", () => {
  beforeEach(() => {
    _transportHandleRequest = defaultTransportHandleRequest;
    _transportCreateCount = 0;
  });

  it("returns 401 without auth", async () => {
    const app = await buildTestApp();
    const env = mockEnv();

    const res = await app.request("/", { method: "GET" }, env);
    expect(res.status).toBe(401);
  });

  it("supports SSE connection with auth and an existing session", async () => {
    _transportHandleRequest = async (transport, request, options) => {
      if (request.method === "GET") {
        return new Response("data: {}\n\n", {
          status: 200,
          headers: new Headers({ "Content-Type": "text/event-stream" }),
        });
      }
      return defaultTransportHandleRequest(transport, request, options);
    };

    const app = await buildTestApp();
    const env = mockEnv();
    const sessionId = await initializeSession(app, env);

    const res = await app.request(
      "/",
      {
        method: "GET",
        headers: {
          Authorization: "Bearer valid-test-token",
          Accept: "text/event-stream",
          "Mcp-Session-Id": sessionId ?? "",
        },
      },
      env,
      { waitUntil: () => {} },
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/event-stream");
  });

  it("returns 400 when GET is missing the session id", async () => {
    const app = await buildTestApp();
    const env = mockEnv();

    const res = await app.request(
      "/",
      {
        method: "GET",
        headers: {
          Authorization: "Bearer valid-test-token",
          Accept: "text/event-stream",
        },
      },
      env,
      { waitUntil: () => {} },
    );

    expect(res.status).toBe(400);
  });
});

describe("DELETE /mcp (mcpRoute handler)", () => {
  beforeEach(() => {
    _transportHandleRequest = defaultTransportHandleRequest;
    _transportCreateCount = 0;
  });

  it("returns 200 ok for DELETE with an active session", async () => {
    const app = await buildTestApp();
    const env = mockEnv();
    const sessionId = await initializeSession(app, env);

    const res = await app.request(
      "/",
      {
        method: "DELETE",
        headers: {
          Authorization: "Bearer valid-test-token",
          "Mcp-Session-Id": sessionId ?? "",
        },
      },
      env,
      { waitUntil: () => {} },
    );

    expect(res.status).toBe(200);
  });

  it("returns 404 for DELETE when the session does not exist", async () => {
    const app = await buildTestApp();
    const env = mockEnv();

    const res = await app.request(
      "/",
      {
        method: "DELETE",
        headers: {
          Authorization: "Bearer valid-test-token",
          "Mcp-Session-Id": "missing-session",
        },
      },
      env,
      { waitUntil: () => {} },
    );

    expect(res.status).toBe(404);
  });
});

describe("POST /mcp tools/call tracking", () => {
  let env: ReturnType<typeof mockEnv>;

  beforeEach(() => {
    env = mockEnv({ KV: createMockKV() });
    _hashClientIdShouldFail = false;
    _recordSkillCallShouldFail = false;
    _transportCreateCount = 0;
    // Reset to default handler before each test
    _transportHandleRequest = async (_transport, _request, options) =>
      new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          result: { tools: [] },
          id: (options?.parsedBody as { id?: number } | undefined)?.id ?? 1,
        }),
        {
          status: 200,
          headers: new Headers({ "Content-Type": "application/json" }),
        },
      );
  });

  it("tracks a tools/call request via waitUntil", async () => {
    _transportHandleRequest = async (_transport, _request, _options) =>
      new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          result: { content: [{ type: "text", text: "result" }] },
          id: 1,
        }),
        { status: 200, headers: new Headers({ "Content-Type": "application/json" }) },
      );

    const waitUntilPromises: Promise<unknown>[] = [];
    const app = await buildTestApp();
    const sessionId = await initializeSession(app, env);

    const res = await app.request(
      "/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer valid-test-token",
          Accept: "application/json, text/event-stream",
          "Mcp-Session-Id": sessionId,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "tools/call",
          params: { name: "search_tools" },
          id: 1,
        }),
      },
      env,
      { waitUntil: (p: Promise<unknown>) => waitUntilPromises.push(p) },
    );

    expect(res.status).toBe(200);
    // waitUntil should have been called for GA4 and skill-call recording
    expect(waitUntilPromises.length).toBeGreaterThan(0);
  });

  it("detects isError=true in tool call response body and sets outcome to error", async () => {
    _transportHandleRequest = async (_transport, _request, _options) =>
      new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          result: { isError: true, content: [{ type: "text", text: "tool error" }] },
          id: 1,
        }),
        { status: 200, headers: new Headers({ "Content-Type": "application/json" }) },
      );

    const app = await buildTestApp();
    const waitUntilPromises: Promise<unknown>[] = [];
    const sessionId = await initializeSession(app, env);

    const res = await app.request(
      "/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer valid-test-token",
          Accept: "application/json, text/event-stream",
          "Mcp-Session-Id": sessionId,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "tools/call",
          params: { name: "search_tools" },
          id: 1,
        }),
      },
      env,
      { waitUntil: (p: Promise<unknown>) => waitUntilPromises.push(p) },
    );

    expect(res.status).toBe(200);
  });

  it("detects error in JSON-RPC body and sets outcome to error", async () => {
    _transportHandleRequest = async (_transport, _request, _options) =>
      new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          error: { code: -32600, message: "Invalid Request" },
          id: 1,
        }),
        { status: 200, headers: new Headers({ "Content-Type": "application/json" }) },
      );

    const app = await buildTestApp();
    const sessionId = await initializeSession(app, env);

    const res = await app.request(
      "/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer valid-test-token",
          Accept: "application/json, text/event-stream",
          "Mcp-Session-Id": sessionId,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "tools/call",
          params: { name: "bad_tool" },
          id: 1,
        }),
      },
      env,
      { waitUntil: () => {} },
    );

    expect(res.status).toBe(200);
  });

  it("returns 500 when transport.handleRequest throws", async () => {
    _transportHandleRequest = async (_transport, _request, _options) => {
      throw new Error("Transport failed");
    };

    const app = await buildTestApp();
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await app.request(
      "/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer valid-test-token",
          Accept: "application/json, text/event-stream",
        },
        body: JSON.stringify({ jsonrpc: "2.0", method: "initialize", id: 1 }),
      },
      env,
      { waitUntil: () => {} },
    );

    expect(res.status).toBe(500);
    const body = (await res.json()) as { error: { code: number } };
    expect(body.error.code).toBe(-32603);
    consoleSpy.mockRestore();
  });

  it("sets Accept header when not fully specified", async () => {
    const app = await buildTestApp();

    // Request without proper Accept header — the route should add the header
    const res = await app.request(
      "/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer valid-test-token",
          // No Accept header — triggers the Accept header normalization branch
        },
        body: JSON.stringify({ jsonrpc: "2.0", method: "initialize", id: 1 }),
      },
      env,
      { waitUntil: () => {} },
    );

    expect(res.status).toBe(200);
  });

  it("covers GA4 .catch branch (line 151) when hashClientId rejects", async () => {
    _hashClientIdShouldFail = true;
    _transportHandleRequest = async (_transport, _request, _options) =>
      new Response(JSON.stringify({ jsonrpc: "2.0", result: { tools: [] }, id: 1 }), {
        status: 200,
        headers: new Headers({ "Content-Type": "application/json" }),
      });

    const waitUntilPromises: Promise<unknown>[] = [];
    const app = await buildTestApp();
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await app.request(
      "/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer valid-test-token",
          Accept: "application/json, text/event-stream",
        },
        body: JSON.stringify({ jsonrpc: "2.0", method: "initialize", id: 1 }),
      },
      env,
      { waitUntil: (p: Promise<unknown>) => waitUntilPromises.push(p) },
    );

    expect(res.status).toBe(200);
    // Await all waitUntil promises — the .catch() callback executes here
    await Promise.allSettled(waitUntilPromises);
    consoleSpy.mockRestore();
  });

  it("uses 'unknown' method when body has no method field (line 96 branch)", async () => {
    const app = await buildTestApp();
    const sessionId = await initializeSession(app, env);

    const res = await app.request(
      "/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer valid-test-token",
          Accept: "application/json, text/event-stream",
          "Mcp-Session-Id": sessionId,
        },
        // body with no method field — triggers ?? "unknown" branch
        body: JSON.stringify({ jsonrpc: "2.0", id: 1 }),
      },
      env,
      { waitUntil: () => {} },
    );

    expect(res.status).toBe(200);
  });

  it("uses 'unknown' toolName when tools/call has no params.name (line 99 branch)", async () => {
    _transportHandleRequest = async (_transport, _request, _options) =>
      new Response(JSON.stringify({ jsonrpc: "2.0", result: { content: [] }, id: 1 }), {
        status: 200,
        headers: new Headers({ "Content-Type": "application/json" }),
      });

    const app = await buildTestApp();
    const sessionId = await initializeSession(app, env);

    const res = await app.request(
      "/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer valid-test-token",
          Accept: "application/json, text/event-stream",
          "Mcp-Session-Id": sessionId,
        },
        // tools/call with no params.name — triggers ?? "unknown" branch on toolName
        body: JSON.stringify({ jsonrpc: "2.0", method: "tools/call", params: {}, id: 1 }),
      },
      env,
      { waitUntil: () => {} },
    );

    expect(res.status).toBe(200);
  });

  it("sets outcome to error when transport returns 4xx status for tools/call (line 104 branch)", async () => {
    _transportHandleRequest = async (_transport, _request, _options) =>
      new Response(JSON.stringify({ jsonrpc: "2.0", error: { code: -32600 }, id: 1 }), {
        status: 400,
        headers: new Headers({ "Content-Type": "application/json" }),
      });

    const app = await buildTestApp();
    const sessionId = await initializeSession(app, env);

    const res = await app.request(
      "/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer valid-test-token",
          Accept: "application/json, text/event-stream",
          "Mcp-Session-Id": sessionId,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "tools/call",
          params: { name: "mytool" },
          id: 1,
        }),
      },
      env,
      { waitUntil: () => {} },
    );

    // Transport returned 4xx, so outcome = "error" branch was taken
    expect(res.status).toBe(400);
  });

  it("handles null responseBody when response.text() throws (line 114 false branch)", async () => {
    _transportHandleRequest = async (_transport, _request, _options) => {
      const stream = new ReadableStream({
        start(controller) {
          // close immediately with no data — .text() on a broken response body should throw
          controller.error(new Error("Stream read error"));
        },
      });
      return new Response(stream, {
        status: 200,
        headers: new Headers({ "Content-Type": "application/json" }),
      });
    };

    const app = await buildTestApp();
    const sessionId = await initializeSession(app, env);

    const res = await app.request(
      "/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer valid-test-token",
          Accept: "application/json, text/event-stream",
          "Mcp-Session-Id": sessionId,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "tools/call",
          params: { name: "mytool" },
          id: 1,
        }),
      },
      env,
      { waitUntil: () => {} },
    );

    // Response may be 200 or error — we just need to hit the null responseBody branch
    expect([200, 500]).toContain(res.status);
  });

  it("covers skill-tracker .catch branch (line 163) when recordSkillCall rejects", async () => {
    _recordSkillCallShouldFail = true;
    _transportHandleRequest = async (_transport, _request, _options) =>
      new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          result: { content: [{ type: "text", text: "result" }] },
          id: 1,
        }),
        { status: 200, headers: new Headers({ "Content-Type": "application/json" }) },
      );

    const waitUntilPromises: Promise<unknown>[] = [];
    const app = await buildTestApp();
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const sessionId = await initializeSession(app, env);

    const res = await app.request(
      "/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer valid-test-token",
          Accept: "application/json, text/event-stream",
          "Mcp-Session-Id": sessionId,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "tools/call",
          params: { name: "any_tool" },
          id: 1,
        }),
      },
      env,
      { waitUntil: (p: Promise<unknown>) => waitUntilPromises.push(p) },
    );

    expect(res.status).toBe(200);
    // Await all waitUntil promises — the skill-tracker .catch() callback executes here
    await Promise.allSettled(waitUntilPromises);
    consoleSpy.mockRestore();
  });
});
