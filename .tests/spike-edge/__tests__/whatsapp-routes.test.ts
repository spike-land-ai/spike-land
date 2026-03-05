import { describe, expect, it, vi } from "vitest";
import { Hono } from "hono";
import type { Env } from "../../../src/spike-edge/env.js";
import { whatsapp } from "../../../src/spike-edge/routes/whatsapp.js";

function createMockEnv(overrides: Partial<Env> = {}): Env {
  return {
    R2: {} as R2Bucket,
    SPA_ASSETS: {} as R2Bucket,
    DB: {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
        all: vi.fn().mockResolvedValue({ results: [] }),
        run: vi.fn().mockResolvedValue({}),
      }),
      batch: vi.fn().mockResolvedValue([]),
    } as unknown as D1Database,
    AUTH_MCP: {
      fetch: vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ session: { id: "sess1" }, user: { id: "user1" } }), { status: 200 }),
      ),
    } as unknown as Fetcher,
    MCP_SERVICE: { fetch: vi.fn() } as unknown as Fetcher,
    LIMITERS: {
      idFromName: vi.fn().mockReturnValue("limiter-id"),
      get: vi.fn().mockReturnValue({
        fetch: vi.fn().mockResolvedValue(new Response("0")),
      }),
    } as unknown as DurableObjectNamespace,
    STRIPE_SECRET_KEY: "sk_test",
    STRIPE_WEBHOOK_SECRET: "whsec",
    GEMINI_API_KEY: "key",
    CLAUDE_OAUTH_TOKEN: "token",
    GITHUB_TOKEN: "ghp",
    ALLOWED_ORIGINS: "https://spike.land",
    QUIZ_BADGE_SECRET: "secret",
    GA_MEASUREMENT_ID: "G-TEST",
    CACHE_VERSION: "v1",
    GA_API_SECRET: "ga",
    INTERNAL_SERVICE_SECRET: "internal-secret-123",
    WHATSAPP_APP_SECRET: "wa-secret",
    WHATSAPP_ACCESS_TOKEN: "wa-token",
    WHATSAPP_PHONE_NUMBER_ID: "wa-phone",
    WHATSAPP_VERIFY_TOKEN: "verify-token",
    MCP_INTERNAL_SECRET: "mcp-secret",
    ...overrides,
  };
}

function makeApp() {
  const app = new Hono<{ Bindings: Env }>();
  // Simulate authMiddleware for /whatsapp/link/* routes
  app.use("/whatsapp/link/*", async (c, next) => {
    c.set("userId" as never, "user1" as never);
    await next();
  });
  app.route("/", whatsapp);
  return app;
}

// ─── GET /whatsapp/webhook (verification) ────────────────────────────────────

describe("GET /whatsapp/webhook", () => {
  it("returns 200 with challenge when mode=subscribe and token matches", async () => {
    const env = createMockEnv();
    const app = makeApp();
    const res = await app.request(
      "/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=verify-token&hub.challenge=challenge123",
      {},
      env,
    );
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toBe("challenge123");
  });

  it("returns 403 when token is wrong", async () => {
    const env = createMockEnv();
    const app = makeApp();
    const res = await app.request(
      "/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=wrong-token&hub.challenge=challenge",
      {},
      env,
    );
    expect(res.status).toBe(403);
  });

  it("returns 403 when mode is not subscribe", async () => {
    const env = createMockEnv();
    const app = makeApp();
    const res = await app.request(
      "/whatsapp/webhook?hub.mode=other&hub.verify_token=verify-token",
      {},
      env,
    );
    expect(res.status).toBe(403);
  });
});

// ─── POST /whatsapp/webhook ───────────────────────────────────────────────────

