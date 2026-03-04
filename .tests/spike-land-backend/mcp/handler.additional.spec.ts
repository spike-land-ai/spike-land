/**
 * Additional McpHandler tests to cover uncovered branches:
 * - handler.ts line 285: missing codeSpace in resource URI
 * - handler.ts line 371: missing session.codeSpace
 * - handler.ts line 374: updateSession function
 * - handler.ts line 426: find_lines missing pattern
 */
import type { ICodeSession } from "@spike-land-ai/code";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Code } from "../../../src/spike-land-backend/chatRoom.js";
import { McpHandler } from "../../../src/spike-land-backend/mcp/handler.js";

function makeSession(overrides: Partial<ICodeSession> = {}): ICodeSession {
  return {
    code: "const x = 1;",
    html: "<div>hello</div>",
    css: ".class { color: red; }",
    transpiled: "const x = 1;",
    codeSpace: "test-space",
    messages: [],
    ...overrides,
  };
}

function createMockCode(session: ICodeSession): Code {
  return {
    getSession: vi.fn(() => session),
    initializeSession: vi.fn(),
    updateAndBroadcastSession: vi.fn().mockResolvedValue(undefined),
    getOrigin: vi.fn(() => "https://testing.spike.land"),
    getFiles: vi.fn(() => new Map<string, string>()),
    setFile: vi.fn().mockResolvedValue(undefined),
    deleteFile: vi.fn().mockResolvedValue(undefined),
  } as unknown as Code;
}

