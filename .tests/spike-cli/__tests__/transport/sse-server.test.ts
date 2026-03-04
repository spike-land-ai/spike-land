/**
 * Tests for transport/sse-server.ts focusing on uncovered code paths:
 * - /health endpoint (tool count)
 * - /sse GET endpoint (SSE connection setup)
 * - buildMcpServer internals (ListTools, CallTool handlers)
 * - /messages POST with valid session (handlePostMessage)
 * - onclose callback (session cleanup)
 * - Unknown path returns 404
 */
import http from "node:http";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ServerManager } from "../../../../src/spike-cli/multiplexer/server-manager.js";

async function withSseServer(manager: ServerManager, options: { apiKey?: string } = {}) {
  const { startSseServer } = await import("../../../../src/spike-cli/transport/sse-server.js");

  const tempServer = http.createServer();
  await new Promise<void>((resolve) => tempServer.listen(0, () => resolve()));
  const addr = tempServer.address();
  const port = typeof addr === "object" && addr !== null ? addr.port : 0;
  await new Promise<void>((resolve) => tempServer.close(() => resolve()));

  const server = await startSseServer(manager, { port, ...options });
  return { closeServer: server.close, baseUrl: `http://localhost:${port}`, port };
}

function makeManager() {
  return {
    getAllTools: vi.fn().mockReturnValue([
      {
        namespacedName: "srv__ping",
        originalName: "ping",
        serverName: "srv",
        description: undefined, // undefined triggers ?? "" branch in ListTools handler
        inputSchema: { type: "object", properties: {} },
      },
    ]),
    callTool: vi.fn().mockResolvedValue({
      content: [{ type: "text", text: "pong" }],
    }),
  } as unknown as ServerManager;
}

describe("SSE server — /health endpoint", () => {
  let closeServer: () => Promise<void>;
  let baseUrl: string;

  beforeEach(async () => {
    const result = await withSseServer(makeManager());
    closeServer = result.closeServer;
    baseUrl = result.baseUrl;
  });

  afterEach(async () => {
    await closeServer();
  });

  it("returns health check with correct tool count", async () => {
    const res = await fetch(`${baseUrl}/health`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ status: "ok", tools: 1 });
  });
});

describe("SSE server — /sse GET endpoint", () => {
  let closeServer: () => Promise<void>;
  let baseUrl: string;

  beforeEach(async () => {
    const result = await withSseServer(makeManager());
    closeServer = result.closeServer;
    baseUrl = result.baseUrl;
  });

  afterEach(async () => {
    await closeServer();
  });

  it("establishes SSE connection on GET /sse", async () => {
    // Open SSE connection — the server should respond with text/event-stream
    const controller = new AbortController();
    const res = await fetch(`${baseUrl}/sse`, {
      signal: controller.signal,
    });
    // The SSE endpoint should return 200 with text/event-stream
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/event-stream");
    // Abort the connection to clean up
    controller.abort();
  });
});

describe("SSE server — /sse GET with API key", () => {
  let closeServer: () => Promise<void>;
  let baseUrl: string;

  beforeEach(async () => {
    const result = await withSseServer(makeManager(), { apiKey: "test-key" });
    closeServer = result.closeServer;
    baseUrl = result.baseUrl;
  });

  afterEach(async () => {
    await closeServer();
  });

  it("establishes SSE connection on GET /sse with valid API key", async () => {
    const controller = new AbortController();
    const res = await fetch(`${baseUrl}/sse`, {
      headers: { "x-api-key": "test-key" },
      signal: controller.signal,
    });
    expect(res.status).toBe(200);
    controller.abort();
  });
});

