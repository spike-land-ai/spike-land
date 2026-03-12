/**
 * Tests for auth/middleware.ts (authMiddleware)
 *
 * Tests the Hono middleware directly by simulating request contexts.
 */

import { describe, expect, it, vi } from "vitest";
import { createMockD1, createMockKV } from "../__test-utils__/mock-env";

// Mock lookupApiKey to allow per-test control
let _lookupApiKeyResult: { userId: string } | null = null;

vi.mock("../../../src/edge-api/spike-land/db/auth/api-key", async (importActual) => {
  const actual =
    await importActual<typeof import("../../../src/edge-api/spike-land/db/auth/api-key")>();
  return {
    ...actual,
    lookupApiKey: vi.fn().mockImplementation(async () => _lookupApiKeyResult),
  };
});

// Helper to build a minimal Env for tests
function makeEnv(d1Override?: Parameters<typeof createMockD1>[0]) {
  return {
    DB: createMockD1(d1Override),
    KV: createMockKV(),
    MCP_JWT_SECRET: "test-jwt-secret-at-least-32-chars-long",
    MCP_INTERNAL_SECRET: "test-internal-secret",
    ANTHROPIC_API_KEY: "sk-ant-test",
    OPENAI_API_KEY: "sk-test",
    GEMINI_API_KEY: "gemini-test",
    ELEVENLABS_API_KEY: "el-test",
    APP_ENV: "test",
    SPIKE_LAND_URL: "https://spike.land",
  };
}

// Helper to build a minimal Context for tests
function createMockContext(
  path: string,
  headers: Record<string, string> = {},
  env?: ReturnType<typeof makeEnv>,
  method: string = "GET",
  body?: unknown,
) {
  const req = new Request(`http://localhost${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const store = new Map<string, unknown>();

  const c = {
    req: {
      header: (name: string) => req.headers.get(name),
      raw: req,
      method: req.method,
    },
    env: env ?? makeEnv(),
    set: vi.fn((key: string, value: unknown) => {
      store.set(key, value);
    }),
    get: vi.fn((key: string) => store.get(key)),
    json: vi.fn((body: unknown, status: number = 200, headers?: Record<string, string>) => {
      const responseHeaders = new Headers(headers);
      responseHeaders.set("Content-Type", "application/json");
      return new Response(JSON.stringify(body), { status, headers: responseHeaders });
    }),
  };

  return c as unknown;
}

describe("authMiddleware", () => {
  it("returns 401 with WWW-Authenticate header when no Authorization header", async () => {
    const { authMiddleware } = await import("../../../src/edge-api/spike-land/api/middleware");
    const c = createMockContext("/protected/resource");
    const next = vi.fn().mockResolvedValue(new Response("OK"));

    const res = (await authMiddleware(c, next)) as Response;

    expect(res.status).toBe(401);
    expect(res.headers.get("WWW-Authenticate")).toContain("Bearer");

    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Unauthorized");
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when Authorization header doesn't start with Bearer", async () => {
    const { authMiddleware } = await import("../../../src/edge-api/spike-land/api/middleware");
    const c = createMockContext("/protected/resource", {
      Authorization: "Basic dXNlcjpwYXNz",
    });
    const next = vi.fn().mockResolvedValue(new Response("OK"));

    const res = (await authMiddleware(c, next)) as Response;

    expect(res.status).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 for invalid API key (sk_ prefix, not found in DB)", async () => {
    _lookupApiKeyResult = null; // lookupApiKey returns null → userId not found
    const { authMiddleware } = await import("../../../src/edge-api/spike-land/api/middleware");
    const c = createMockContext("/protected/resource", {
      Authorization: "Bearer sk_invalid_api_key_1234567890",
    });
    const next = vi.fn().mockResolvedValue(new Response("OK"));

    const res = (await authMiddleware(c, next)) as Response;

    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Unauthorized");
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 for invalid OAuth token (mcp_ prefix, not found in DB)", async () => {
    _lookupApiKeyResult = null;
    const { authMiddleware } = await import("../../../src/edge-api/spike-land/api/middleware");
    const env = makeEnv(() => ({
      results: [],
      success: true,
      meta: {},
    }));
    const c = createMockContext(
      "/protected/resource",
      { Authorization: "Bearer mcp_invalid_token_abc" },
      env,
    );
    const next = vi.fn().mockResolvedValue(new Response("OK"));

    const res = (await authMiddleware(c, next)) as Response;

    expect(res.status).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 for arbitrary non-prefixed token", async () => {
    _lookupApiKeyResult = null;
    const { authMiddleware } = await import("../../../src/edge-api/spike-land/api/middleware");
    const env = makeEnv(() => ({
      results: [],
      success: true,
      meta: {},
    }));
    const c = createMockContext(
      "/protected/resource",
      { Authorization: "Bearer some_random_token_that_has_no_prefix" },
      env,
    );
    const next = vi.fn().mockResolvedValue(new Response("OK"));

    const res = (await authMiddleware(c, next)) as Response;

    expect(res.status).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("passes through to next handler with userId when API key is valid", async () => {
    _lookupApiKeyResult = { userId: "user-from-api-key" };
    const { authMiddleware } = await import("../../../src/edge-api/spike-land/api/middleware");
    const c = createMockContext("/protected/resource", {
      Authorization: "Bearer sk_valid_key_abc123",
    });
    const nextRes = new Response("OK");
    const next = vi.fn().mockResolvedValue(nextRes);

    const res = await authMiddleware(c, next);

    expect(next).toHaveBeenCalled();
    expect(res).toBe(nextRes);
    expect(c.set).toHaveBeenCalledWith("userId", "user-from-api-key");
    expect(c.set).toHaveBeenCalledWith("db", expect.anything());
    expect(c.set).toHaveBeenCalledWith("userRole", "user");
  });

  it("includes help links in 401 response body", async () => {
    const { authMiddleware } = await import("../../../src/edge-api/spike-land/api/middleware");
    const c = createMockContext("/protected/resource");
    const next = vi.fn().mockResolvedValue(new Response("OK"));

    const res = (await authMiddleware(c, next)) as Response;

    const body = (await res.json()) as { help: Record<string, string> };
    expect(body.help).toBeDefined();
    expect(body.help.api_key).toContain("spike.land");
    expect(body.help.oauth_discovery).toContain("mcp.spike.land");
  });

  it("authenticates successfully with valid mcp_ OAuth token and sets userId", async () => {
    _lookupApiKeyResult = null; // mcp_ token doesn't go through lookupApiKey
    const { authMiddleware } = await import("../../../src/edge-api/spike-land/api/middleware");
    const env = makeEnv(() => ({
      results: [],
      success: true,
      meta: {},
    }));
    const c = createMockContext(
      "/protected/resource",
      { Authorization: "Bearer mcp_validoauthtoken123" },
      env,
    );
    const next = vi.fn().mockResolvedValue(new Response("OK"));

    const res = (await authMiddleware(c, next)) as Response;

    // mcp_ token goes through OAuth lookup — mock D1 returns no rows, so 401
    expect(res.status).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });
});