describe("POST /whatsapp/webhook", () => {
  async function makeHmacSignature(body: string, secret: string): Promise<string> {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
    return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  it("returns 401 when signature header is missing", async () => {
    const env = createMockEnv();
    const app = makeApp();
    const res = await app.request("/whatsapp/webhook", {
      method: "POST",
      body: "{}",
      headers: { "Content-Type": "application/json" },
    }, env);
    expect(res.status).toBe(401);
    const body = await res.json<{ error: string }>();
    expect(body.error).toBe("Missing signature");
  });

  it("returns 401 when HMAC signature is invalid", async () => {
    const env = createMockEnv();
    const app = makeApp();
    const res = await app.request("/whatsapp/webhook", {
      method: "POST",
      body: "{}",
      headers: {
        "Content-Type": "application/json",
        "X-Hub-Signature-256": "sha256=invalidsig",
      },
    }, env);
    expect(res.status).toBe(401);
    const body = await res.json<{ error: string }>();
    expect(body.error).toBe("Invalid signature");
  });

  it("handles status webhook (no messages) and returns ok", async () => {
    const bodyStr = JSON.stringify({
      entry: [{ changes: [{ value: { statuses: [{ id: "status1" }] } }] }],
    });
    const sig = await makeHmacSignature(bodyStr, "wa-secret");
    const env = createMockEnv();
    const app = makeApp();
    const res = await app.request("/whatsapp/webhook", {
      method: "POST",
      body: bodyStr,
      headers: { "X-Hub-Signature-256": `sha256=${sig}` },
    }, env);
    expect(res.status).toBe(200);
    const body = await res.json<{ ok: boolean }>();
    expect(body.ok).toBe(true);
  });

  it("handles non-text message type and returns ok", async () => {
    const bodyStr = JSON.stringify({
      entry: [{
        changes: [{
          value: {
            messages: [{ from: "1234567890", type: "image", id: "msg-1" }],
          },
        }],
      }],
    });
    const sig = await makeHmacSignature(bodyStr, "wa-secret");
    const env = createMockEnv();
    const app = makeApp();
    const res = await app.request("/whatsapp/webhook", {
      method: "POST",
      body: bodyStr,
      headers: { "X-Hub-Signature-256": `sha256=${sig}` },
    }, env);
    expect(res.status).toBe(200);
  });

  it("sends link invitation when phone is not linked", async () => {
    const bodyStr = JSON.stringify({
      entry: [{
        changes: [{
          value: {
            messages: [{ from: "1234567890", type: "text", text: { body: "/help" }, id: "msg-1" }],
          },
        }],
      }],
    });
    const sig = await makeHmacSignature(bodyStr, "wa-secret");
    // DB returns null for whatsapp_links lookup → unlinked
    const env = createMockEnv();
    const app = makeApp();
    const res = await app.request("/whatsapp/webhook", {
      method: "POST",
      body: bodyStr,
      headers: { "X-Hub-Signature-256": `sha256=${sig}` },
    }, env);
    expect(res.status).toBe(200);
    const body = await res.json<{ ok: boolean; action: string }>();
    expect(body.action).toBe("link_invitation_sent");
  });

  it("returns 400 for invalid JSON", async () => {
    const bodyStr = "not-json";
    const sig = await makeHmacSignature(bodyStr, "wa-secret");
    const env = createMockEnv();
    const app = makeApp();
    const res = await app.request("/whatsapp/webhook", {
      method: "POST",
      body: bodyStr,
      headers: { "X-Hub-Signature-256": `sha256=${sig}` },
    }, env);
    expect(res.status).toBe(400);
    const body = await res.json<{ error: string }>();
    expect(body.error).toBe("Invalid JSON");
  });

  it("processes command when phone is linked and rate limit ok", async () => {
    const bodyStr = JSON.stringify({
      entry: [{
        changes: [{
          value: {
            messages: [{ from: "1234567890", type: "text", text: { body: "/help" }, id: "msg-1" }],
          },
        }],
      }],
    });
    const sig = await makeHmacSignature(bodyStr, "wa-secret");

    const db = {
      prepare: vi.fn().mockImplementation((sql: string) => ({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockImplementation(() => {
          if (sql.includes("whatsapp_links") && sql.includes("phone_hash")) {
            return Promise.resolve({ user_id: "user1" });
          }
          if (sql.includes("access_grants")) return Promise.resolve(null);
          if (sql.includes("subscriptions")) return Promise.resolve(null);
          if (sql.includes("whatsapp_message_log")) return Promise.resolve({ cnt: 0 });
          return Promise.resolve(null);
        }),
        all: vi.fn().mockResolvedValue({ results: [] }),
        run: vi.fn().mockResolvedValue({}),
      })),
      batch: vi.fn().mockResolvedValue([]),
    } as unknown as D1Database;

    const env = createMockEnv({ DB: db });
    const app = makeApp();
    const res = await app.request("/whatsapp/webhook", {
      method: "POST",
      body: bodyStr,
      headers: { "X-Hub-Signature-256": `sha256=${sig}` },
    }, env);
    expect(res.status).toBe(200);
    const body = await res.json<{ ok: boolean; action: string; command: string }>();
    expect(body.ok).toBe(true);
    expect(body.action).toBe("processed");
    expect(body.command).toBe("help");
  });

  it("returns rate_limited when daily limit exceeded", async () => {
    const bodyStr = JSON.stringify({
      entry: [{
        changes: [{
          value: {
            messages: [{ from: "1234567890", type: "text", text: { body: "hello" }, id: "msg-1" }],
          },
        }],
      }],
    });
    const sig = await makeHmacSignature(bodyStr, "wa-secret");

    const db = {
      prepare: vi.fn().mockImplementation((sql: string) => ({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockImplementation(() => {
          if (sql.includes("whatsapp_links") && sql.includes("phone_hash")) {
            return Promise.resolve({ user_id: "user1" });
          }
          if (sql.includes("access_grants")) return Promise.resolve(null);
          if (sql.includes("subscriptions")) return Promise.resolve(null);
          // Return count >= free limit (50)
          if (sql.includes("COUNT")) return Promise.resolve({ cnt: 100 });
          return Promise.resolve(null);
        }),
        all: vi.fn().mockResolvedValue({ results: [] }),
        run: vi.fn().mockResolvedValue({}),
      })),
      batch: vi.fn().mockResolvedValue([]),
    } as unknown as D1Database;

    const env = createMockEnv({ DB: db });
    const app = makeApp();
    const res = await app.request("/whatsapp/webhook", {
      method: "POST",
      body: bodyStr,
      headers: { "X-Hub-Signature-256": `sha256=${sig}` },
    }, env);
    expect(res.status).toBe(200);
    const body = await res.json<{ action: string }>();
    expect(body.action).toBe("rate_limited");
  });
});

// ─── POST /whatsapp/link/initiate ─────────────────────────────────────────────

describe("POST /whatsapp/link/initiate", () => {
  it("creates new link when no existing", async () => {
    const runMock = vi.fn().mockResolvedValue({});
    const db = {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null), // no existing link
        run: runMock,
        all: vi.fn().mockResolvedValue({ results: [] }),
      }),
      batch: vi.fn().mockResolvedValue([]),
    } as unknown as D1Database;
    const env = createMockEnv({ DB: db });
    const app = makeApp();
    const res = await app.request("/whatsapp/link/initiate", { method: "POST" }, env);
    expect(res.status).toBe(200);
    const body = await res.json<{ code: string }>();
    expect(body.code).toHaveLength(6);
    expect(runMock).toHaveBeenCalled();
  });

  it("updates existing unverified link", async () => {
    const runMock = vi.fn().mockResolvedValue({});
    const db = {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ id: "link-existing" }),
        run: runMock,
        all: vi.fn().mockResolvedValue({ results: [] }),
      }),
      batch: vi.fn().mockResolvedValue([]),
    } as unknown as D1Database;
    const env = createMockEnv({ DB: db });
    const app = makeApp();
    const res = await app.request("/whatsapp/link/initiate", { method: "POST" }, env);
    expect(res.status).toBe(200);
    const body = await res.json<{ code: string }>();
    expect(body.code).toBeTruthy();
    expect(runMock).toHaveBeenCalled();
  });
});

