import { describe, expect, it, vi } from "vitest";
import type { Context } from "hono";
import { authMiddleware } from "../../../src/edge-api/spike-land/api/middleware.js";

function makeD1(): D1Database {
  return {
    prepare: vi.fn(() => {
      throw new Error("DB unavailable in test");
    }),
  } as unknown as D1Database;
}

describe("spike-land MCP auth middleware", () => {
  it("trusts internal auth headers from spike-edge", async () => {
    const c = {
      req: {
        header: (name: string) => {
          if (name === "X-Internal-Secret") return "mcp-secret";
          if (name === "X-User-Id") return "user-123";
          return null;
        },
      },
      env: {
        MCP_INTERNAL_SECRET: "mcp-secret",
        DB: makeD1(),
      },
      set: vi.fn(),
    } as unknown as Context;

    const next = vi.fn();

    await authMiddleware(c, next);

    expect(c.set).toHaveBeenCalledWith("userId", "user-123");
    expect(c.set).toHaveBeenCalledWith("userRole", "user");
    expect(next).toHaveBeenCalled();
  });

  it("allows billing_list_plans anonymously", async () => {
    const request = new Request("https://mcp.spike.land/mcp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "tools/call",
        params: { name: "billing_list_plans", arguments: {} },
        id: "1",
      }),
    });

    const c = {
      req: {
        method: "POST",
        raw: request,
        header: () => null,
      },
      env: {
        MCP_INTERNAL_SECRET: "mcp-secret",
        DB: makeD1(),
      },
      set: vi.fn(),
      json: vi.fn(),
    } as unknown as Context;

    const next = vi.fn();

    await authMiddleware(c, next);

    expect(c.set).toHaveBeenCalledWith("userId", "anonymous");
    expect(c.set).toHaveBeenCalledWith("userRole", "user");
    expect(next).toHaveBeenCalled();
  });
});
