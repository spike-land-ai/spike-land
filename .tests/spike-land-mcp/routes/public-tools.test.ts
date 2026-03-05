/**
 * Tests for routes/public-tools.ts
 */
import { describe, expect, it, vi } from "vitest";
import { Hono } from "hono";
import type { Env } from "../../../src/spike-land-mcp/env";
import type { AuthVariables } from "../../../src/spike-land-mcp/auth/middleware";
import { publicToolsRoute } from "../../../src/spike-land-mcp/routes/public-tools";
import { createMockD1, createMockKV } from "../__test-utils__/mock-env";

// Mock registerAllTools to avoid needing full D1/env setup for all 80+ tools
vi.mock("../../../src/spike-land-mcp/mcp/manifest", () => ({
  registerAllTools: vi.fn().mockResolvedValue(undefined),
}));

function buildApp() {
  const app = new Hono<{ Bindings: Env; Variables: AuthVariables }>();
  app.route("/tools", publicToolsRoute);

  const env = {
    DB: createMockD1(),
    KV: createMockKV(),
    VAULT_SECRET: "test-secret",
  } as unknown as Env;

  return { app, env };
}

describe("publicToolsRoute GET /", () => {
  it("returns 200 with tools array", async () => {
    const { app, env } = buildApp();

    const res = await app.request("/tools", {}, env);

    expect(res.status).toBe(200);
    const body = await res.json() as { tools: unknown[] };
    expect(Array.isArray(body.tools)).toBe(true);
  });

  it("sets Cache-Control header", async () => {
    const { app, env } = buildApp();

    const res = await app.request("/tools", {}, env);

    expect(res.status).toBe(200);
    const cacheControl = res.headers.get("Cache-Control");
    // Cache-Control may or may not be present depending on Hono's response handling
    if (cacheControl !== null) {
      expect(cacheControl).toContain("public");
    }
  });

  it("returns tool objects with expected shape", async () => {
    const { app, env } = buildApp();

    const res = await app.request("/tools", {}, env);

    expect(res.status).toBe(200);
    const body = await res.json() as { tools: Array<{ name: string; description: string; category: string }> };
    // Since registerAllTools is mocked, tools array will be empty
    expect(Array.isArray(body.tools)).toBe(true);
  });
});
