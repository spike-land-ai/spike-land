import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Code } from "../../../src/edge-api/backend/lazy-imports/chatRoom";
import type Env from "../../../src/edge-api/backend/core-logic/env";
import type { McpTool } from "../../../src/edge-api/backend/core-logic/mcp";
import { StorageService } from "../../../src/edge-api/backend/core-logic/services/storageService";
import type { PostRequestBody } from "../../../src/edge-api/backend/core-logic/types/aiRoutes";
import { PostHandler } from "../../../src/edge-api/backend/ai/postHandler";
import { streamGemini } from "../../../src/edge-api/backend/ai/gemini-stream";

// Mock dependencies
vi.mock("../../../src/edge-api/backend/ai/gemini-stream");
vi.mock("../../../src/edge-api/backend/core-logic/services/storageService");

// Setup crypto mock
vi.stubGlobal("crypto", {
  ...globalThis.crypto,
  randomUUID: vi.fn(() => "test-uuid-123"),
});

function createMockMcpServer() {
  return {
    tools: [
      {
        name: "read_code",
        description: "Read code",
        inputSchema: {
          type: "object" as const,
          properties: { codeSpace: { type: "string" } },
          required: ["codeSpace"],
        },
      },
    ] as McpTool[],
    executeTool: vi.fn().mockResolvedValue({ result: "ok" }),
  };
}

function createMockCode(mcpServer = createMockMcpServer()): Code {
  return {
    getSession: vi.fn().mockReturnValue({ codeSpace: "test-space" }),
    getEnv: vi.fn().mockReturnValue({}),
    getMcpServer: vi.fn().mockReturnValue(mcpServer),
  } as unknown as Code;
}

function createMockEnv(): Env {
  return {
    CLAUDE_CODE_OAUTH_TOKEN: "test-token",
    GEMINI_API_KEY: "test-gemini-key",
  } as unknown as Env;
}

function createMockStorageService() {
  return {
    saveRequestBody: vi.fn().mockResolvedValue(undefined),
    loadRequestBody: vi.fn(),
  };
}

function setupStorageServiceMock(
  ctor: typeof StorageService,
  mock: ReturnType<typeof createMockStorageService>,
) {
  vi.mocked(ctor).mockImplementation(function () {
    return mock as unknown as StorageService;
  });
}

