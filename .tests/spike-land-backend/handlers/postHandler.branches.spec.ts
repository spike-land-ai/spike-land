import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Code } from "../../../src/edge-api/backend/lazy-imports/chatRoom";
import type Env from "../../../src/edge-api/backend/core-logic/env";
import { PostHandler } from "../../../src/edge-api/backend/ai/postHandler";
import { StorageService } from "../../../src/edge-api/backend/core-logic/services/storageService";
import { streamGemini } from "../../../src/edge-api/backend/ai/gemini-stream";

vi.mock("../../../src/edge-api/backend/ai/gemini-stream");
vi.mock("../../../src/edge-api/backend/core-logic/services/storageService");
vi.mock("../../../src/edge-api/backend/core-logic/lib/ga4", () => ({
  hashClientId: vi.fn().mockResolvedValue("client-id"),
  sendGA4Events: vi.fn().mockResolvedValue(undefined),
}));

vi.stubGlobal("crypto", {
  ...globalThis.crypto,
  randomUUID: vi.fn(() => "test-uuid-456"),
});

function createMockEnv(overrides: Partial<Env> = {}): Env {
  return {
    CLAUDE_CODE_OAUTH_TOKEN: "test-token",
    GEMINI_API_KEY: "test-gemini-key",
    ...overrides,
  } as unknown as Env;
}

function createMockMcpServer(
  tools = [
    {
      name: "test_tool",
      description: "A tool",
      inputSchema: { type: "object" as const, properties: {}, required: [] },
    },
  ],
) {
  return { tools, executeTool: vi.fn().mockResolvedValue({ result: "ok" }) };
}

function createMockCode(mcpServer = createMockMcpServer()): Code {
  return {
    getSession: vi.fn().mockReturnValue({
      codeSpace: "test-space",
      code: "test",
      html: "",
      css: "",
      transpiled: "",
      messages: [],
    }),
    getEnv: vi.fn().mockReturnValue({}),
    getMcpServer: vi.fn().mockReturnValue(mcpServer),
  } as unknown as Code;
}

function makeRequest(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request("https://example.com/messages", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json", ...headers },
  });
}

function makeValidBody(overrides = {}) {
  return { messages: [{ role: "user", content: "Hello" }], ...overrides };
}

describe("PostHandler — branch coverage", () => {
  let mockStorageService: { saveRequestBody: ReturnType<typeof vi.fn> };
  let mockCode: Code;
  let mockEnv: Env;

  beforeEach(() => {
    vi.clearAllMocks();
    mockStorageService = { saveRequestBody: vi.fn().mockResolvedValue(undefined) };
    vi.mocked(StorageService).mockImplementation(function () {
      return mockStorageService as unknown as StorageService;
    });
    mockCode = createMockCode();
    mockEnv = createMockEnv();

    vi.mocked(streamGemini).mockReturnValue(
      new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
          controller.close();
        },
      }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("GA tracking branch", () => {
    it("fires GA events when GA_MEASUREMENT_ID and GA_API_SECRET are set", async () => {
      const { hashClientId, sendGA4Events } = await import(
        "../../../src/edge-api/backend/core-logic/lib/ga4.js"
      );

      const envWithGA = createMockEnv({
        GA_MEASUREMENT_ID: "G-123",
        GA_API_SECRET: "secret",
      } as Partial<Env>);

      const handler = new PostHandler(mockCode, envWithGA);
      const request = makeRequest(makeValidBody());
      await handler.handle(request, new URL("https://example.com/messages"));

      expect(hashClientId).toHaveBeenCalled();
      expect(sendGA4Events).toHaveBeenCalled();
    });

    it("handles GA4 event failure gracefully when hashClientId rejects", async () => {
      const { hashClientId } = await import("../../../src/edge-api/backend/core-logic/lib/ga4.js");
      (hashClientId as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("hash failure"));
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const envWithGA = createMockEnv({
        GA_MEASUREMENT_ID: "G-123",
        GA_API_SECRET: "secret",
      } as Partial<Env>);

      const handler = new PostHandler(mockCode, envWithGA);
      const request = makeRequest(makeValidBody());
      const response = await handler.handle(request, new URL("https://example.com/messages"));

      expect(response.status).toBe(200);
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(consoleSpy).toHaveBeenCalledWith("Failed to send GA4 event:", expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe("catch block — non-Error thrown", () => {
    it("returns 500 with 'Unknown error' when non-Error is thrown", async () => {
      vi.mocked(streamGemini).mockImplementation(() => {
        throw "plain string error";
      });

      const handler = new PostHandler(mockCode, mockEnv);
      const request = makeRequest(makeValidBody());
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const response = await handler.handle(request, new URL("https://example.com/messages"));
      expect(response.status).toBe(500);
      const data = (await response.json()) as { error: string; details?: string };
      expect(data.error).toBe("Failed to process message");
      expect(data.details).toBe("Unknown error");
      consoleSpy.mockRestore();
    });
  });

  describe("processTools — invalid inputSchema type", () => {
    it("skips tool with inputSchema.type !== 'object'", async () => {
      const invalidTool = {
        name: "bad_tool",
        description: "Bad tool",
        inputSchema: { type: "string" as const, properties: {}, required: [] },
      };
      const mcpServer = createMockMcpServer([
        invalidTool as unknown as Parameters<typeof createMockMcpServer>[0][0],
      ]);
      const codeWithBadTool = createMockCode(mcpServer);
      const handler = new PostHandler(codeWithBadTool, mockEnv);

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const request = makeRequest(makeValidBody());
      await handler.handle(request, new URL("https://example.com/messages"));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("invalid inputSchema.type"));
      consoleSpy.mockRestore();
    });
  });

  describe("processTools — no inputSchema", () => {
    it("skips tool with no inputSchema", async () => {
      const noSchemaTool = { name: "no_schema", description: "Tool without schema" };
      const mcpServer = createMockMcpServer([
        noSchemaTool as unknown as Parameters<typeof createMockMcpServer>[0][0],
      ]);
      const codeWithNoSchema = createMockCode(mcpServer);
      const handler = new PostHandler(codeWithNoSchema, mockEnv);

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const request = makeRequest(makeValidBody());
      await handler.handle(request, new URL("https://example.com/messages"));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("has no inputSchema"));
      consoleSpy.mockRestore();
    });
  });

  describe("request body parse error", () => {
    it("throws on invalid JSON parse", async () => {
      const handler = new PostHandler(mockCode, mockEnv);
      const request = new Request("https://example.com/messages", {
        method: "POST",
        body: "not-valid-json{{",
        headers: { "Content-Type": "application/json" },
      });
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const response = await handler.handle(request, new URL("https://example.com/messages"));
      expect(response.status).toBe(500);
      consoleSpy.mockRestore();
    });
  });
});
