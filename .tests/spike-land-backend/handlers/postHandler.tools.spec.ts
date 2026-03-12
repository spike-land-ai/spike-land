import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Code } from "../../../src/edge-api/backend/lazy-imports/chatRoom";
import type Env from "../../../src/edge-api/backend/core-logic/env";
import type { McpTool } from "../../../src/edge-api/backend/core-logic/mcp";
import { StorageService } from "../../../src/edge-api/backend/core-logic/services/storageService";
import { PostHandler } from "../../../src/edge-api/backend/ai/postHandler";
import { streamGemini } from "../../../src/edge-api/backend/ai/gemini-stream";
import type { ToolDef } from "../../../src/edge-api/backend/ai/gemini-stream";

// Mock dependencies
vi.mock("../../../src/edge-api/backend/ai/gemini-stream");
vi.mock("../../../src/edge-api/backend/core-logic/services/storageService");

describe("PostHandler - Tool Schema Validation", () => {
  let postHandler: PostHandler;
  let mockCode: Code;
  let mockEnv: Env;

  beforeEach(() => {
    vi.clearAllMocks();

    vi.stubGlobal("crypto", {
      ...globalThis.crypto,
      randomUUID: vi.fn(() => "test-uuid-tools"),
    });

    // Mock streamGemini
    vi.mocked(streamGemini).mockReturnValue(
      new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
          controller.close();
        },
      }),
    );

    mockEnv = { CLAUDE_CODE_OAUTH_TOKEN: "test-key", GEMINI_API_KEY: "test-gemini-key" } as Env;

    const mockTools: McpTool[] = [
      {
        name: "read_code",
        description: "Read current code",
        inputSchema: {
          type: "object",
          properties: { codeSpace: { type: "string", description: "The codeSpace identifier" } },
          required: ["codeSpace"],
        },
      },
      {
        name: "update_code",
        description: "Update code",
        inputSchema: {
          type: "object",
          properties: { codeSpace: { type: "string" }, code: { type: "string" } },
          required: ["codeSpace", "code"],
        },
      },
    ];

    mockCode = {
      getSession: vi.fn().mockReturnValue({ codeSpace: "test-space" }),
      getEnv: vi.fn().mockReturnValue(mockEnv),
      getMcpServer: vi.fn().mockReturnValue({ tools: mockTools, executeTool: vi.fn() }),
    } as unknown as Code;

    const mockStorageService = {
      saveRequestBody: vi.fn().mockResolvedValue(undefined),
      loadRequestBody: vi.fn(),
      env: mockEnv,
    };
    vi.mocked(StorageService).mockImplementation(function () {
      return mockStorageService as unknown as StorageService;
    });

    postHandler = new PostHandler(mockCode, mockEnv);
  });

  describe("Tool Schema Format", () => {
    it("should ensure all MCP tools have type: 'object' in inputSchema", () => {
      const mcpServer = mockCode.getMcpServer();
      const tools = mcpServer.tools;

      tools.forEach((tool) => {
        expect(tool.inputSchema).toBeDefined();
        expect(tool.inputSchema.type).toBe("object");
        expect(tool.inputSchema.properties).toBeDefined();
        expect(typeof tool.inputSchema.properties).toBe("object");
      });
    });

    it("should convert tools to ToolDef format", async () => {
      const request = new Request("https://test.spike.land/api/post", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: "test" }] }),
      });

      await postHandler.handle(request, new URL("https://test.spike.land"));

      expect(streamGemini).toHaveBeenCalled();

      const callArgs = vi.mocked(streamGemini).mock.calls[0]?.[0];
      const tools = callArgs.tools;

      expect(typeof tools).toBe("object");

      Object.entries(tools).forEach(([_toolName, tool]: [string, ToolDef]) => {
        expect(tool).toHaveProperty("parameters");
        expect(tool).toHaveProperty("execute");
        expect(typeof tool.execute).toBe("function");
      });
    });

    it("should handle DISABLE_AI_TOOLS environment variable", async () => {
      mockEnv.DISABLE_AI_TOOLS = "true";

      const request = new Request("https://test.spike.land/api/post", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: "test" }] }),
      });

      await postHandler.handle(request, new URL("https://test.spike.land"));

      const callArgs = vi.mocked(streamGemini).mock.calls[0]?.[0];
      expect(callArgs.tools).toBeUndefined();
    });
  });

  describe("Tool Execute Functions", () => {
    it("should create valid tool execute functions", async () => {
      const mockExecuteTool = vi.fn().mockResolvedValue({ success: true });
      (mockCode.getMcpServer() as unknown as { executeTool: typeof mockExecuteTool }).executeTool =
        mockExecuteTool;

      const request = new Request("https://test.spike.land/api/post", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: "test" }] }),
      });

      await postHandler.handle(request, new URL("https://test.spike.land"));

      const callArgs = vi.mocked(streamGemini).mock.calls[0]?.[0];
      const tools = callArgs.tools;

      if (tools.read_code) {
        const result = await tools.read_code.execute({ codeSpace: "test" });
        expect(mockExecuteTool).toHaveBeenCalledWith("read_code", { codeSpace: "test-space" });
        expect(result).toEqual({ success: true });
      }
    });

    it("tool execute function catches and rethrows executeTool errors", async () => {
      const throwingExecuteTool = vi.fn().mockRejectedValue(new Error("tool crashed"));
      (
        mockCode.getMcpServer() as unknown as { executeTool: typeof throwingExecuteTool }
      ).executeTool = throwingExecuteTool;

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const request = new Request("https://test.spike.land/api/post", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: "test" }] }),
      });

      await postHandler.handle(request, new URL("https://test.spike.land"));

      const callArgs = vi.mocked(streamGemini).mock.calls[0]?.[0];
      const tools = callArgs.tools;

      const toolEntry = Object.values(tools)[0];
      if (toolEntry?.execute) {
        await expect(toolEntry.execute({ codeSpace: "test" })).rejects.toThrow("Failed to execute");
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining("Error executing tool"),
          expect.any(Error),
        );
      }

      consoleSpy.mockRestore();
    });

    it("should skip tools without inputSchema", async () => {
      const consoleWarnSpy = vi.spyOn(console, "warn");

      const tools = mockCode.getMcpServer().tools;
      tools.push({
        name: "invalid_tool",
        description: "Tool without schema",
        inputSchema: undefined as unknown as McpTool["inputSchema"],
      });

      const request = new Request("https://test.spike.land/api/post", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: "test" }] }),
      });

      await postHandler.handle(request, new URL("https://test.spike.land"));

      const warnCalls = consoleWarnSpy.mock.calls;
      const hasExpectedWarning = warnCalls.some((call) =>
        call.some(
          (arg) =>
            typeof arg === "string" &&
            arg.includes("Tool 'invalid_tool' has no inputSchema, skipping"),
        ),
      );
      expect(hasExpectedWarning).toBe(true);
    });
  });
});
