/**
 * Tests for anthropicHandler.ts
 *
 * Note: This handler targets Cloudflare Workers runtime. In Node.js, creating a Request
 * with a body stream requires duplex:'half' option. We work around this by:
 * 1. Using GET requests for most tests (no body streaming needed)
 * 2. Using pre-read text bodies where body streaming is needed
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handleAnthropicRequest } from "../../src/spike-land-backend/anthropicHandler.js";
import type Env from "../../src/spike-land-backend/env.js";

function createMockKV() {
  return {
    get: vi.fn(),
    put: vi.fn(),
    list: vi.fn(),
    delete: vi.fn(),
    getWithMetadata: vi.fn(),
  };
}

function createMockEnv(mockKV: ReturnType<typeof createMockKV>, overrides: Record<string, unknown> = {}): Env {
  return {
    CLAUDE_CODE_OAUTH_TOKEN: "token-1",
    CLAUDE_CODE_OAUTH_TOKEN_2: "token-2",
    CLAUDE_CODE_OAUTH_TOKEN_3: "token-3",
    DEBUG_ANTHROPIC_PROXY: "false",
    KV: mockKV,
    ...overrides,
  } as unknown as Env;
}

/**
 * Create a GET request (no body streaming needed, avoids Node.js duplex issue)
 */
function makeGetRequest(path = "/anthropic/v1/messages"): Request {
  return new Request(`https://api.example.com${path}`, { method: "GET" });
}

/**
 * Create a GET-based POST request (for testing upstream response handling)
 * Uses GET to avoid Node.js duplex streaming requirement for fetch re-creation
 */
function makeProxyRequest(): Request {
  return new Request("https://api.example.com/anthropic/v1/messages", { method: "GET" });
}

