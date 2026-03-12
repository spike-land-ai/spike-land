/**
 * Tests for routes/oauth.ts
 *
 * Covers: POST /oauth/device, POST /oauth/token, POST /oauth/device/approve
 */

import { describe, expect, it } from "vitest";
import {
  oauthDeviceHandler,
  oauthTokenHandler,
  oauthDeviceApproveHandler,
} from "../../../src/edge-api/spike-land/api/oauth";
import { createMockD1, createMockKV } from "../__test-utils__/mock-env";
import type { Env } from "../../../src/edge-api/spike-land/core-logic/env";
import type { Context } from "hono";

function makeEnv(d1Handler?: Parameters<typeof createMockD1>[0]) {
  return {
    DB: createMockD1(d1Handler),
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

function createMockContext(req: Request, env: Env) {
  const headers = new Map<string, string>();
  return {
    req: {
      header: (name: string) => req.headers.get(name) || req.headers.get(name.toLowerCase()),
      json: async () => await req.clone().json(),
      parseBody: async () => {
        const formData = await req.clone().formData();
        const body: Record<string, string> = {};
        formData.forEach((value, key) => {
          body[key] = value.toString();
        });
        return body;
      },
    },
    env,
    header: (name: string, value: string) => {
      headers.set(name, value);
    },
    json: (body: unknown, status: number = 200) => {
      const resHeaders = new Headers();
      resHeaders.set("Content-Type", "application/json");
      for (const [k, v] of headers.entries()) {
        resHeaders.set(k, v);
      }
      return new Response(JSON.stringify(body), { status, headers: resHeaders });
    },
  } as unknown as Context<{ Bindings: Env }>;
}

// ─── POST /oauth/device ───────────────────────────────────────────────────────

describe("POST /oauth/device", () => {
  it("returns device_code, user_code, verification_uri, expires_in, interval", async () => {
    const req = new Request("http://localhost/oauth/device", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: "client-1", scope: "mcp" }),
    });
    const c = createMockContext(req, makeEnv());
    const res = await oauthDeviceHandler(c);

    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.device_code).toMatch(/^dc_[a-f0-9]+$/);
    expect(body.user_code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    expect(body.verification_uri).toContain("spike.land");
    expect(body.verification_uri_complete).toContain(body.user_code as string);
    expect(body.expires_in).toBe(600);
    expect(body.interval).toBe(5);
  });

  it("works with empty body (no client_id or scope)", async () => {
    const req = new Request("http://localhost/oauth/device", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    const c = createMockContext(req, makeEnv());
    const res = await oauthDeviceHandler(c);

    expect(res.status).toBe(200);
    const body = (await res.json()) as { device_code: string };
    expect(body.device_code).toMatch(/^dc_/);
  });

  it("uses SPIKE_LAND_URL env var for verification_uri", async () => {
    const env = makeEnv();
    env.SPIKE_LAND_URL = "https://custom.example.com";

    const req = new Request("http://localhost/oauth/device", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    const c = createMockContext(req, env);
    const res = await oauthDeviceHandler(c);

    const body = (await res.json()) as { verification_uri: string };
    expect(body.verification_uri).toContain("custom.example.com");
  });

  it("handles invalid JSON body gracefully", async () => {
    const req = new Request("http://localhost/oauth/device", {
      method: "POST",
      body: "not-json",
    });
    const c = createMockContext(req, makeEnv());
    const res = await oauthDeviceHandler(c);

    // Should still return 200 (defaults to empty object)
    expect(res.status).toBe(200);
  });
});

// ─── POST /oauth/token ────────────────────────────────────────────────────────

describe("POST /oauth/token", () => {
  it("returns 400 for unsupported grant type", async () => {
    const req = new Request("http://localhost/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grant_type: "authorization_code" }),
    });
    const c = createMockContext(req, makeEnv());
    const res = await oauthTokenHandler(c);

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("unsupported_grant_type");
  });

  it("returns 400 when device_code is missing", async () => {
    const req = new Request("http://localhost/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "urn:ietf:params:oauth:grant-type:device_code",
      }),
    });
    const c = createMockContext(req, makeEnv());
    const res = await oauthTokenHandler(c);

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("invalid_request");
  });

  it("returns 400 with expired_token when code not found", async () => {
    const req = new Request("http://localhost/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "urn:ietf:params:oauth:grant-type:device_code",
        device_code: "dc_nonexistent",
      }),
    });
    const env = makeEnv(() => ({ results: [], success: true, meta: {} }));
    const c = createMockContext(req, env);
    const res = await oauthTokenHandler(c);

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("expired_token");
  });

  it("returns 400 with authorization_pending for un-approved code", async () => {
    const now = Date.now();
    const d1Handler = (sql: string) => {
      if (sql.toLowerCase().includes("select")) {
        return {
          results: [
            {
              id: "dc-1",
              user_id: null,
              device_code: "dc_pending",
              user_code: "ABCD-EFGH",
              scope: "mcp",
              client_id: null,
              expires_at: now + 300_000,
              approved: 0,
              created_at: now,
            },
          ],
          success: true,
          meta: {},
        };
      }
      return { results: [], success: true, meta: {} };
    };

    const req = new Request("http://localhost/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "urn:ietf:params:oauth:grant-type:device_code",
        device_code: "dc_pending",
      }),
    });
    const c = createMockContext(req, makeEnv(d1Handler));
    const res = await oauthTokenHandler(c);

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("authorization_pending");
  });

  it("handles invalid JSON body gracefully", async () => {
    const req = new Request("http://localhost/oauth/token", {
      method: "POST",
      body: "not-json",
    });
    const c = createMockContext(req, makeEnv());
    const res = await oauthTokenHandler(c);

    // Falls through to unsupported_grant_type since grant_type is undefined
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("unsupported_grant_type");
  });
});

