import type { ICodeSession } from "@spike-land-ai/code";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Code } from "../../../src/spike-land-backend/chatRoom.js";
import type Env from "../../../src/spike-land-backend/env.js";
import { McpHandler } from "../../../src/spike-land-backend/mcp/handler.js";

const mockFetch = vi.fn();
global.fetch = mockFetch;

interface McpResponse {
  jsonrpc: string;
  id: number | null;
  result?: unknown;
  error?: { code: number; message: string; data?: string };
}

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

async function postMcpRequest(handler: McpHandler, body: unknown): Promise<McpResponse> {
  const request = new Request("http://localhost/mcp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const response = await handler.handleRequest(request, new URL("http://localhost/mcp"), ["mcp"]);
  return response.json() as Promise<McpResponse>;
}

describe("McpHandler", () => {
  let handler: McpHandler;
  let mockCode: Code;
  let session: ICodeSession;

  beforeEach(() => {
    vi.clearAllMocks();
    session = makeSession();
    mockCode = createMockCode(session);
    handler = new McpHandler(mockCode);
  });

  describe("handleRequest routing", () => {
    it("handles OPTIONS with 200", async () => {
      const request = new Request("http://localhost/mcp", { method: "OPTIONS" });
      const response = await handler.handleRequest(request, new URL("http://localhost/mcp"), []);
      expect(response.status).toBe(200);
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    });

    it("handles GET with capabilities info", async () => {
      const request = new Request("http://localhost/mcp", { method: "GET" });
      const response = await handler.handleRequest(request, new URL("http://localhost/mcp"), []);
      expect(response.status).toBe(200);
      const data = await response.json() as McpResponse;
      const result = data.result as Record<string, unknown>;
      expect(result?.serverInfo).toBeDefined();
    });

    it("handles invalid JSON with parse error", async () => {
      const request = new Request("http://localhost/mcp", {
        method: "POST",
        body: "{ not json }",
      });
      const response = await handler.handleRequest(request, new URL("http://localhost/mcp"), []);
      expect(response.status).toBe(400);
      const data = await response.json() as McpResponse;
      expect(data.error?.code).toBe(-32700);
    });

    it("returns 405 for unsupported methods", async () => {
      const request = new Request("http://localhost/mcp", { method: "DELETE" });
      const response = await handler.handleRequest(request, new URL("http://localhost/mcp"), []);
      expect(response.status).toBe(405);
    });
  });

  describe("initialize method", () => {
    it("returns protocol version and capabilities", async () => {
      const data = await postMcpRequest(handler, {
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: { protocolVersion: "2024-11-05" },
      });

      const result = data.result as Record<string, unknown>;
      expect(result?.protocolVersion).toBe("2024-11-05");
      const capabilities = result?.capabilities as Record<string, unknown>;
      expect(capabilities?.tools).toBeDefined();
      const resources = capabilities?.resources as Record<string, unknown>;
      expect(resources?.subscribe).toBe(false);
    });
  });

  describe("tools/list method", () => {
    it("returns all registered tools", async () => {
      const data = await postMcpRequest(handler, {
        jsonrpc: "2.0",
        id: 2,
        method: "tools/list",
      });

      const result = data.result as Record<string, unknown>;
      expect(Array.isArray(result?.tools)).toBe(true);
      const tools = result?.tools as Array<{ name: string }>;
      expect(tools.length).toBeGreaterThan(0);
    });
  });

  describe("resources/list method", () => {
    it("returns resources for current codeSpace", async () => {
      const data = await postMcpRequest(handler, {
        jsonrpc: "2.0",
        id: 3,
        method: "resources/list",
      });

      const result = data.result as Record<string, unknown>;
      const resources = result?.resources as Array<{ uri: string }>;
      expect(Array.isArray(resources)).toBe(true);
      expect(resources.some((r) => r.uri.includes("test-space"))).toBe(true);
    });
  });

  describe("resources/templates/list method", () => {
    it("returns resource templates", async () => {
      const data = await postMcpRequest(handler, {
        jsonrpc: "2.0",
        id: 4,
        method: "resources/templates/list",
      });

      const result = data.result as Record<string, unknown>;
      const templates = result?.resourceTemplates as Array<{ uriTemplate: string }>;
      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
    });
  });

  describe("resources/read method", () => {
    it("reads code resource", async () => {
      const data = await postMcpRequest(handler, {
        jsonrpc: "2.0",
        id: 5,
        method: "resources/read",
        params: { uri: "codespace://test-space/code" },
      });

      const result = data.result as Record<string, unknown>;
      const contents = result?.contents as Array<{ text: string; mimeType: string }>;
      expect(contents[0]?.text).toBe("const x = 1;");
      expect(contents[0]?.mimeType).toBe("text/plain");
    });

    it("reads html resource", async () => {
      const data = await postMcpRequest(handler, {
        jsonrpc: "2.0",
        id: 6,
        method: "resources/read",
        params: { uri: "codespace://test-space/html" },
      });

      const result = data.result as Record<string, unknown>;
      const contents = result?.contents as Array<{ text: string; mimeType: string }>;
      expect(contents[0]?.text).toBe("<div>hello</div>");
      expect(contents[0]?.mimeType).toBe("text/html");
    });

    it("reads session resource", async () => {
      const data = await postMcpRequest(handler, {
        jsonrpc: "2.0",
        id: 7,
        method: "resources/read",
        params: { uri: "codespace://test-space/session" },
      });

      const result = data.result as Record<string, unknown>;
      const contents = result?.contents as Array<{ text: string; mimeType: string }>;
      expect(contents[0]?.mimeType).toBe("application/json");
      const sessionData = JSON.parse(contents[0]?.text);
      expect(sessionData.code).toBe("const x = 1;");
    });

    it("returns error for unknown resource type", async () => {
      const data = await postMcpRequest(handler, {
        jsonrpc: "2.0",
        id: 8,
        method: "resources/read",
        params: { uri: "codespace://test-space/unknown-type" },
      });

      expect(data.error).toBeDefined();
      expect(data.error?.data).toContain("Unknown resource type");
    });

    it("returns error for missing URI param", async () => {
      const data = await postMcpRequest(handler, {
        jsonrpc: "2.0",
        id: 9,
        method: "resources/read",
        params: {},
      });

      expect(data.error).toBeDefined();
      expect(data.error?.data).toContain("Resource URI is required");
    });

    it("returns error for invalid resource URI format", async () => {
      const data = await postMcpRequest(handler, {
        jsonrpc: "2.0",
        id: 10,
        method: "resources/read",
        params: { uri: "invalid-uri" },
      });

      expect(data.error).toBeDefined();
      expect(data.error?.data).toContain("Invalid resource URI");
    });

    it("handles codeSpace switch for resource read", async () => {
      const newSession = makeSession({ codeSpace: "other-space" });
      let currentSession = session;

      vi.mocked(mockCode.getSession).mockImplementation(() => currentSession);
      vi.mocked(mockCode.initializeSession).mockImplementation(async () => {
        currentSession = newSession;
      });

      const data = await postMcpRequest(handler, {
        jsonrpc: "2.0",
        id: 11,
        method: "resources/read",
        params: { uri: "codespace://other-space/code" },
      });

      expect(mockCode.initializeSession).toHaveBeenCalled();
      expect(data.result).toBeDefined();
    });

    it("throws if codeSpace switch fails", async () => {
      vi.mocked(mockCode.getSession).mockImplementation(() => session);
      vi.mocked(mockCode.initializeSession).mockImplementation(async () => {
        // initializeSession doesn't change session, so codeSpace remains "test-space"
      });

      const data = await postMcpRequest(handler, {
        jsonrpc: "2.0",
        id: 12,
        method: "resources/read",
        params: { uri: "codespace://wrong-space/code" },
      });

      expect(data.error).toBeDefined();
    });
  });

  describe("unknown method", () => {
    it("returns method not found error", async () => {
      const data = await postMcpRequest(handler, {
        jsonrpc: "2.0",
        id: 13,
        method: "unknown/method",
      });

      expect(data.error).toBeDefined();
      expect(data.error?.data).toContain("Method unknown/method not found");
    });
  });

  describe("tools/call method", () => {
    it("executes read_code tool", async () => {
      const data = await postMcpRequest(handler, {
        jsonrpc: "2.0",
        id: 14,
        method: "tools/call",
        params: { name: "read_code", arguments: { codeSpace: "test-space" } },
      });

      const result = data.result as Record<string, unknown>;
      const content = result?.content as Array<{ text: string }>;
      const parsed = JSON.parse(content[0]?.text);
      expect(parsed.code).toBe("const x = 1;");
    });

    it("executes read_html tool", async () => {
      const data = await postMcpRequest(handler, {
        jsonrpc: "2.0",
        id: 15,
        method: "tools/call",
        params: { name: "read_html", arguments: { codeSpace: "test-space" } },
      });

      const result = data.result as Record<string, unknown>;
      const content = result?.content as Array<{ text: string }>;
      const parsed = JSON.parse(content[0]?.text);
      expect(parsed.html).toBe("<div>hello</div>");
    });

    it("executes read_session tool", async () => {
      const data = await postMcpRequest(handler, {
        jsonrpc: "2.0",
        id: 16,
        method: "tools/call",
        params: { name: "read_session", arguments: { codeSpace: "test-space" } },
      });

      expect(data.error).toBeUndefined();
      const result = data.result as Record<string, unknown>;
      const content = result?.content as Array<{ text: string }>;
      const parsed = JSON.parse(content[0]?.text);
      expect(parsed.code).toBeDefined();
      expect(parsed.html).toBeDefined();
      expect(parsed.css).toBeDefined();
    });

    it("executes find_lines tool", async () => {
      const data = await postMcpRequest(handler, {
        jsonrpc: "2.0",
        id: 17,
        method: "tools/call",
        params: {
          name: "find_lines",
          arguments: { codeSpace: "test-space", pattern: "const" },
        },
      });

      expect(data.error).toBeUndefined();
      const result = data.result as Record<string, unknown>;
      expect(result?.content).toBeDefined();
    });

    it("executes find_lines tool with isRegex", async () => {
      const data = await postMcpRequest(handler, {
        jsonrpc: "2.0",
        id: 18,
        method: "tools/call",
        params: {
          name: "find_lines",
          arguments: { codeSpace: "test-space", pattern: "const\\s+\\w+", isRegex: true },
        },
      });

      expect(data.error).toBeUndefined();
    });

    it("returns error for missing codeSpace", async () => {
      const data = await postMcpRequest(handler, {
        jsonrpc: "2.0",
        id: 19,
        method: "tools/call",
        params: { name: "read_code", arguments: {} },
      });

      expect(data.error).toBeDefined();
      expect(data.error?.data).toContain("codeSpace parameter is required");
    });

    it("returns error for missing tool name", async () => {
      const data = await postMcpRequest(handler, {
        jsonrpc: "2.0",
        id: 20,
        method: "tools/call",
        params: { arguments: { codeSpace: "test-space" } },
      });

      expect(data.error).toBeDefined();
    });

    it("returns error for unknown tool", async () => {
      const data = await postMcpRequest(handler, {
        jsonrpc: "2.0",
        id: 21,
        method: "tools/call",
        params: { name: "nonexistent_tool", arguments: { codeSpace: "test-space" } },
      });

      expect(data.error).toBeDefined();
      expect(data.error?.data).toContain("Unknown tool");
    });

    it("executes update_code tool", async () => {
      mockFetch.mockResolvedValue(new Response("transpiled", { status: 200 }));

      const data = await postMcpRequest(handler, {
        jsonrpc: "2.0",
        id: 22,
        method: "tools/call",
        params: {
          name: "update_code",
          arguments: { codeSpace: "test-space", code: "const y = 2;" },
        },
      });

      expect(data.error).toBeUndefined();
      expect(mockCode.updateAndBroadcastSession).toHaveBeenCalled();
    });

    it("returns error for update_code missing code param", async () => {
      const data = await postMcpRequest(handler, {
        jsonrpc: "2.0",
        id: 23,
        method: "tools/call",
        params: {
          name: "update_code",
          arguments: { codeSpace: "test-space" },
        },
      });

      expect(data.error).toBeDefined();
      expect(data.error?.data).toContain("Code parameter is required");
    });

    it("executes edit_code tool", async () => {
      session = makeSession({ code: "line1\nline2\nline3" });
      mockCode = createMockCode(session);
      handler = new McpHandler(mockCode);

      const data = await postMcpRequest(handler, {
        jsonrpc: "2.0",
        id: 24,
        method: "tools/call",
        params: {
          name: "edit_code",
          arguments: {
            codeSpace: "test-space",
            edits: [{ startLine: 2, endLine: 2, newContent: "new line2" }],
          },
        },
      });

      expect(data.error).toBeUndefined();
    });

    it("returns error for edit_code missing edits param", async () => {
      const data = await postMcpRequest(handler, {
        jsonrpc: "2.0",
        id: 25,
        method: "tools/call",
        params: {
          name: "edit_code",
          arguments: { codeSpace: "test-space" },
        },
      });

      expect(data.error).toBeDefined();
      expect(data.error?.data).toContain("Edits parameter is required");
    });

    it("executes search_and_replace tool", async () => {
      const data = await postMcpRequest(handler, {
        jsonrpc: "2.0",
        id: 26,
        method: "tools/call",
        params: {
          name: "search_and_replace",
          arguments: {
            codeSpace: "test-space",
            search: "const",
            replace: "var",
          },
        },
      });

      expect(data.error).toBeUndefined();
    });

    it("returns error for search_and_replace missing search param", async () => {
      const data = await postMcpRequest(handler, {
        jsonrpc: "2.0",
        id: 27,
        method: "tools/call",
        params: {
          name: "search_and_replace",
          arguments: { codeSpace: "test-space", replace: "y" },
        },
      });

      expect(data.error).toBeDefined();
      expect(data.error?.data).toContain("Search parameter is required");
    });

    it("returns error for search_and_replace missing replace param", async () => {
      const data = await postMcpRequest(handler, {
        jsonrpc: "2.0",
        id: 28,
        method: "tools/call",
        params: {
          name: "search_and_replace",
          arguments: { codeSpace: "test-space", search: "foo" },
        },
      });

      expect(data.error).toBeDefined();
      expect(data.error?.data).toContain("Replace parameter is required");
    });

    it("executes list_files tool", async () => {
      const data = await postMcpRequest(handler, {
        jsonrpc: "2.0",
        id: 29,
        method: "tools/call",
        params: {
          name: "list_files",
          arguments: { codeSpace: "test-space" },
        },
      });

      expect(data.error).toBeUndefined();
    });

    it("executes read_file tool", async () => {
      const files = new Map([["src/index.ts", "export default function() {}"]]);
      vi.mocked(mockCode.getFiles).mockReturnValue(files);

      const data = await postMcpRequest(handler, {
        jsonrpc: "2.0",
        id: 30,
        method: "tools/call",
        params: {
          name: "read_file",
          arguments: { codeSpace: "test-space", path: "src/index.ts" },
        },
      });

      expect(data.error).toBeUndefined();
    });

    it("returns error for read_file missing path", async () => {
      const data = await postMcpRequest(handler, {
        jsonrpc: "2.0",
        id: 31,
        method: "tools/call",
        params: {
          name: "read_file",
          arguments: { codeSpace: "test-space" },
        },
      });

      expect(data.error).toBeDefined();
      expect(data.error?.data).toContain("Path parameter is required");
    });

    it("executes write_file tool", async () => {
      const files = new Map<string, string>();
      vi.mocked(mockCode.getFiles).mockReturnValue(files);

      const data = await postMcpRequest(handler, {
        jsonrpc: "2.0",
        id: 32,
        method: "tools/call",
        params: {
          name: "write_file",
          arguments: { codeSpace: "test-space", path: "new-file.ts", content: "export {}" },
        },
      });

      expect(data.error).toBeUndefined();
    });

    it("returns error for write_file missing path", async () => {
      const data = await postMcpRequest(handler, {
        jsonrpc: "2.0",
        id: 33,
        method: "tools/call",
        params: {
          name: "write_file",
          arguments: { codeSpace: "test-space", content: "x" },
        },
      });

      expect(data.error).toBeDefined();
      expect(data.error?.data).toContain("Path parameter is required");
    });

    it("returns error for write_file missing content", async () => {
      const data = await postMcpRequest(handler, {
        jsonrpc: "2.0",
        id: 34,
        method: "tools/call",
        params: {
          name: "write_file",
          arguments: { codeSpace: "test-space", path: "file.ts" },
        },
      });

      expect(data.error).toBeDefined();
      expect(data.error?.data).toContain("Content parameter is required");
    });

    it("executes delete_file tool", async () => {
      const files = new Map([["old-file.ts", "content"]]);
      vi.mocked(mockCode.getFiles).mockReturnValue(files);

      const data = await postMcpRequest(handler, {
        jsonrpc: "2.0",
        id: 35,
        method: "tools/call",
        params: {
          name: "delete_file",
          arguments: { codeSpace: "test-space", path: "old-file.ts" },
        },
      });

      expect(data.error).toBeUndefined();
    });

    it("returns error for delete_file missing path", async () => {
      const data = await postMcpRequest(handler, {
        jsonrpc: "2.0",
        id: 36,
        method: "tools/call",
        params: {
          name: "delete_file",
          arguments: { codeSpace: "test-space" },
        },
      });

      expect(data.error).toBeDefined();
      expect(data.error?.data).toContain("Path parameter is required");
    });
  });

  describe("setEnv and GA4 tracking", () => {
    it("does not track when no GA env vars", async () => {
      const mockEnv = {
        GA_MEASUREMENT_ID: undefined,
        GA_API_SECRET: undefined,
      } as unknown as Env;

      handler.setEnv(mockEnv);

      await postMcpRequest(handler, {
        jsonrpc: "2.0",
        id: 37,
        method: "tools/call",
        params: { name: "read_code", arguments: { codeSpace: "test-space" } },
      });

      // GA4 fetch should not be called since no GA env vars
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("tracks tool calls when GA env vars present", async () => {
      const mockEnv = {
        GA_MEASUREMENT_ID: "G-TEST123",
        GA_API_SECRET: "secret",
      } as unknown as Env;

      handler.setEnv(mockEnv);
      mockFetch.mockResolvedValue(new Response("ok", { status: 200 }));

      await postMcpRequest(handler, {
        jsonrpc: "2.0",
        id: 38,
        method: "tools/call",
        params: { name: "read_code", arguments: { codeSpace: "test-space" } },
      });

      // Eventually GA4 fetch will be called (fire-and-forget)
      await vi.waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });
  });

  describe("addTool, removeTool, getTools", () => {
    it("addTool registers a new tool", () => {
      const customTool = {
        name: "custom",
        description: "custom tool",
        inputSchema: { type: "object" as const, properties: {} },
      };
      handler.addTool(customTool);
      const tools = handler.getTools();
      expect(tools.some((t) => t.name === "custom")).toBe(true);
    });

    it("removeTool removes existing tool and returns true", () => {
      const removed = handler.removeTool("read_code");
      expect(removed).toBe(true);
      expect(handler.getTools().some((t) => t.name === "read_code")).toBe(false);
    });

    it("removeTool returns false for nonexistent tool", () => {
      const removed = handler.removeTool("nonexistent");
      expect(removed).toBe(false);
    });

    it("getTools returns a copy of the tools array", () => {
      const tools = handler.getTools();
      const originalLength = tools.length;
      tools.push({ name: "injected", description: "", inputSchema: { type: "object", properties: {} } });
      expect(handler.getTools()).toHaveLength(originalLength);
    });
  });

  describe("applyLineEdits", () => {
    it("delegates to applyLineEdits utility", () => {
      const result = handler.applyLineEdits("line1\nline2\nline3", [
        { startLine: 2, endLine: 2, newContent: "changed" },
      ]);
      expect(result.newCode).toBe("line1\nchanged\nline3");
    });
  });
});