describe("SSE server — MCP protocol via /messages", () => {
  let closeServer: () => Promise<void>;
  let baseUrl: string;
  let manager: ReturnType<typeof makeManager>;

  beforeEach(async () => {
    manager = makeManager();
    const result = await withSseServer(manager);
    closeServer = result.closeServer;
    baseUrl = result.baseUrl;
  });

  afterEach(async () => {
    await closeServer();
  });

  async function openSseAndGetSessionId(baseUrl: string): Promise<{ sessionId: string; req: http.ClientRequest }> {
    return new Promise((resolve, reject) => {
      const req = http.get(`${baseUrl}/sse`, (res) => {
        let buffer = "";
        res.on("data", (chunk: Buffer) => {
          buffer += chunk.toString();
          const match = /data: \/messages\?sessionId=([^\n]+)/.exec(buffer);
          if (match) {
            resolve({ sessionId: match[1].trim(), req });
          }
        });
        res.on("error", reject);
      });
      req.on("error", reject);
      setTimeout(() => reject(new Error("SSE timeout")), 3000);
    });
  }

  it("accepts a POST to /messages with a valid sessionId from SSE connection", async () => {
    const { sessionId, req } = await openSseAndGetSessionId(baseUrl);
    expect(sessionId).toBeTruthy();

    // Send initialize via POST /messages
    const res = await fetch(`${baseUrl}/messages?sessionId=${sessionId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "initialize",
        id: 1,
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "test", version: "1" },
        },
      }),
    });
    expect(res.status).toBeLessThan(300);
    req.destroy();
  });

  it("sends tools/list through SSE connection to trigger ListTools handler", async () => {
    const { sessionId, req } = await openSseAndGetSessionId(baseUrl);

    // Initialize first
    await fetch(`${baseUrl}/messages?sessionId=${sessionId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "initialize",
        id: 1,
        params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "test", version: "1" } },
      }),
    });

    // Send initialized notification
    await fetch(`${baseUrl}/messages?sessionId=${sessionId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized", params: {} }),
    });

    // Send tools/list — triggers ListToolsRequestSchema handler (line 35-41)
    const listRes = await fetch(`${baseUrl}/messages?sessionId=${sessionId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", method: "tools/list", id: 2, params: {} }),
    });
    expect(listRes.status).toBeLessThan(300);
    expect(manager.getAllTools).toHaveBeenCalled();

    req.destroy();
  });

  it("sends tools/call through SSE connection to trigger CallTool handler", async () => {
    const { sessionId, req } = await openSseAndGetSessionId(baseUrl);

    // Initialize
    await fetch(`${baseUrl}/messages?sessionId=${sessionId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "initialize",
        id: 1,
        params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "test", version: "1" } },
      }),
    });

    await fetch(`${baseUrl}/messages?sessionId=${sessionId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized", params: {} }),
    });

    // Send tools/call — triggers CallToolRequestSchema handler (lines 43-54)
    const callRes = await fetch(`${baseUrl}/messages?sessionId=${sessionId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "tools/call",
        id: 3,
        params: { name: "srv__ping", arguments: {} },
      }),
    });
    expect(callRes.status).toBeLessThan(300);

    // Give time for the async tool call to complete
    await new Promise((r) => setTimeout(r, 100));
    expect(manager.callTool).toHaveBeenCalled();
    req.destroy();
  });

  it("sends tools/call without arguments (triggers args ?? {} fallback)", async () => {
    const { sessionId, req } = await openSseAndGetSessionId(baseUrl);

    await fetch(`${baseUrl}/messages?sessionId=${sessionId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "initialize",
        id: 1,
        params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "test", version: "1" } },
      }),
    });

    await fetch(`${baseUrl}/messages?sessionId=${sessionId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized", params: {} }),
    });

    // tools/call WITHOUT arguments field — triggers (args ?? {}) branch
    const callRes = await fetch(`${baseUrl}/messages?sessionId=${sessionId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "tools/call",
        id: 3,
        params: { name: "srv__ping" }, // no arguments property
      }),
    });
    expect(callRes.status).toBeLessThan(300);

    await new Promise((r) => setTimeout(r, 100));
    req.destroy();
  });

  it("cleans up session when SSE connection closes (onclose callback)", async () => {
    const { sessionId, req } = await openSseAndGetSessionId(baseUrl);

    // Destroy the SSE connection to trigger onclose
    req.destroy();
    // Give time for the close event to propagate
    await new Promise((r) => setTimeout(r, 200));

    // The session should be removed - POST to /messages should return 404
    const res = await fetch(`${baseUrl}/messages?sessionId=${sessionId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", method: "ping", id: 99, params: {} }),
    });
    expect(res.status).toBe(404);
  });

  it("returns error result when tools/call throws (line 49 catch path)", async () => {
    // Make callTool throw to trigger the catch block (lines 48-53)
    vi.mocked(manager.callTool).mockRejectedValueOnce(new Error("tool failed"));

    const { sessionId, req } = await openSseAndGetSessionId(baseUrl);

    // Initialize
    await fetch(`${baseUrl}/messages?sessionId=${sessionId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "initialize",
        id: 1,
        params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "test", version: "1" } },
      }),
    });

    await fetch(`${baseUrl}/messages?sessionId=${sessionId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized", params: {} }),
    });

    // Call a tool that will throw
    const callRes = await fetch(`${baseUrl}/messages?sessionId=${sessionId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "tools/call",
        id: 3,
        params: { name: "srv__ping", arguments: {} },
      }),
    });
    expect(callRes.status).toBeLessThan(300);

    // Give time for async processing
    await new Promise((r) => setTimeout(r, 100));
    req.destroy();
  });
});

describe("SSE server — unknown paths", () => {
  let closeServer: () => Promise<void>;
  let baseUrl: string;

  beforeEach(async () => {
    const result = await withSseServer(makeManager());
    closeServer = result.closeServer;
    baseUrl = result.baseUrl;
  });

  afterEach(async () => {
    await closeServer();
  });

  it("returns 404 for unknown paths", async () => {
    const res = await fetch(`${baseUrl}/unknown-path`);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain("Not found");
  });

  it("returns 404 for POST to unknown path", async () => {
    const res = await fetch(`${baseUrl}/other`, { method: "POST" });
    expect(res.status).toBe(404);
  });
});