// ─── POST /oauth/device/approve ───────────────────────────────────────────────

describe("POST /oauth/device/approve", () => {
  it("returns 401 when X-Internal-Secret header is missing", async () => {
    const req = new Request("http://localhost/oauth/device/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_code: "ABCD-EFGH", user_id: "user-1" }),
    });
    const c = createMockContext(req, makeEnv());
    const res = await oauthDeviceApproveHandler(c);

    expect(res.status).toBe(401);
  });

  it("returns 401 when X-Internal-Secret is wrong", async () => {
    const req = new Request("http://localhost/oauth/device/approve", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret": "wrong-secret",
      },
      body: JSON.stringify({ user_code: "ABCD-EFGH", user_id: "user-1" }),
    });
    const c = createMockContext(req, makeEnv());
    const res = await oauthDeviceApproveHandler(c);

    expect(res.status).toBe(401);
  });

  it("returns 400 when user_code is missing", async () => {
    const req = new Request("http://localhost/oauth/device/approve", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret": "test-internal-secret",
      },
      body: JSON.stringify({ user_id: "user-1" }),
    });
    const c = createMockContext(req, makeEnv());
    const res = await oauthDeviceApproveHandler(c);

    expect(res.status).toBe(400);
  });

  it("returns 400 when user_id is missing", async () => {
    const req = new Request("http://localhost/oauth/device/approve", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret": "test-internal-secret",
      },
      body: JSON.stringify({ user_code: "ABCD-EFGH" }),
    });
    const c = createMockContext(req, makeEnv());
    const res = await oauthDeviceApproveHandler(c);

    expect(res.status).toBe(400);
  });

  it("returns 400 when user_code not found in DB", async () => {
    const req = new Request("http://localhost/oauth/device/approve", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret": "test-internal-secret",
      },
      body: JSON.stringify({ user_code: "FAKE-CODE", user_id: "user-1" }),
    });
    const env = makeEnv(() => ({ results: [], success: true, meta: {} }));
    const c = createMockContext(req, env);
    const res = await oauthDeviceApproveHandler(c);

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBeTruthy();
  });
});
