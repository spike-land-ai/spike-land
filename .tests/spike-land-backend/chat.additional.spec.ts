/**
 * Additional chat.ts tests for uncovered branches
 * Lines ~334 (CMS GET success)
 */
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { handleCMSIndexRequest } from "../../src/spike-land-backend/chat.js";
import type Env from "../../src/spike-land-backend/env.js";
import { createMockEnv } from "../../src/spike-land-backend/test-utils.js";

vi.mock("../../src/spike-land-backend/anthropicHandler.js", () => ({
  handleAnthropicRequest: vi.fn(),
}));
vi.mock("../../src/spike-land-backend/openaiHandler.js", () => ({
  handleGPT4Request: vi.fn(),
}));
vi.mock("../../src/spike-land-backend/replicateHandler.js", () => ({
  handleReplicateRequest: vi.fn(),
}));
vi.mock("../../src/spike-land-backend/mainFetchHandler.js", () => ({
  handleMainFetch: vi.fn().mockResolvedValue(new Response("main fetch")),
}));
vi.mock("../../src/spike-land-backend/Logs.js", () => ({
  KVLogger: class {
    log = vi.fn().mockResolvedValue(undefined);
    getLogs = vi.fn().mockResolvedValue([]);
  },
}));
vi.mock("../../src/spike-land-backend/staticContent.mjs", () => ({
  ASSET_HASH: "test-hash-123",
  ASSET_MANIFEST: "{}",
  files: {},
}));
vi.mock("@cloudflare/kv-asset-handler", () => ({
  getAssetFromKV: vi.fn().mockResolvedValue(new Response("asset")),
}));
vi.mock("@spike-land-ai/code", () => ({
  serveWithCache: vi.fn().mockReturnValue({
    isAsset: vi.fn().mockReturnValue(false),
    serve: vi.fn().mockResolvedValue(new Response("served")),
  }),
  serverFetchUrl: "/server-fetch",
  routes: {},
  HTML: Promise.resolve("<html></html>"),
  importMap: {},
}));

describe("chat.ts additional coverage", () => {
  let mockEnv: ReturnType<typeof createMockEnv>;

  beforeEach(() => {
    vi.resetAllMocks();
    mockEnv = createMockEnv();
  });

  describe("handleCMSIndexRequest GET success path (line 334)", () => {
    it("returns 200 when R2 object found directly", async () => {
      const mockObject = {
        writeHttpMetadata: vi.fn(),
        httpEtag: "etag-123",
        body: null,
      };
      (mockEnv.R2.get as Mock).mockResolvedValue(mockObject);

      const request = new Request("https://example.com/my-cms/article.html");
      const response = await handleCMSIndexRequest(request, mockEnv as unknown as Env);

      expect(response).toBeDefined();
      expect(response.status).toBe(200);
    });

    it("falls back to .html extension when direct path not found", async () => {
      const mockObject = {
        writeHttpMetadata: vi.fn(),
        httpEtag: "etag-456",
        body: null,
      };
      // First call returns null, second returns content
      (mockEnv.R2.get as Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValue(mockObject);

      const request = new Request("https://example.com/my-cms/article");
      const response = await handleCMSIndexRequest(request, mockEnv as unknown as Env);

      expect(response).toBeDefined();
      expect(response.status).toBe(200);
    });

    it("falls back to parent path.html when first two fail", async () => {
      const mockObject = {
        writeHttpMetadata: vi.fn(),
        httpEtag: "etag-789",
        body: null,
      };
      // First and second calls return null, third returns content
      (mockEnv.R2.get as Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValue(mockObject);

      const request = new Request("https://example.com/my-cms/section/page");
      const response = await handleCMSIndexRequest(request, mockEnv as unknown as Env);

      expect(response).toBeDefined();
      expect(response.status).toBe(200);
    });
  });
});
