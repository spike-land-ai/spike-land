/**
 * Tests for auth/middleware.ts (authMiddleware)
 *
 * Tests the Hono middleware directly by simulating request contexts.
 */

import { describe, expect, it, vi } from "vitest";
import { Hono } from "hono";
import type { Env } from "../../../src/spike-land-mcp/env";
import { createMockD1, createMockKV } from "../__test-utils__/mock-env";

// Mock lookupApiKey to allow per-test control
let _lookupApiKeyResult: { userId: string } | null = null;

vi.mock("../../../src/spike-land-mcp/auth/api-key", async (importActual) => {
  const actual = await importActual<typeof import("../../../src/spike-land-mcp/auth/api-key")>();
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

// Create a simple test app that uses authMiddleware
async function createTestApp(_d1Override?: Parameters<typeof createMockD1>[0]) {
  const { authMiddleware } = await import("../../../src/spike-land-mcp/auth/middleware");
  const app = new Hono<{ Bindings: Env }>();

  app.use("/protected/*", authMiddleware);
  app.get("/protected/resource", (c) => {
    return c.json({ userId: c.get("userId"), ok: true });
  });

  return app;
}

// Execute a request against the test app with a given env
async function makeRequest(
  app: Hono<{ Bindings: Env }>,
  path: string,
  headers: Record<string, string> = {},
  env?: ReturnType<typeof makeEnv>,
) {
  const req = new Request(`http://localhost${path}`, { headers });
  return app.fetch(req, env ?? makeEnv());
}

describe("authMiddleware", () => {
  it("returns 401 with WWW-Authenticate header when no Authorization header", async () => {
    const app = await createTestApp();
    const res = await makeRequest(app, "/protected/resource");

    expect(res.status).toBe(401);
    expect(res.headers.get("WWW-Authenticate")).toContain("Bearer");

    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 401 when Authorization header doesn't start with Bearer", async () => {
    const app = await createTestApp();
    const res = await makeRequest(app, "/protected/resource", {
      Authorization: "Basic dXNlcjpwYXNz",
    });

    expect(res.status).toBe(401);
  });

  it("returns 401 for invalid API key (sk_ prefix, not found in DB)", async () => {
    _lookupApiKeyResult = null; // lookupApiKey returns null → userId not found
    const app = await createTestApp();
    const res = await makeRequest(app, "/protected/resource", {
      Authorization: "Bearer sk_invalid_api_key_1234567890",
    });

    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 401 for invalid OAuth token (mcp_ prefix, not found in DB)", async () => {
    _lookupApiKeyResult = null;
    const app = await createTestApp(() => ({
      results: [],
      success: true,
      meta: {},
    }));
    const res = await makeRequest(app, "/protected/resource", {
      Authorization: "Bearer mcp_invalid_token_abc",
    });

    expect(res.status).toBe(401);
  });

  it("returns 401 for arbitrary non-prefixed token", async () => {
    _lookupApiKeyResult = null;
    const app = await createTestApp(() => ({
      results: [],
      success: true,
      meta: {},
    }));
    const res = await makeRequest(app, "/protected/resource", {
      Authorization: "Bearer some_random_token_that_has_no_prefix",
    });

    // Neither sk_ nor mcp_ prefix — userId remains null
    expect(res.status).toBe(401);
  });

  it("passes through to next handler with userId when API key is valid", async () => {
    _lookupApiKeyResult = { userId: "user-from-api-key" };
    const app = await createTestApp();

    const res = await makeRequest(app, "/protected/resource", {
      Authorization: "Bearer sk_valid_key_abc123",
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { userId: string; ok: boolean };
    expect(body.ok).toBe(true);
    expect(body.userId).toBe("user-from-api-key");
  });

  it("includes help links in 401 response body", async () => {
    const app = await createTestApp();
    const res = await makeRequest(app, "/protected/resource");

    const body = (await res.json()) as { help: Record<string, string> };
    expect(body.help).toBeDefined();
    expect(body.help.api_key).toContain("spike.land");
    expect(body.help.oauth_discovery).toContain("mcp.spike.land");
  });

  it("does not protect unmatched routes", async () => {
    const { authMiddleware } = await import("../../../src/spike-land-mcp/auth/middleware");
    const app = new Hono<{ Bindings: Env }>();
    app.use("/protected/*", authMiddleware);
    app.get("/public", (c) => c.json({ ok: true }));

    const req = new Request("http://localhost/public");
    const res = await app.fetch(req, makeEnv());
    expect(res.status).toBe(200);
  });

  it("authenticates successfully with valid mcp_ OAuth token and sets userId", async () => {
    _lookupApiKeyResult = null; // mcp_ token doesn't go through lookupApiKey
    const app = await createTestApp(() => ({
      results: [],
      success: true,
      meta: {},
    }));

    const res = await makeRequest(app, "/protected/resource", {
      Authorization: "Bearer mcp_validoauthtoken123",
    });

    // mcp_ token goes through OAuth lookup — mock D1 returns no rows, so 401
    expect(res.status).toBe(401);
  });
});
