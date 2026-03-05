/**
 * Tests for routes/internal-byok.ts
 */
import { describe, expect, it } from "vitest";
import { Hono } from "hono";
import type { Env } from "../../../src/spike-land-mcp/env";
import { internalByokRoute } from "../../../src/spike-land-mcp/routes/internal-byok";

function buildApp(dbResult: Record<string, unknown>[] = [], vaultSecret = "test-vault-secret") {
  const app = new Hono<{ Bindings: Env }>();
  app.route("/internal", internalByokRoute);

  const mockDB = {
    prepare: (sql: string) => {
      let boundValues: unknown[] = [];
      const stmt = {
        bind: (...values: unknown[]) => {
          boundValues = values;
          return stmt;
        },
        all: async () => ({ results: dbResult, success: true, meta: {} }),
        run: async () => ({ results: dbResult, success: true, meta: {} }),
        first: async () => dbResult[0] ?? null,
        raw: async () => dbResult,
      };
      return stmt;
    },
    batch: async () => [],
    dump: async () => new ArrayBuffer(0),
    exec: async () => ({ count: 0, duration: 0 }),
  } as unknown as D1Database;

  const env = {
    DB: mockDB,
    VAULT_SECRET: vaultSecret,
  } as unknown as Env;

  return { app, env };
}

describe("internalByokRoute POST /byok/get", () => {
  it("returns 400 when userId is missing", async () => {
    const { app, env } = buildApp();

    const res = await app.request(
      "/internal/byok/get",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "openai" }),
      },
      env,
    );

    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toContain("userId");
  });

  it("returns 400 when provider is missing", async () => {
    const { app, env } = buildApp();

    const res = await app.request(
      "/internal/byok/get",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "user-1" }),
      },
      env,
    );

    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toContain("provider");
  });

  it("returns null key when no vault record found", async () => {
    const { app, env } = buildApp([]); // empty results

    const res = await app.request(
      "/internal/byok/get",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "user-1", provider: "openai" }),
      },
      env,
    );

    expect(res.status).toBe(200);
    const body = await res.json() as { key: null };
    expect(body.key).toBeNull();
  });

  it("returns null key when decryption fails for invalid ciphertext", async () => {
    // Provide a record with invalid base64 ciphertext
    const invalidEncryptedKey = btoa(JSON.stringify({
      v: 2,
      iv: btoa("short"),
      data: btoa("not-real-encrypted-data"),
      salt: btoa("salt-value"),
    }));

    const { app, env } = buildApp([{ encryptedKey: invalidEncryptedKey }]);

    const res = await app.request(
      "/internal/byok/get",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "user-1", provider: "openai" }),
      },
      env,
    );

    expect(res.status).toBe(200);
    const body = await res.json() as { key: null };
    // Decryption will fail for invalid ciphertext → returns null
    expect(body.key).toBeNull();
  });

  it("returns 400 when body is not valid JSON", async () => {
    const { app, env } = buildApp();

    const res = await app.request(
      "/internal/byok/get",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not-json",
      },
      env,
    );

    // Hono JSON parse error returns 400
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});