// ─── POST /whatsapp/link/verify ──────────────────────────────────────────────

describe("POST /whatsapp/link/verify", () => {
  it("returns 400 when code missing", async () => {
    const env = createMockEnv();
    const app = makeApp();
    const res = await app.request("/whatsapp/link/verify", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
    }, env);
    expect(res.status).toBe(400);
  });

  it("returns 404 when no pending link found", async () => {
    const env = createMockEnv();
    const app = makeApp();
    const res = await app.request("/whatsapp/link/verify", {
      method: "POST",
      body: JSON.stringify({ code: "123456" }),
      headers: { "Content-Type": "application/json" },
    }, env);
    expect(res.status).toBe(404);
  });

  it("returns 410 when code is expired", async () => {
    const db = {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({
          id: "link-1",
          link_code: "123456",
          link_code_expires_at: Date.now() - 1000, // expired
        }),
        run: vi.fn().mockResolvedValue({}),
        all: vi.fn().mockResolvedValue({ results: [] }),
      }),
      batch: vi.fn().mockResolvedValue([]),
    } as unknown as D1Database;
    const env = createMockEnv({ DB: db });
    const app = makeApp();
    const res = await app.request("/whatsapp/link/verify", {
      method: "POST",
      body: JSON.stringify({ code: "123456" }),
      headers: { "Content-Type": "application/json" },
    }, env);
    expect(res.status).toBe(410);
  });

  it("returns 400 when code is wrong", async () => {
    const db = {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({
          id: "link-1",
          link_code: "654321",
          link_code_expires_at: Date.now() + 600000,
        }),
        run: vi.fn().mockResolvedValue({}),
        all: vi.fn().mockResolvedValue({ results: [] }),
      }),
      batch: vi.fn().mockResolvedValue([]),
    } as unknown as D1Database;
    const env = createMockEnv({ DB: db });
    const app = makeApp();
    const res = await app.request("/whatsapp/link/verify", {
      method: "POST",
      body: JSON.stringify({ code: "999999" }),
      headers: { "Content-Type": "application/json" },
    }, env);
    expect(res.status).toBe(400);
    const body = await res.json<{ error: string }>();
    expect(body.error).toBe("Invalid code");
  });

  it("verifies link successfully when code matches", async () => {
    const runMock = vi.fn().mockResolvedValue({});
    const db = {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({
          id: "link-1",
          link_code: "123456",
          link_code_expires_at: Date.now() + 600000,
        }),
        run: runMock,
        all: vi.fn().mockResolvedValue({ results: [] }),
      }),
      batch: vi.fn().mockResolvedValue([]),
    } as unknown as D1Database;
    const env = createMockEnv({ DB: db });
    const app = makeApp();
    const res = await app.request("/whatsapp/link/verify", {
      method: "POST",
      body: JSON.stringify({ code: "123456" }),
      headers: { "Content-Type": "application/json" },
    }, env);
    expect(res.status).toBe(200);
    const body = await res.json<{ linked: boolean }>();
    expect(body.linked).toBe(true);
    expect(runMock).toHaveBeenCalled();
  });
});

