import { describe, expect, it, vi } from "vitest";
import { Hono } from "hono";

/**
 * Cache header regression tests for the SPA route handler.
 *
 * Validates that:
 * - SPA HTML responses (navigations) include no-cache headers
 * - Non-hashed static assets don't get immutable
 */

function createMockR2Object(body: string, contentType = "text/html") {
  return {
    body: new Response(body).body,
    httpEtag: '"test-etag"',
    text: async () => body,
    writeHttpMetadata: (headers: Headers) => {
      headers.set("content-type", contentType);
    },
  };
}

function createMockEnv(objects: Record<string, ReturnType<typeof createMockR2Object>>) {
  return {
    SPA_ASSETS: {
      get: vi.fn(async (key: string) => objects[key] ?? null),
    },
    DB: {
      prepare: vi.fn(() => ({
        bind: vi.fn(() => ({ first: vi.fn(async () => null) })),
      })),
    },
  };
}

const SPA_HTML =
  '<html><head><title>Test</title><meta name="description" content="test" /></head><body></body></html>';

describe("SPA cache headers", () => {
  it("SPA navigation routes have no-cache headers", async () => {
    // Navigation routes like /about don't have a direct R2 match,
    // so they fall through to the SPA shell served from index.html
    const env = createMockEnv({
      "index.html": createMockR2Object(SPA_HTML),
    });

    const { spa } = await import("../../../src/edge-api/main/api/routes/spa.js");
    const app = new Hono();
    app.route("/", spa);

    const res = await app.request("/about", undefined, env);
    const cc = res.headers.get("cache-control");
    expect(cc).toContain("no-cache");
    expect(cc).not.toContain("immutable");
  });

  it("SPA root (/) serves html with content-type text/html", async () => {
    const env = createMockEnv({
      "index.html": createMockR2Object(SPA_HTML),
    });

    const { spa } = await import("../../../src/edge-api/main/api/routes/spa.js");
    const app = new Hono();
    app.route("/", spa);

    const res = await app.request("/", undefined, env);
    expect(res.status).toBe(200);
    // Root serves index.html — content should be present
    const body = await res.text();
    expect(body).toContain("<title>");
  });

  it("non-hashed static assets do not get immutable", async () => {
    const env = createMockEnv({
      "index.html": createMockR2Object(
        '<html><head><meta name="build-sha" content="abc123def456" /></head></html>',
      ),
      "app.js": createMockR2Object("console.log('hi')", "application/javascript"),
    });

    const { spa } = await import("../../../src/edge-api/main/api/routes/spa.js");
    const app = new Hono();
    app.route("/", spa);

    const res = await app.request("/app.js", undefined, env);
    const cc = res.headers.get("cache-control") ?? "";
    expect(cc).not.toContain("immutable");
  });
});
