import http from "node:http";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NamespacedTool, ServerManager } from "../../multiplexer/server-manager.js";

describe("http-server", () => {
  let mockManager: ServerManager;

  const sampleTools: NamespacedTool[] = [
    {
      namespacedName: "vitest__run_tests",
      originalName: "run_tests",
      serverName: "vitest",
      description: "Run vitest tests",
      inputSchema: {
        type: "object",
        properties: { filter: { type: "string" } },
      },
    },
  ];

  beforeEach(() => {
    mockManager = {
      getAllTools: vi.fn().mockReturnValue(sampleTools),
      callTool: vi.fn().mockResolvedValue({
        content: [{ type: "text", text: "result" }],
      }),
    } as unknown as ServerManager;
  });

  it("startHttpServer exports a function", async () => {
    const { startHttpServer } = await import("../../transport/http-server.js");
    expect(typeof startHttpServer).toBe("function");
  });

  it("startSseServer exports a function", async () => {
    const { startSseServer } = await import("../../transport/sse-server.js");
    expect(typeof startSseServer).toBe("function");
  });

  it("can start and stop HTTP server", async () => {
    const { startHttpServer } = await import("../../transport/http-server.js");
    const server = await startHttpServer(mockManager, { port: 0 });
    expect(server).toHaveProperty("close");
    await server.close();
  });

  it("can start and stop SSE server", async () => {
    const { startSseServer } = await import("../../transport/sse-server.js");
    const server = await startSseServer(mockManager, { port: 0 });
    expect(server).toHaveProperty("close");
    await server.close();
  });

  it("createMcpServer exports a function", async () => {
    const { createMcpServer } = await import("../../transport/http-server.js");
    expect(typeof createMcpServer).toBe("function");
  });
});

describe("HTTP server port-in-use", () => {
  let mockManager: ServerManager;
  let blockingServer: http.Server;
  let blockingPort: number;

  beforeEach(async () => {
    mockManager = {
      getAllTools: vi.fn().mockReturnValue([]),
      callTool: vi.fn().mockResolvedValue({
        content: [{ type: "text", text: "ok" }],
      }),
    } as unknown as ServerManager;

    // Start a blocking server on a random port
    blockingServer = http.createServer((_req, res) => {
      res.writeHead(200);
      res.end();
    });
    await new Promise<void>((resolve) => {
      blockingServer.listen(0, () => resolve());
    });
    const addr = blockingServer.address();
    blockingPort = typeof addr === "object" && addr !== null ? addr.port : 0;
  });

  afterEach(async () => {
    await new Promise<void>((resolve) => blockingServer.close(() => resolve()));
  });

  it("rejects with error when HTTP port is in use", async () => {
    const { startHttpServer } = await import("../../transport/http-server.js");
    await expect(startHttpServer(mockManager, { port: blockingPort })).rejects.toThrow();
  });

  it("rejects with error when SSE port is in use", async () => {
    const { startSseServer } = await import("../../transport/sse-server.js");
    await expect(startSseServer(mockManager, { port: blockingPort })).rejects.toThrow();
  });
});

describe("HTTP server endpoints", () => {
  let mockManager: ServerManager;
  let closeServer: () => Promise<void>;
  let baseUrl: string;

  beforeEach(async () => {
    mockManager = {
      getAllTools: vi.fn().mockReturnValue([
        {
          namespacedName: "test__tool",
          originalName: "tool",
          serverName: "test",
          description: "A test tool",
          inputSchema: { type: "object", properties: {} },
        },
      ]),
      callTool: vi.fn().mockResolvedValue({
        content: [{ type: "text", text: "ok" }],
      }),
    } as unknown as ServerManager;

    const { startHttpServer } = await import("../../transport/http-server.js");
    const server = await startHttpServer(mockManager, { port: 0 });
    closeServer = server.close;

    // We need to get the actual port. startHttpServer doesn't expose the raw server,
    // so we'll use a workaround: start on port 0 and inspect.
    // Actually, we can't get the port from the current API. Let's use a different approach:
    // We'll use node's createServer directly and test the handler. But since the task
    // asks for real HTTP requests, let's use a workaround by importing and using internal access.
    // The simplest: create a new server with a known port.
    await server.close();

    // Re-create with an available port using a raw node server to find one
    const tempServer = http.createServer();
    await new Promise<void>((resolve) => tempServer.listen(0, () => resolve()));
    const addr = tempServer.address();
    const port = typeof addr === "object" && addr !== null ? addr.port : 0;
    await new Promise<void>((resolve) => tempServer.close(() => resolve()));

    const server2 = await startHttpServer(mockManager, { port });
    closeServer = server2.close;
    baseUrl = `http://localhost:${port}`;
  });

  afterEach(async () => {
    await closeServer();
  });

  it("returns health check with tool count", async () => {
    const res = await fetch(`${baseUrl}/health`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ status: "ok", tools: 1 });
  });

  it("returns 404 for unknown paths", async () => {
    const res = await fetch(`${baseUrl}/unknown`);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toEqual({ error: "Not found" });
  });

  it("returns 405 for unsupported methods on /mcp", async () => {
    const res = await fetch(`${baseUrl}/mcp`, { method: "PUT" });
    expect(res.status).toBe(405);
    const body = await res.json();
    expect(body).toEqual({ error: "Method not allowed" });
  });
});

describe("SSE server endpoints", () => {
  let mockManager: ServerManager;
  let closeServer: () => Promise<void>;
  let baseUrl: string;

  beforeEach(async () => {
    mockManager = {
      getAllTools: vi.fn().mockReturnValue([
        {
          namespacedName: "test__tool",
          originalName: "tool",
          serverName: "test",
          description: "A test tool",
          inputSchema: { type: "object", properties: {} },
        },
      ]),
      callTool: vi.fn().mockResolvedValue({
        content: [{ type: "text", text: "ok" }],
      }),
    } as unknown as ServerManager;

    const { startSseServer } = await import("../../transport/sse-server.js");

    // Find an available port
    const tempServer = http.createServer();
    await new Promise<void>((resolve) => tempServer.listen(0, () => resolve()));
    const addr = tempServer.address();
    const port = typeof addr === "object" && addr !== null ? addr.port : 0;
    await new Promise<void>((resolve) => tempServer.close(() => resolve()));

    const server = await startSseServer(mockManager, { port });
    closeServer = server.close;
    baseUrl = `http://localhost:${port}`;
  });

  afterEach(async () => {
    await closeServer();
  });

  it("returns health check with tool count", async () => {
    const res = await fetch(`${baseUrl}/health`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ status: "ok", tools: 1 });
  });

  it("returns 404 for unknown paths", async () => {
    const res = await fetch(`${baseUrl}/unknown`);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain("Not found");
  });
});