// ─── DELETE /whatsapp/link ───────────────────────────────────────────────────

describe("DELETE /whatsapp/link", () => {
  it("unlinks successfully", async () => {
    const runMock = vi.fn().mockResolvedValue({});
    const db = {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        run: runMock,
        first: vi.fn().mockResolvedValue(null),
        all: vi.fn().mockResolvedValue({ results: [] }),
      }),
      batch: vi.fn().mockResolvedValue([]),
    } as unknown as D1Database;
    const env = createMockEnv({ DB: db });
    const app = makeApp();
    const res = await app.request("/whatsapp/link", { method: "DELETE" }, env);
    expect(res.status).toBe(200);
    const body = await res.json<{ unlinked: boolean }>();
    expect(body.unlinked).toBe(true);
    expect(runMock).toHaveBeenCalled();
  });
});

// ─── GET /whatsapp/link/status ───────────────────────────────────────────────

describe("GET /whatsapp/link/status", () => {
  it("returns linked: false when no link found", async () => {
    const env = createMockEnv();
    const app = makeApp();
    const res = await app.request("/whatsapp/link/status", {}, env);
    expect(res.status).toBe(200);
    const body = await res.json<{ linked: boolean }>();
    expect(body.linked).toBe(false);
  });

  it("returns linked: true when verified_at is set", async () => {
    const db = {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({
          phone_hash: "abc123",
          verified_at: Date.now(),
          created_at: Date.now() - 1000,
        }),
        run: vi.fn().mockResolvedValue({}),
        all: vi.fn().mockResolvedValue({ results: [] }),
      }),
      batch: vi.fn().mockResolvedValue([]),
    } as unknown as D1Database;
    const env = createMockEnv({ DB: db });
    const app = makeApp();
    const res = await app.request("/whatsapp/link/status", {}, env);
    expect(res.status).toBe(200);
    const body = await res.json<{ linked: boolean; hasPhone: boolean }>();
    expect(body.linked).toBe(true);
    expect(body.hasPhone).toBe(true);
  });

  it("returns linked: false when verified_at is null", async () => {
    const db = {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({
          phone_hash: null,
          verified_at: null,
          created_at: Date.now(),
        }),
        run: vi.fn().mockResolvedValue({}),
        all: vi.fn().mockResolvedValue({ results: [] }),
      }),
      batch: vi.fn().mockResolvedValue([]),
    } as unknown as D1Database;
    const env = createMockEnv({ DB: db });
    const app = makeApp();
    const res = await app.request("/whatsapp/link/status", {}, env);
    const body = await res.json<{ linked: boolean }>();
    expect(body.linked).toBe(false);
  });
});
