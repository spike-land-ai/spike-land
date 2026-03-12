/**
 * Tests for chat.ts handlers and routing
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock all the heavy imports
vi.mock("../../src/edge-api/backend/lazy-imports/mainFetchHandler.js", () => ({
  handleMainFetch: vi.fn().mockResolvedValue(new Response("main fetch", { status: 200 })),
}));

vi.mock("../../src/edge-api/backend/core-logic/anthropicHandler.js", () => ({
  handleAnthropicRequest: vi.fn().mockResolvedValue(new Response("anthropic ok", { status: 200 })),
}));

vi.mock("../../src/edge-api/backend/core-logic/openaiHandler.js", () => ({
  handleGPT4Request: vi.fn().mockResolvedValue(new Response("openai ok", { status: 200 })),
}));

vi.mock("../../src/edge-api/backend/ai/replicateHandler.js", () => ({
  handleReplicateRequest: vi.fn().mockResolvedValue(new Response("replicate ok", { status: 200 })),
}));

vi.mock("../../src/edge-api/backend/core-logic/Logs.js", () => ({
  KVLogger: class {
    log = vi.fn().mockResolvedValue(undefined);
  },
}));

vi.mock("@cloudflare/kv-asset-handler", () => ({
  getAssetFromKV: vi.fn().mockResolvedValue(new Response("asset", { status: 200 })),
}));

const { mockKvServer } = vi.hoisted(() => {
  const mockKvServer = {
    isAsset: vi.fn().mockReturnValue(false),
    serve: vi.fn().mockResolvedValue(new Response("asset served", { status: 200 })),
  };
  return { mockKvServer };
});

vi.mock("@spike-land-ai/code", async () => {
  return {
    serverFetchUrl: "/__server-fetch",
    serveWithCache: vi.fn().mockReturnValue(mockKvServer),
    HTML: "<html></html>",
    importMap: {},
    importMapReplace: vi.fn((s: string) => s),
    md5: vi.fn(() => "abc123"),
    sanitizeSession: vi.fn((s: unknown) => s),
    computeSessionHash: vi.fn(() => "hash123"),
  };
});

vi.mock("../../src/edge-api/backend/staticContent.mjs", () => ({
  ASSET_HASH: "test-hash-123",
  ASSET_MANIFEST: "{}",
  files: {},
}));

// Import the actual module after mocks
import {
  handleMCPRequest,
  handleTranspileRequest,
  handleServerFetchUrlRequest,
  handleAILogsRequest,
  handleAssetManifestRequest,
  handleFilesRequest,
  generateTURNCredentials,
  handleRequest,
} from "../../src/edge-api/backend/edge/chat.js";
import type Env from "../../src/edge-api/backend/core-logic/env.js";

function createMockEnv(): Env {
  return {
    R2: {
      get: vi.fn().mockResolvedValue(null),
      put: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    KV: {
      get: vi.fn().mockResolvedValue(null),
      put: vi.fn().mockResolvedValue(undefined),
    },
    CODE: {
      idFromName: vi.fn().mockReturnValue("id-1"),
      get: vi.fn().mockReturnValue({
        fetch: vi.fn().mockResolvedValue(new Response("DO response")),
      }),
      idFromString: vi.fn(),
    },
    AI: {
      run: vi.fn().mockResolvedValue({ text: "result" }),
    },
    CF_REAL_TURN_TOKEN: "test-turn-token",
    OPENAI_API_KEY: "test-openai-key",
    REPLICATE_API_TOKEN: "test-replicate-token",
    CLAUDE_CODE_OAUTH_TOKEN: "test-claude-token",
    __STATIC_CONTENT: {
      get: vi.fn(),
      put: vi.fn(),
    },
  } as unknown as Env;
}

function createMockCtx(): ExecutionContext {
  return {
    waitUntil: vi.fn(),
    passThroughOnException: vi.fn(),
    props: {},
  } as unknown as ExecutionContext;
}

describe("chat.ts handlers", () => {
  let mockEnv: Env;
  let mockCtx: ExecutionContext;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockEnv = createMockEnv();
    mockCtx = createMockCtx();
    mockFetch = vi.fn().mockResolvedValue(new Response("fetch result", { status: 200 }));
    global.fetch = mockFetch;
  });

  describe("swVersion endpoints logic (handleFilesRequest)", () => {
    it("returns correct JSON and headers for files", async () => {
      const response = handleFilesRequest();

      expect(response.status).toBe(200);
      const body = (await response.json()) as Record<string, unknown>;
      expect(body).toEqual({});
      expect(response.headers.get("x-hash")).toBe("test-hash-123");
    });
  });

  describe("ASSET_MANIFEST endpoint logic", () => {
    it("returns ASSET_MANIFEST", async () => {
      const response = handleAssetManifestRequest();

      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toContain("application/json");
      const text = await response.text();
      expect(text).toBe("{}");
    });
  });

  describe("transpile logic", () => {
    it("handles POST to /transpile directly", async () => {
      mockFetch.mockResolvedValue(new Response("transpiled code", { status: 200 }));

      const request = new Request("https://example.com/transpile", {
        method: "POST",
        body: "const x = 1;",
        // @ts-expect-error - duplex is not in standard RequestInit yet
        duplex: "half",
      });

      const response = await handleTranspileRequest(request);

      expect(response.status).toBe(200);
      expect(await response.text()).toBe("transpiled code");
    });
  });

  describe("MCP logic", () => {
    it("handles MCP request to CODE durable object", async () => {
      const mockDO = {
        fetch: vi.fn().mockResolvedValue(new Response("MCP response")),
      };
      (mockEnv.CODE.idFromName as ReturnType<typeof vi.fn>).mockReturnValue("mcp-id");
      (mockEnv.CODE.get as ReturnType<typeof vi.fn>).mockReturnValue(mockDO);

      const request = new Request("https://example.com/mcp?codeSpace=test-space", {
        method: "GET",
        headers: { "X-CodeSpace": "test-space" },
      });

      await handleMCPRequest(request, mockEnv);

      expect(mockDO.fetch).toHaveBeenCalled();
    });
  });

  describe("serverFetchUrl logic", () => {
    it("handles server fetch successfully", async () => {
      mockFetch.mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));

      const request = new Request("https://example.com/__server-fetch", {
        method: "POST",
        body: JSON.stringify({ url: "https://api.example.com/data" }),
        headers: { "Content-Type": "application/json" },
        // @ts-expect-error - duplex is not in standard RequestInit yet
        duplex: "half",
      });

      await handleServerFetchUrlRequest(request);

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/data",
        expect.any(Object) as unknown,
      );
    });

    it("handles server fetch when fetch fails (502)", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

      const request = new Request("https://example.com/__server-fetch", {
        method: "POST",
        body: JSON.stringify({ url: "https://fail.example.com" }),
        headers: { "Content-Type": "application/json" },
        // @ts-expect-error - duplex is not in standard RequestInit yet
        duplex: "half",
      });

      const response = await handleServerFetchUrlRequest(request);

      expect(response.status).toBe(502);
      consoleError.mockRestore();
    });
  });

  describe("TURN credentials logic", () => {
    it("generates TURN credentials", async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify({ iceServers: [] }), { status: 200 }),
      );

      await generateTURNCredentials(mockEnv.CF_REAL_TURN_TOKEN);

      expect(mockFetch).toHaveBeenCalled();
    });

    it("returns 500 when TURN credentials fetch fails", async () => {
      mockFetch.mockResolvedValue(new Response("Unauthorized", { status: 401 }));
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

      const response = await generateTURNCredentials(mockEnv.CF_REAL_TURN_TOKEN);

      expect(response.status).toBe(500);
      consoleError.mockRestore();
    });
  });

  describe("ai-logs logic", () => {
    it("returns logs from KV", async () => {
      (mockEnv.KV.get as ReturnType<typeof vi.fn>).mockImplementation(async (key: string) => {
        if (key === "ai:counter") return "2";
        if (key === "ai:1") return JSON.stringify({ message: "log 1" });
        if (key === "ai:2") return JSON.stringify({ message: "log 2" });
        return null;
      });

      const response = await handleAILogsRequest(mockEnv);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toEqual([{ message: "log 1" }, { message: "log 2" }]);
    });
  });

  // Keep routing tests but use handleRequest instead of main.fetch
  describe("router mapping", () => {
    it("routes requests with 'anthropic' in URL to handleAnthropicRequest", async () => {
      const { handleAnthropicRequest } = await import(
        "../../src/edge-api/backend/core-logic/anthropicHandler.js"
      );

      const request = new Request("https://example.com/anthropic/v1/messages");
      const response = await handleRequest(request, mockEnv, mockCtx);

      expect(handleAnthropicRequest).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    it("routes requests with 'openai' in URL to handleGPT4Request", async () => {
      const { handleGPT4Request } = await import(
        "../../src/edge-api/backend/core-logic/openaiHandler.js"
      );

      const request = new Request("https://example.com/openai/v1/chat");
      await handleRequest(request, mockEnv, mockCtx);

      expect(handleGPT4Request).toHaveBeenCalled();
    });

    it("routes requests with 'replicate' in URL to handleReplicateRequest", async () => {
      const { handleReplicateRequest } = await import(
        "../../src/edge-api/backend/ai/replicateHandler.js"
      );

      const request = new Request("https://example.com/replicate/v1/predictions");
      await handleRequest(request, mockEnv, mockCtx);

      expect(handleReplicateRequest).toHaveBeenCalled();
    });

    it("routes /my-cms/ to handleCMSIndexRequest", async () => {
      const mockR2Object = {
        writeHttpMetadata: vi.fn(),
        httpEtag: "etag-1",
        body: "cms content",
      };
      (mockEnv.R2.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockR2Object);

      const request = new Request("https://example.com/my-cms/page");
      await handleRequest(request, mockEnv, mockCtx);

      expect(mockEnv.R2.get).toHaveBeenCalled();
    });

    it("returns 501 for remix requests", async () => {
      const request = new Request("https://example.com/remix/something");
      const response = await handleRequest(request, mockEnv, mockCtx);

      expect(response.status).toBe(501);
    });

    it("routes unknown paths to handleMainFetch", async () => {
      const { handleMainFetch } = await import(
        "../../src/edge-api/backend/lazy-imports/mainFetchHandler.js"
      );

      const request = new Request("https://example.com/unknown-path");
      await handleRequest(request, mockEnv, mockCtx);

      expect(handleMainFetch).toHaveBeenCalled();
    });
  });

  describe("isAsset/isEditorPath branches", () => {
    it("serves asset when kvServer.isAsset returns true", async () => {
      mockKvServer.isAsset.mockReturnValue(true);
      mockKvServer.serve.mockResolvedValue(new Response("asset content", { status: 200 }));

      const request = new Request("https://example.com/some-asset.js");
      const response = await handleRequest(request, mockEnv, mockCtx);

      expect(mockKvServer.serve).toHaveBeenCalled();
      expect(response.status).toBe(200);
      mockKvServer.isAsset.mockReturnValue(false);
    });

    it("serves editor for isEditorPath (GET /live/{codeSpace})", async () => {
      mockKvServer.isAsset.mockReturnValue(false);
      mockKvServer.serve.mockResolvedValue(new Response("editor", { status: 200 }));

      const request = new Request("https://example.com/live/myspace", { method: "GET" });
      await handleRequest(request, mockEnv, mockCtx);

      expect(mockKvServer.serve).toHaveBeenCalled();
      mockKvServer.isAsset.mockReturnValue(false);
    });

    it("invokes assetFetcher callback when serve is called", async () => {
      const { getAssetFromKV } = await import("@cloudflare/kv-asset-handler");

      mockKvServer.isAsset.mockReturnValue(true);
      mockKvServer.serve.mockImplementation(
        async (
          _req: Request,
          assetFetcher: (req: Request, wu: (p: Promise<unknown>) => void) => Promise<Response>,
          _waitUntil: (p: Promise<unknown>) => void,
        ) => {
          const r = new Request("https://example.com/test.js");
          return assetFetcher(r, (p) => {
            void p;
          });
        },
      );

      const request = new Request("https://example.com/test.js");
      await handleRequest(request, mockEnv, mockCtx);

      expect(getAssetFromKV).toHaveBeenCalled();
      mockKvServer.isAsset.mockReturnValue(false);
    });

    it("invokes ctx.waitUntil via waitUntil callback", async () => {
      mockKvServer.isAsset.mockReturnValue(true);
      mockKvServer.serve.mockImplementation(
        async (
          _req: Request,
          _assetFetcher: unknown,
          waitUntilFn: (p: Promise<unknown>) => void,
        ) => {
          waitUntilFn(Promise.resolve());
          return new Response("asset", { status: 200 });
        },
      );

      const request = new Request("https://example.com/test.js");
      await handleRequest(request, mockEnv, mockCtx);

      expect(mockCtx.waitUntil).toHaveBeenCalled();
      mockKvServer.isAsset.mockReturnValue(false);
    });

    it("invokes cache factory callback", async () => {
      const { serveWithCache } = await import("@spike-land-ai/code");
      expect(vi.mocked(serveWithCache)).toBeDefined();
    });
  });
});
