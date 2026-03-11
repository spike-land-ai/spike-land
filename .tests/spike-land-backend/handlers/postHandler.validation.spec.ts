import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Code } from "../../../src/edge-api/backend/lazy-imports/chatRoom";
import type Env from "../../../src/edge-api/backend/core-logic/env";
import { StorageService } from "../../../src/edge-api/backend/core-logic/services/storageService";
import type { PostRequestBody } from "../../../src/edge-api/backend/core-logic/types/aiRoutes";
import { PostHandler } from "../../../src/edge-api/backend/ai/postHandler";

// Mock dependencies
vi.mock("../../../src/edge-api/backend/ai/gemini-stream");
vi.mock("../../../src/edge-api/backend/core-logic/services/storageService");

vi.stubGlobal("crypto", {
  ...globalThis.crypto,
  randomUUID: vi.fn(() => "test-uuid-val"),
});

function createMockCode(): Code {
  return {
    getSession: vi.fn().mockReturnValue({ codeSpace: "test-space" }),
    getEnv: vi.fn().mockReturnValue({}),
    getMcpServer: vi.fn().mockReturnValue({ tools: [], executeTool: vi.fn() }),
  } as unknown as Code;
}

function createMockEnv(): Env {
  return { CLAUDE_CODE_OAUTH_TOKEN: "test-key", GEMINI_API_KEY: "test-key" } as Env;
}

describe("PostHandler - Validation", () => {
  let postHandler: PostHandler;
  let mockCode: Code;
  let mockEnv: Env;

  beforeEach(() => {
    vi.clearAllMocks();

    mockCode = createMockCode();
    mockEnv = createMockEnv();
    const mockStorageService = {
      saveRequestBody: vi.fn().mockResolvedValue(undefined),
      loadRequestBody: vi.fn(),
    };
    vi.mocked(StorageService).mockImplementation(function () {
      return mockStorageService as unknown as StorageService;
    });

    postHandler = new PostHandler(mockCode, mockEnv);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("parseRequestBody", () => {
    const callParseRequestBody = async (request: Request) => {
      return (
        postHandler as unknown as {
          parseRequestBody: (request: Request) => Promise<PostRequestBody>;
        }
      ).parseRequestBody(request);
    };

    it("should parse valid JSON", async () => {
      const body = { messages: [{ role: "user", content: "test" }] };
      const request = new Request("https://test.com", {
        method: "POST",
        body: JSON.stringify(body),
      });

      const result = await callParseRequestBody(request);
      expect(result).toEqual(body);
    });

    it("should throw on invalid JSON", async () => {
      const request = new Request("https://test.com", {
        method: "POST",
        body: "{ invalid",
      });

      await expect(callParseRequestBody(request)).rejects.toThrow("Invalid JSON in request body");
    });
  });
});