describe("PostHandler", () => {
  let postHandler: PostHandler;
  let mockCode: Code;
  let mockEnv: Env;
  let mockStorageService: ReturnType<typeof createMockStorageService>;
  let mockMcpServer: ReturnType<typeof createMockMcpServer>;
  let mockRequest: Request;
  const mockUrl = new URL("https://test.spike.land");

  beforeEach(() => {
    vi.clearAllMocks();

    mockMcpServer = createMockMcpServer();
    mockCode = createMockCode(mockMcpServer);
    mockEnv = createMockEnv();
    mockStorageService = createMockStorageService();
    setupStorageServiceMock(StorageService, mockStorageService);

    // Mock streamGemini to return a simple readable stream
    vi.mocked(streamGemini).mockReturnValue(
      new ReadableStream({
        start(controller) {
          controller.enqueue(
            new TextEncoder().encode('data: {"type":"text_delta","text":"Hello"}\n\n'),
          );
          controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
          controller.close();
        },
      }),
    );

    postHandler = new PostHandler(mockCode, mockEnv);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("constructor", () => {
    it("should initialize with Code and Env", () => {
      expect(postHandler).toBeDefined();
      expect(StorageService).toHaveBeenCalledWith(mockEnv);
    });
  });

  describe("handle", () => {
    it("should handle valid request successfully", async () => {
      const requestBody: PostRequestBody = {
        messages: [
          { role: "user", content: "Hello" },
          { role: "assistant", content: "Hi there" },
        ],
      };

      mockRequest = new Request("https://test.spike.land/api/post", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const response = await postHandler.handle(mockRequest, mockUrl);

      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("text/event-stream");
      expect(mockStorageService.saveRequestBody).toHaveBeenCalledWith("test-space", requestBody);
      expect(streamGemini).toHaveBeenCalled();
    });

    it("should reject requests larger than 10MB", async () => {
      mockRequest = new Request("https://test.spike.land/api/post", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "content-length": "11000000",
        },
        body: JSON.stringify({ messages: [] }),
      });

      const response = await postHandler.handle(mockRequest, mockUrl);

      expect(response.status).toBe(413);
      const body = (await response.json()) as { error: string };
      expect(body.error).toBe("Request too large");
    });

    it("should handle invalid JSON", async () => {
      mockRequest = new Request("https://test.spike.land/api/post", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{ invalid json",
      });

      const response = await postHandler.handle(mockRequest, mockUrl);

      expect(response.status).toBe(500);
      const body = (await response.json()) as { error: string; details?: string };
      expect(body.error).toBe("Failed to process message");
      expect(body.details).toContain("Invalid JSON");
    });

    it("should handle missing CLAUDE_CODE_OAUTH_TOKEN", async () => {
      mockEnv.CLAUDE_CODE_OAUTH_TOKEN = "";

      const requestBody: PostRequestBody = {
        messages: [{ role: "user", content: "Hello" }],
      };

      mockRequest = new Request("https://test.spike.land/api/post", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const response = await postHandler.handle(mockRequest, mockUrl);

      expect(response.status).toBe(503);
      const body = (await response.json()) as { error: string };
      expect(body.error).toContain("CLAUDE_CODE_OAUTH_TOKEN not configured");
    });

    it("should ignore tools from request body", async () => {
      const requestBody: PostRequestBody = {
        messages: [{ role: "user", content: "Hello" }],
        tools: [{ name: "custom_tool", input_schema: { type: "object" } }],
      };

      mockRequest = new Request("https://test.spike.land/api/post", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      await postHandler.handle(mockRequest, mockUrl);
    });

    it("should handle stream errors", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      vi.mocked(streamGemini).mockImplementation(() => {
        throw new Error("Stream failed");
      });

      const requestBody: PostRequestBody = {
        messages: [{ role: "user", content: "Hello" }],
      };

      mockRequest = new Request("https://test.spike.land/api/post", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const response = await postHandler.handle(mockRequest, mockUrl);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("[AI Routes][test-uuid-123] Stream error details:"),
        expect.objectContaining({ message: "Stream failed" }),
      );

      expect(response.status).toBe(500);
      const body = (await response.json()) as { error: string; details?: string };
      expect(body.error).toBe("Failed to process message");
      expect(body.details).toBe("Stream failed");

      consoleErrorSpy.mockRestore();
    });

    it("should pass onToolResult callback to streamGemini", async () => {
      const requestBody: PostRequestBody = {
        messages: [{ role: "user", content: "Hello" }],
      };

      mockRequest = new Request("https://test.spike.land/api/post", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      await postHandler.handle(mockRequest, mockUrl);

      // Verify streamGemini was called with onToolResult callback
      const callArgs = vi.mocked(streamGemini).mock.calls[0]?.[0];
      expect(callArgs.onToolResult).toBeTypeOf("function");

      // Simulate calling the onToolResult callback
      await callArgs.onToolResult("test_tool", { output: "test" });

      expect(mockStorageService.saveRequestBody).toHaveBeenCalledTimes(2);
    });

    it("should handle errors during tool result saving", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error");

      mockStorageService.saveRequestBody
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error("Storage failed"));

      const requestBody: PostRequestBody = {
        messages: [{ role: "user", content: "Hello" }],
      };

      mockRequest = new Request("https://test.spike.land/api/post", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      await postHandler.handle(mockRequest, mockUrl);

      const callArgs = vi.mocked(streamGemini).mock.calls[0]?.[0];
      await callArgs.onToolResult("test_tool", { output: "test" });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Error saving messages after tool call:"),
        expect.any(Error),
      );
    });
  });
});
