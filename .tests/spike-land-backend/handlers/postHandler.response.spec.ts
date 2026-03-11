import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Code } from "../../../src/edge-api/backend/lazy-imports/chatRoom";
import type Env from "../../../src/edge-api/backend/core-logic/env";
import type { McpTool } from "../../../src/edge-api/backend/core-logic/mcp";
import { StorageService } from "../../../src/edge-api/backend/core-logic/services/storageService";
import type { PostRequestBody } from "../../../src/edge-api/backend/core-logic/types/aiRoutes";
import { PostHandler } from "../../../src/edge-api/backend/ai/postHandler";
import { streamGemini } from "../../../src/edge-api/backend/ai/gemini-stream";
import type { ChatMessage } from "../../../src/edge-api/backend/ai/gemini-stream";

// Mock dependencies
vi.mock("../../../src/edge-api/backend/ai/gemini-stream");
vi.mock("../../../src/edge-api/backend/core-logic/services/storageService");

vi.stubGlobal("crypto", {
  ...globalThis.crypto,
  randomUUID: vi.fn(() => "req-123"),
});

function createMockMcpServer() {
  return {
    tools: [
      {
        name: "read_code",
        description: "Read code",
        inputSchema: { type: "object" as const, properties: {}, required: [] },
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

describe("PostHandler - Response", () => {
  let postHandler: PostHandler;
  let mockCode: Code;
  let mockEnv: Env;
  let mockStorageService: { saveRequestBody: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();

    mockCode = createMockCode();
    mockEnv = { CLAUDE_CODE_OAUTH_TOKEN: "test-key", GEMINI_API_KEY: "test-gemini-key" } as Env;
    mockStorageService = { saveRequestBody: vi.fn().mockResolvedValue(undefined) };
    vi.mocked(StorageService).mockImplementation(function () {
      return mockStorageService as unknown as StorageService;
    });

    vi.mocked(streamGemini).mockReturnValue(
      new ReadableStream({
        start(controller) {
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

  describe("createErrorResponse", () => {
    const callCreateErrorResponse = (error: string, status: number, details?: string) => {
      return (
        postHandler as unknown as {
          createErrorResponse: (error: string, status: number, details?: string) => Response;
        }
      ).createErrorResponse(error, status, details);
    };

    it("should create error response without details", () => {
      const response = callCreateErrorResponse("Test error", 400);
      expect(response.status).toBe(400);
    });

    it("should create error response with details", async () => {
      const response = callCreateErrorResponse("Test error", 500, "Detailed info");
      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body).toEqual({ error: "Test error", details: "Detailed info" });
    });
  });

  describe("createStreamResponse", () => {
    it("should create stream with correct parameters", async () => {
      const messages: ChatMessage[] = [{ role: "user" as const, content: "Hello" }];
      const tools: McpTool[] = mockCode.getMcpServer().tools;
      const body: PostRequestBody = { messages: [] };

      await (
        postHandler as unknown as {
          createStreamResponse: (
            messages: ChatMessage[],
            tools: McpTool[],
            body: PostRequestBody,
            codeSpace: string,
            requestId: string,
          ) => Promise<Response>;
        }
      ).createStreamResponse(messages, tools, body, "test-space", "req-123");

      expect(streamGemini).toHaveBeenCalledWith({
        apiKey: "test-gemini-key",
        model: "gemini-3-flash-preview",
        systemPrompt: expect.stringContaining("CodeSpace: test-space"),
        messages,
        tools: expect.any(Object),
        onToolResult: expect.any(Function),
      });
    });

    it("should return SSE response with correct headers", async () => {
      const request = new Request("https://test.spike.land/api/post", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: "test" }] }),
      });

      const response = await postHandler.handle(request, new URL("https://test.spike.land"));
      expect(response.headers.get("Content-Type")).toBe("text/event-stream");
      expect(response.headers.get("Cache-Control")).toBe("no-cache");
    });
  });
});