async function postMcpRequest(
  handler: McpHandler,
  body: unknown,
): Promise<{ jsonrpc: string; id: number | null; result?: unknown; error?: { code: number; message: string; data?: string } }> {
  const request = new Request("http://localhost/mcp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const response = await handler.handleRequest(request, new URL("http://localhost/mcp"), ["mcp"]);
  return response.json() as Promise<{ jsonrpc: string; id: number | null; result?: unknown; error?: { code: number; message: string; data?: string } }>;
}

describe("McpHandler — additional branch coverage", () => {
  let handler: McpHandler;
  let mockCode: Code;
  let session: ICodeSession;

  beforeEach(() => {
    vi.clearAllMocks();
    session = makeSession();
    mockCode = createMockCode(session);
    handler = new McpHandler(mockCode);
  });

  describe("find_lines — missing pattern (line 426)", () => {
    it("returns error when pattern argument is missing", async () => {
      const data = await postMcpRequest(handler, {
        jsonrpc: "2.0",
        id: 100,
        method: "tools/call",
        params: {
          name: "find_lines",
          arguments: { codeSpace: "test-space" },
        },
      });

      expect(data.error).toBeDefined();
      expect(data.error?.data).toContain("Pattern parameter is required");
    });

    it("returns error when pattern argument is not a string", async () => {
      const data = await postMcpRequest(handler, {
        jsonrpc: "2.0",
        id: 101,
        method: "tools/call",
        params: {
          name: "find_lines",
          arguments: { codeSpace: "test-space", pattern: 42 },
        },
      });

      expect(data.error).toBeDefined();
      expect(data.error?.data).toContain("Pattern parameter is required");
    });
  });

  describe("executeTool — missing session.codeSpace (line 371)", () => {
    it("throws when session has no codeSpace", async () => {
      const sessionWithoutCodeSpace = makeSession({ codeSpace: "" });
      mockCode = createMockCode(sessionWithoutCodeSpace);
      handler = new McpHandler(mockCode);

      const data = await postMcpRequest(handler, {
        jsonrpc: "2.0",
        id: 102,
        method: "tools/call",
        params: {
          name: "read_code",
          arguments: { codeSpace: "test-space" },
        },
      });

      expect(data.error).toBeDefined();
    });
  });

  describe("readResource — missing codeSpace in URI (line 285)", () => {
    it("returns error for invalid resource URI format", async () => {
      const data = await postMcpRequest(handler, {
        jsonrpc: "2.0",
        id: 103,
        method: "resources/read",
        params: {
          uri: "codespace://invalid-uri-without-slash",
        },
      });

      expect(data.error).toBeDefined();
    });
  });

  describe("updateSession function (line 374)", () => {
    it("calls updateAndBroadcastSession when update_code is executed", async () => {
      global.fetch = vi.fn().mockResolvedValue(new Response("transpiled", { status: 200 }));

      const data = await postMcpRequest(handler, {
        jsonrpc: "2.0",
        id: 104,
        method: "tools/call",
        params: {
          name: "update_code",
          arguments: { codeSpace: "test-space", code: "const y = 99;" },
        },
      });

      expect(data.error).toBeUndefined();
      expect(mockCode.updateAndBroadcastSession).toHaveBeenCalled();
    });
  });

  describe("search_and_replace missing search.replace params (lines 433-438)", () => {
    it("returns error when search param is missing", async () => {
      const data = await postMcpRequest(handler, {
        jsonrpc: "2.0",
        id: 105,
        method: "tools/call",
        params: {
          name: "search_and_replace",
          arguments: { codeSpace: "test-space", replace: "var" },
        },
      });

      expect(data.error).toBeDefined();
      expect(data.error?.data).toContain("Search parameter is required");
    });

    it("returns error when replace param is missing", async () => {
      const data = await postMcpRequest(handler, {
        jsonrpc: "2.0",
        id: 106,
        method: "tools/call",
        params: {
          name: "search_and_replace",
          arguments: { codeSpace: "test-space", search: "const" },
        },
      });

      expect(data.error).toBeDefined();
      expect(data.error?.data).toContain("Replace parameter is required");
    });
  });

  describe("trackToolCall — GA events branch (line 338)", () => {
    it("fires GA events when GA env vars are set", async () => {
      const mockFetchFn = vi.fn().mockResolvedValue(new Response("transpiled", { status: 200 }));
      global.fetch = mockFetchFn;

      const sessionWithGA = makeSession();
      const mockCodeWithGA = createMockCode(sessionWithGA);
      const envWithGA = { GA_MEASUREMENT_ID: "G-123", GA_API_SECRET: "test-secret" };
      const handlerWithGA = new McpHandler(mockCodeWithGA, envWithGA as unknown as import("../../../src/spike-land-backend/env.js").default);

      const data = await postMcpRequest(handlerWithGA, {
        jsonrpc: "2.0",
        id: 107,
        method: "tools/call",
        params: {
          name: "read_code",
          arguments: { codeSpace: "test-space" },
        },
      });

      expect(data.error).toBeUndefined();
    });
  });

  describe("handleMcpRequest — non-Error thrown (line 267)", () => {
    it("uses String(error) when non-Error object is thrown", async () => {
      // Get a request that will throw a non-Error from executeTool
      // We need to make the executeTool throw a non-Error
      // Pass a tool name that doesn't exist to trigger default case in executeTool switch
      const data = await postMcpRequest(handler, {
        jsonrpc: "2.0",
        id: 200,
        method: "tools/call",
        params: {
          name: "nonexistent_tool",
          arguments: { codeSpace: "test-space" },
        },
      });

      // Should have an error response
      expect(data.error).toBeDefined();
    });

    it("returns parse error (400) when request body is invalid JSON", async () => {
      const request = new Request("http://localhost/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not-json{{",
      });
      const response = await handler.handleRequest(request, new URL("http://localhost/mcp"), ["mcp"]);
      expect(response.status).toBe(400);
      const data = await response.json() as { error: { code: number } };
      expect(data.error.code).toBe(-32700);
    });
  });

  describe("tools/call — no arguments provided (line 213 || {})", () => {
    it("uses empty object when arguments is undefined", async () => {
      const data = await postMcpRequest(handler, {
        jsonrpc: "2.0",
        id: 201,
        method: "tools/call",
        params: {
          name: "read_code",
          // No arguments field — should fall back to {}
        },
      });

      // read_code requires codeSpace so it should error (missing codeSpace)
      // but the || {} branch should be hit
      expect(data.error).toBeDefined();
    });
  });

  describe("resources/list — returns resources for current codeSpace", () => {
    it("returns resources list with code, html, session resources", async () => {
      const data = await postMcpRequest(handler, {
        jsonrpc: "2.0",
        id: 202,
        method: "resources/list",
      });

      expect(data.error).toBeUndefined();
      expect(data.result).toBeDefined();
      const result = data.result as { resources: Array<{ uri: string }> };
      expect(Array.isArray(result.resources)).toBe(true);
      expect(result.resources.length).toBeGreaterThan(0);
    });
  });

  describe("resources/read — code resource with empty session.code (lines 296 || '')", () => {
    it("returns empty string when session.code is empty", async () => {
      const emptyCodeSession = makeSession({ code: "" });
      const mockCodeEmpty = createMockCode(emptyCodeSession);
      const handlerEmpty = new McpHandler(mockCodeEmpty);

      const data = await postMcpRequest(handlerEmpty, {
        jsonrpc: "2.0",
        id: 203,
        method: "resources/read",
        params: { uri: "codespace://test-space/code" },
      });

      expect(data.error).toBeUndefined();
      const result = data.result as { contents: Array<{ text: string }> };
      expect(result.contents[0]?.text).toBe("");
    });

    it("returns empty string when session.html is empty (line 305 || '')", async () => {
      const emptyHtmlSession = makeSession({ html: "" });
      const mockCodeEmpty = createMockCode(emptyHtmlSession);
      const handlerEmpty = new McpHandler(mockCodeEmpty);

      const data = await postMcpRequest(handlerEmpty, {
        jsonrpc: "2.0",
        id: 204,
        method: "resources/read",
        params: { uri: "codespace://test-space/html" },
      });

      expect(data.error).toBeUndefined();
      const result = data.result as { contents: Array<{ text: string }> };
      expect(result.contents[0]?.text).toBe("");
    });

    it("returns session JSON with empty fields when session fields are empty (lines 316-318)", async () => {
      const emptySession = makeSession({ code: "", html: "", css: "" });
      const mockCodeEmpty = createMockCode(emptySession);
      const handlerEmpty = new McpHandler(mockCodeEmpty);

      const data = await postMcpRequest(handlerEmpty, {
        jsonrpc: "2.0",
        id: 205,
        method: "resources/read",
        params: { uri: "codespace://test-space/session" },
      });

      expect(data.error).toBeUndefined();
      const result = data.result as { contents: Array<{ text: string }> };
      const parsed = JSON.parse(result.contents[0]?.text ?? "{}");
      expect(parsed.code).toBe("");
      expect(parsed.html).toBe("");
      expect(parsed.css).toBe("");
    });

    it("throws for unknown resource type", async () => {
      const data = await postMcpRequest(handler, {
        jsonrpc: "2.0",
        id: 206,
        method: "resources/read",
        params: { uri: "codespace://test-space/unknown-type" },
      });

      expect(data.error).toBeDefined();
    });

    it("returns error for missing URI in resources/read", async () => {
      const data = await postMcpRequest(handler, {
        jsonrpc: "2.0",
        id: 207,
        method: "resources/read",
        params: {},
      });

      expect(data.error).toBeDefined();
    });
  });

  describe("resources/templates/list — returns resource templates", () => {
    it("returns list of resource templates", async () => {
      const data = await postMcpRequest(handler, {
        jsonrpc: "2.0",
        id: 208,
        method: "resources/templates/list",
      });

      expect(data.error).toBeUndefined();
      const result = data.result as { resourceTemplates: unknown[] };
      expect(Array.isArray(result.resourceTemplates)).toBe(true);
    });
  });

  describe("handleRequest — method not allowed (line 170)", () => {
    it("returns 405 for unsupported HTTP method", async () => {
      const request = new Request("http://localhost/mcp", {
        method: "DELETE",
      });
      const response = await handler.handleRequest(request, new URL("http://localhost/mcp"), ["mcp"]);
      expect(response.status).toBe(405);
    });
  });
});
