import { describe, expect, it, vi } from "vitest";
import { serveWithCache } from "../../src/frontend/monaco-editor/file-types/serve-with-cache";

function createMockCache() {
  const store = new Map<string, Response>();
  return {
    match: vi.fn(async (req: Request) => store.get(req.url) ?? undefined),
    put: vi.fn(async (req: Request, res: Response) => {
      store.set(req.url, res.clone());
    }),
  } as unknown as Cache;
}

function makeFiles(extra: Record<string, string> = {}): Record<string, string> {
  return {
    ASSET_HASH: "testhash123",
    "index.html": "index.html",
    "app.js": "app.js",
    "style.css": "style.css",
    "assets/main.a1b2c3d4.js": "assets/main.a1b2c3d4.js",
    "assets/style.deadbeef01.css": "assets/style.deadbeef01.css",
    "favicon.ico": "favicon.ico",
    ...extra,
  };
}

async function serveAsset(filePath: string, files?: Record<string, string>) {
  const cache = createMockCache();
  const server = serveWithCache(files ?? makeFiles(), () => Promise.resolve(cache));

  const url = `https://example.com/${filePath}`;
  const request = new Request(url);

  const assetFetcher = vi.fn(async () => new Response("body", { status: 200 }));
  const waitUntil = vi.fn();

  const response = await server.serve(request, assetFetcher, waitUntil);
  return response;
}

describe("serve-with-cache cache headers", () => {
  it("serves HTML files with no-cache, must-revalidate", async () => {
    const response = await serveAsset("index.html");
    const cc = response.headers.get("Cache-Control");
    expect(cc).toBe("public, no-cache, must-revalidate");
  });

  it("serves hashed assets with immutable", async () => {
    const response = await serveAsset("assets/main.a1b2c3d4.js");
    const cc = response.headers.get("Cache-Control");
    expect(cc).toBe("public, max-age=604800, immutable");
  });

  it("serves hashed CSS with immutable", async () => {
    const response = await serveAsset("assets/style.deadbeef01.css");
    const cc = response.headers.get("Cache-Control");
    expect(cc).toBe("public, max-age=604800, immutable");
  });

  it("serves unhashed JS with short TTL", async () => {
    const response = await serveAsset("app.js");
    const cc = response.headers.get("Cache-Control");
    expect(cc).toBe("public, max-age=3600, stale-while-revalidate=86400");
  });

  it("serves unhashed CSS with short TTL", async () => {
    const response = await serveAsset("style.css");
    const cc = response.headers.get("Cache-Control");
    expect(cc).toBe("public, max-age=3600, stale-while-revalidate=86400");
  });
});