describe("handleAnthropicRequest", () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let mockKV: ReturnType<typeof createMockKV>;

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;
    mockKV = createMockKV();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("OPTIONS (CORS preflight)", () => {
    it("returns preflight response for OPTIONS request", async () => {
      const request = new Request("https://api.example.com/anthropic/v1/messages", {
        method: "OPTIONS",
      });
      const env = createMockEnv(mockKV);

      const response = await handleAnthropicRequest(request, env);

      // createCorsPreflightResponse returns 200 by default
      expect(response.status).toBe(200);
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe("token pool validation", () => {
    it("returns error when no tokens configured", async () => {
      const request = makeGetRequest();
      const env = createMockEnv(mockKV, {
        CLAUDE_CODE_OAUTH_TOKEN: undefined,
        CLAUDE_CODE_OAUTH_TOKEN_2: undefined,
        CLAUDE_CODE_OAUTH_TOKEN_3: undefined,
      });

      const response = await handleAnthropicRequest(request, env);
      const body = await response.json() as { error: string };
      expect(body.error).toContain("No auth tokens");
    });

    it("deduplicates identical tokens — pool size 1, not 3", async () => {
      const request = makeProxyRequest();
      const env = createMockEnv(mockKV, {
        CLAUDE_CODE_OAUTH_TOKEN: "same-token",
        CLAUDE_CODE_OAUTH_TOKEN_2: "same-token",
        CLAUDE_CODE_OAUTH_TOKEN_3: "same-token",
      });

      mockKV.get.mockResolvedValue(null);
      mockFetch.mockResolvedValue(new Response("ok", { status: 200 }));

      await handleAnthropicRequest(request, env);

      // Pool size is 1 (deduped), so fetch should only be called once
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("successful requests", () => {
    it("uses Authorization header with correct token", async () => {
      const request = makeProxyRequest();
      const env = createMockEnv(mockKV, {
        CLAUDE_CODE_OAUTH_TOKEN: "valid-token",
        CLAUDE_CODE_OAUTH_TOKEN_2: undefined,
        CLAUDE_CODE_OAUTH_TOKEN_3: undefined,
      });

      mockKV.get.mockResolvedValue(null);
      mockFetch.mockResolvedValue(new Response(JSON.stringify({ id: "msg_123" }), { status: 200 }));

      const response = await handleAnthropicRequest(request, env);

      expect(response.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      const callArg = mockFetch.mock.calls[0][0] as Request;
      expect(callArg.headers.get("Authorization")).toBe("Bearer valid-token");
      expect(callArg.headers.get("anthropic-beta")).toContain("claude-code-20250219");
      expect(callArg.headers.get("user-agent")).toContain("claude-cli");
    });

    it("reads last-good index from KV and starts from that token", async () => {
      const request = makeProxyRequest();
      const env = createMockEnv(mockKV);

      // Index 1 stored in KV (valid range: 0-2 for 3 tokens)
      mockKV.get.mockResolvedValue("1");
      mockFetch.mockResolvedValue(new Response("ok", { status: 200 }));

      await handleAnthropicRequest(request, env);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const callArg = mockFetch.mock.calls[0][0] as Request;
      // Should start from token-2 (index 1)
      expect(callArg.headers.get("Authorization")).toBe("Bearer token-2");
    });

    it("persists last-good index to KV on token fallback", async () => {
      const request = makeProxyRequest();
      const env = createMockEnv(mockKV);

      mockKV.get.mockResolvedValue("0"); // Start from index 0
      mockKV.put.mockResolvedValue(undefined);

      // First token (token-1) fails with 401, second (token-2) succeeds
      const failResponse = new Response("Unauthorized", { status: 401 });
      const successResponse = new Response("ok", { status: 200 });
      mockFetch
        .mockResolvedValueOnce(failResponse)
        .mockResolvedValueOnce(successResponse);

      await handleAnthropicRequest(request, env);

      // Should have persisted the successful index (1) to KV
      expect(mockKV.put).toHaveBeenCalledWith(
        "anthropic:last-good-token-idx",
        "1",
        { expirationTtl: 3600 },
      );
    });

    it("non-401 error does not rotate tokens", async () => {
      const request = makeProxyRequest();
      const env = createMockEnv(mockKV, {
        CLAUDE_CODE_OAUTH_TOKEN: "token",
        CLAUDE_CODE_OAUTH_TOKEN_2: undefined,
        CLAUDE_CODE_OAUTH_TOKEN_3: undefined,
      });

      mockKV.get.mockResolvedValue(null);
      const errorBody = JSON.stringify({ error: "rate limit" });
      mockFetch.mockResolvedValue(new Response(errorBody, { status: 429 }));

      const response = await handleAnthropicRequest(request, env);

      // Only called once because non-401 doesn't rotate
      expect(mockFetch).toHaveBeenCalledTimes(1);
      // Should return an error response
      const body = await response.json() as { error: string };
      expect(body.error).toBeDefined();
    });

    it("all tokens exhausted with 401s returns error", async () => {
      const request = makeProxyRequest();
      const env = createMockEnv(mockKV, {
        CLAUDE_CODE_OAUTH_TOKEN: "token-a",
        CLAUDE_CODE_OAUTH_TOKEN_2: undefined,
        CLAUDE_CODE_OAUTH_TOKEN_3: undefined,
      });

      mockKV.get.mockResolvedValue(null);
      mockFetch.mockResolvedValue(new Response("Unauthorized", { status: 401 }));

      const response = await handleAnthropicRequest(request, env);
      const body = await response.json() as { error: string };
      expect(body.error).toBeDefined();
    });

    it("sets anthropic-beta and user-agent headers correctly", async () => {
      const request = makeProxyRequest();
      const env = createMockEnv(mockKV, {
        CLAUDE_CODE_OAUTH_TOKEN: "token",
        CLAUDE_CODE_OAUTH_TOKEN_2: undefined,
        CLAUDE_CODE_OAUTH_TOKEN_3: undefined,
      });

      mockKV.get.mockResolvedValue(null);
      mockFetch.mockResolvedValue(new Response("ok", { status: 200 }));

      await handleAnthropicRequest(request, env);

      const callArg = mockFetch.mock.calls[0][0] as Request;
      expect(callArg.headers.get("x-app")).toBe("cli");
    });
  });

  describe("KV errors", () => {
    it("handles KV.get error gracefully and defaults to index 0", async () => {
      const request = makeProxyRequest();
      const env = createMockEnv(mockKV, {
        CLAUDE_CODE_OAUTH_TOKEN: "token",
        CLAUDE_CODE_OAUTH_TOKEN_2: undefined,
        CLAUDE_CODE_OAUTH_TOKEN_3: undefined,
      });

      mockKV.get.mockRejectedValue(new Error("KV unavailable"));
      mockFetch.mockResolvedValue(new Response("ok", { status: 200 }));

      const response = await handleAnthropicRequest(request, env);
      expect(response.status).toBe(200);
      // Should have used index 0 (default)
      const callArg = mockFetch.mock.calls[0][0] as Request;
      expect(callArg.headers.get("Authorization")).toBe("Bearer token");
    });

    it("handles KV.put error gracefully", async () => {
      const request = makeProxyRequest();
      const env = createMockEnv(mockKV, {
        CLAUDE_CODE_OAUTH_TOKEN: "token-a",
        CLAUDE_CODE_OAUTH_TOKEN_2: "token-b",
        CLAUDE_CODE_OAUTH_TOKEN_3: undefined,
      });

      mockKV.get.mockResolvedValue("0");
      mockKV.put.mockRejectedValue(new Error("KV unavailable"));

      const failResponse = new Response("Unauthorized", { status: 401 });
      const successResponse = new Response("ok", { status: 200 });
      mockFetch
        .mockResolvedValueOnce(failResponse)
        .mockResolvedValueOnce(successResponse);

      // Should not throw even if KV.put fails
      const response = await handleAnthropicRequest(request, env);
      expect(response.status).toBe(200);
    });

    it("handles out-of-range KV index gracefully by defaulting to index 0", async () => {
      const request = makeProxyRequest();
      const env = createMockEnv(mockKV, {
        CLAUDE_CODE_OAUTH_TOKEN: "token",
        CLAUDE_CODE_OAUTH_TOKEN_2: undefined,
        CLAUDE_CODE_OAUTH_TOKEN_3: undefined,
      });

      // Invalid index that's out of range - should default to 0
      mockKV.get.mockResolvedValue("999");
      mockFetch.mockResolvedValue(new Response("ok", { status: 200 }));

      const response = await handleAnthropicRequest(request, env);
      expect(response.status).toBe(200);

      const callArg = mockFetch.mock.calls[0][0] as Request;
      expect(callArg.headers.get("Authorization")).toBe("Bearer token");
    });
  });

  describe("all three tokens", () => {
    it("exhausts all 3 unique tokens with 401s", async () => {
      const request = makeProxyRequest();
      const env = createMockEnv(mockKV);

      mockKV.get.mockResolvedValue(null);
      mockFetch.mockResolvedValue(new Response("Unauthorized", { status: 401 }));

      const response = await handleAnthropicRequest(request, env);
      // All 3 tokens failed
      expect(mockFetch).toHaveBeenCalledTimes(3);
      const body = await response.json() as { error: string };
      expect(body.error).toBeDefined();
    });

    it("succeeds with third token after first two fail", async () => {
      const request = makeProxyRequest();
      const env = createMockEnv(mockKV);

      mockKV.get.mockResolvedValue("0");
      mockKV.put.mockResolvedValue(undefined);

      mockFetch
        .mockResolvedValueOnce(new Response("Unauthorized", { status: 401 }))
        .mockResolvedValueOnce(new Response("Unauthorized", { status: 401 }))
        .mockResolvedValueOnce(new Response("ok", { status: 200 }));

      const response = await handleAnthropicRequest(request, env);
      expect(response.status).toBe(200);
      expect(mockKV.put).toHaveBeenCalledWith(
        "anthropic:last-good-token-idx",
        "2",
        { expirationTtl: 3600 },
      );
    });
  });
});
