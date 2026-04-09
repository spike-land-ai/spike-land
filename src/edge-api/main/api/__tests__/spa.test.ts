import { afterEach, describe, expect, it, vi } from "vitest";
import { Hono } from "hono";
import { spa } from "../routes/spa.js";
import type { Env } from "../../core-logic/env.js";

const INDEX_HTML = `<!DOCTYPE html><html><head><title>spike.land</title><meta name="description" content="home" /></head><body><div id="root"></div></body></html>`;

function makeHtmlObject(body: string): R2ObjectBody {
  return {
    body: new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(body));
        controller.close();
      },
    }),
    bodyUsed: false,
    arrayBuffer: () => Promise.resolve(new TextEncoder().encode(body).buffer),
    text: () => Promise.resolve(body),
    json: () => Promise.resolve(JSON.parse(body)),
    blob: () => Promise.resolve(new Blob([body])),
    key: "index.html",
    version: "1",
    size: body.length,
    etag: "abc",
    httpEtag: '"abc"',
    checksums: { toJSON: () => ({}) } as unknown as R2Checksums,
    uploaded: new Date(),
    httpMetadata: { contentType: "text/html; charset=utf-8" },
    customMetadata: {},
    storageClass: "Standard",
    writeHttpMetadata: (headers: Headers) => {
      headers.set("content-type", "text/html; charset=utf-8");
    },
    range: undefined as unknown as R2Range,
  } as unknown as R2ObjectBody;
}

function mockR2() {
  return {
    get: vi.fn(async (key: string) => (key === "index.html" ? makeHtmlObject(INDEX_HTML) : null)),
  } as unknown as R2Bucket;
}

function mockDb() {
  return {
    prepare: vi.fn().mockReturnValue({
      bind: vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue(null),
      }),
    }),
  } as unknown as D1Database;
}

function createApp() {
  const app = new Hono<{ Bindings: Env }>();
  app.route("/", spa);
  return app;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("spa missing content routes", () => {
  it("returns a 404 shell for missing blog slugs with a trailing slash", async () => {
    const app = createApp();

    const res = await app.request("/blog/definitely-missing-post/", undefined, {
      DB: mockDb(),
      SPA_ASSETS: mockR2(),
    } as unknown as Env);

    expect(res.status).toBe(404);
    expect(res.headers.get("x-robots-tag")).toBe("noindex, nofollow");
  });

  it("returns a 404 shell for missing learn detail routes", async () => {
    const app = createApp();

    const res = await app.request("/learn/definitely-missing-post/", undefined, {
      DB: mockDb(),
      SPA_ASSETS: mockR2(),
    } as unknown as Env);

    expect(res.status).toBe(404);
    expect(res.headers.get("x-robots-tag")).toBe("noindex, nofollow");
  });
});
