/// <reference types="@cloudflare/workers-types" />
import { describe, expect, it, vi } from "vitest";
import { Hono } from "hono";
import { spa } from "../routes/spa.js";
import type { Env } from "../../core-logic/env.js";

function makeR2Object(body: string, contentType: string): R2ObjectBody {
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
    blob: () => Promise.resolve(new Blob([body], { type: contentType })),
    key: "asset",
    version: "1",
    size: body.length,
    etag: "abc",
    httpEtag: '"abc"',
    checksums: { toJSON: () => ({}) } as unknown as R2Checksums,
    uploaded: new Date(),
    httpMetadata: { contentType },
    customMetadata: {},
    storageClass: "Standard",
    writeHttpMetadata: (headers) => {
      headers.set("content-type", contentType);
    },
    range: undefined as unknown as R2Range,
  } as unknown as R2ObjectBody;
}

function mockR2(objects: Record<string, R2ObjectBody | null>) {
  return {
    get: vi.fn(async (key: string) => objects[key] ?? null),
  } as unknown as R2Bucket;
}

function createApp(spaAssets: R2Bucket) {
  const app = new Hono<{ Bindings: Env }>();
  app.use("*", async (c, next) => {
    Object.assign(c.env, { SPA_ASSETS: spaAssets });
    await next();
  });
  app.route("/", spa);
  return app;
}

describe("SPA cache headers", () => {
  it("serves HTML routes with no-cache headers", async () => {
    const spaAssets = mockR2({
      "index.html": makeR2Object("<html><body>home</body></html>", "text/html; charset=utf-8"),
    });
    const app = createApp(spaAssets);

    const res = await app.request("/", undefined, {
      SPA_ASSETS: spaAssets,
    } as unknown as Env);

    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toContain("no-cache");
    expect(res.headers.get("cache-control")).toContain("must-revalidate");
  });

  it("serves hashed assets as immutable", async () => {
    const spaAssets = mockR2({
      "assets/index.12345678.js": makeR2Object("console.log('hashed');", "application/javascript"),
      "index.html": makeR2Object("<html></html>", "text/html; charset=utf-8"),
    });
    const app = createApp(spaAssets);

    const res = await app.request("/assets/index.12345678.js", undefined, {
      SPA_ASSETS: spaAssets,
    } as unknown as Env);

    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("public, max-age=31536000, immutable");
  });

  it("serves unhashed assets with a short TTL", async () => {
    const spaAssets = mockR2({
      "assets/index.js": makeR2Object("console.log('plain');", "application/javascript"),
      "index.html": makeR2Object("<html></html>", "text/html; charset=utf-8"),
    });
    const app = createApp(spaAssets);

    const res = await app.request("/assets/index.js", undefined, {
      SPA_ASSETS: spaAssets,
    } as unknown as Env);

    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe(
      "public, max-age=3600, stale-while-revalidate=3600",
    );
  });
});
