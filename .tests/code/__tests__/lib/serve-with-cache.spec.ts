import { describe, expect, it, vi, beforeEach } from "vitest";
import { serveWithCache } from "@/lib/serve-with-cache";

function makeRequest(url: string, method = "GET"): Request {
  return new Request(url, { method });
}

function makeCache(): Cache {
  const store = new Map<string, Response>();
  return {
    match: vi.fn(async (req: Request | string) => {
      const key = typeof req === "string" ? req : req.url;
      return store.get(key) ?? undefined;
    }),
    put: vi.fn(async (req: Request | string, resp: Response) => {
      const key = typeof req === "string" ? req : req.url;
      store.set(key, resp);
    }),
    delete: vi.fn(async () => false),
    keys: vi.fn(async () => []),
    add: vi.fn(async () => {}),
    addAll: vi.fn(async () => {}),
    matchAll: vi.fn(async () => []),
  } as unknown as Cache;
}

describe("serveWithCache", () => {
  const files = {
    "main.abc123.js": "main.abc123.js",
    "style.def456.css": "style.def456.css",
    ASSET_HASH: "myhash",
  };

  let cache: Cache;
  let cacheToUse: () => Promise<Cache>;
  let waitUntil: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    cache = makeCache();
    cacheToUse = vi.fn().mockResolvedValue(cache);
    waitUntil = vi.fn();
  });

  describe("isAsset", () => {
    it("returns true for files in the map", () => {
      const { isAsset } = serveWithCache(files, cacheToUse);
      expect(isAsset(makeRequest("https://example.com/main.abc123.js"))).toBe(true);
    });

    it("returns true for files under ASSET_HASH prefix", () => {
      const { isAsset } = serveWithCache(files, cacheToUse);
      expect(isAsset(makeRequest("https://example.com/myhash/main.abc123.js"))).toBe(true);
    });

    it("returns false for files not in the map", () => {
      const { isAsset } = serveWithCache(files, cacheToUse);
      expect(isAsset(makeRequest("https://example.com/unknown.js"))).toBe(false);
    });
  });

  describe("shouldBeCached", () => {
    it("returns true for assets", () => {
      const { shouldBeCached } = serveWithCache(files, cacheToUse);
      expect(shouldBeCached(makeRequest("https://example.com/main.abc123.js"))).toBe(true);
    });

    it("returns false for /live/ paths", () => {
      const { shouldBeCached } = serveWithCache(files, cacheToUse);
      expect(shouldBeCached(makeRequest("https://example.com/live/myspace/session.json"))).toBe(false);
    });

    it("returns false for /my-cms/ paths", () => {
      const { shouldBeCached } = serveWithCache(files, cacheToUse);
      expect(shouldBeCached(makeRequest("https://example.com/my-cms/page"))).toBe(false);
    });

    it("returns false for /api/ paths", () => {
      const { shouldBeCached } = serveWithCache(files, cacheToUse);
      expect(shouldBeCached(makeRequest("https://example.com/api/data"))).toBe(false);
    });

    it("returns true for unknown paths that are not routes", () => {
      const { shouldBeCached } = serveWithCache(files, cacheToUse);
      // /random-path is not a known route
      expect(shouldBeCached(makeRequest("https://example.com/random-unknown-path"))).toBe(true);
    });
  });

  describe("serve", () => {
    it("returns 405 for non-GET requests", async () => {
      const { serve } = serveWithCache(files, cacheToUse);
      const resp = await serve(
        makeRequest("https://example.com/main.abc123.js", "POST"),
        vi.fn(),
        waitUntil,
      );
      expect(resp.status).toBe(405);
    });

    it("returns 404 for requests to unknown files", async () => {
      const { serve } = serveWithCache(files, cacheToUse);
      const resp = await serve(
        makeRequest("https://example.com/unknown.js"),
        vi.fn(),
        waitUntil,
      );
      expect(resp.status).toBe(404);
    });

    it("returns 503 when cache is unavailable", async () => {
      const failingCache = vi.fn().mockRejectedValue(new Error("cache unavailable"));
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const { serve } = serveWithCache(files, failingCache);
      // Wait for cache init to fail
      await new Promise((r) => setTimeout(r, 10));
      const assetFetcher = vi.fn().mockResolvedValue(new Response("content", { status: 200 }));
      const resp = await serve(
        makeRequest("https://example.com/main.abc123.js"),
        assetFetcher,
        waitUntil,
      );
      expect(resp.status).toBe(503);
      consoleSpy.mockRestore();
    });

    it("fetches from assetFetcher and returns response when not cached", async () => {
      const body = "console.log('hello');";
      const assetFetcher = vi.fn().mockResolvedValue(
        new Response(body, {
          status: 200,
          headers: { "Content-Type": "application/javascript" },
        }),
      );
      const { serve } = serveWithCache(files, cacheToUse);
      // Wait for cache to initialize
      await new Promise((r) => setTimeout(r, 10));
      const resp = await serve(
        makeRequest("https://example.com/main.abc123.js"),
        assetFetcher,
        waitUntil,
      );
      expect(resp.status).toBe(200);
      expect(assetFetcher).toHaveBeenCalled();
    });

    it("returns cached response on second request", async () => {
      const body = "cached content";
      const assetFetcher = vi.fn().mockResolvedValue(
        new Response(body, { status: 200 }),
      );
      const { serve } = serveWithCache(files, cacheToUse);
      await new Promise((r) => setTimeout(r, 10));

      // First request — populates cache
      await serve(
        makeRequest("https://example.com/main.abc123.js"),
        assetFetcher,
        waitUntil,
      );

      // Manually put in cache since waitUntil is mocked
      const cachedResp = new Response(body, { status: 200 });
      (cache.match as ReturnType<typeof vi.fn>).mockResolvedValueOnce(cachedResp);

      // Second request — should hit cache
      const resp = await serve(
        makeRequest("https://example.com/main.abc123.js"),
        assetFetcher,
        waitUntil,
      );
      expect(resp.status).toBe(200);
    });

    it("returns error response when assetFetcher returns non-ok response", async () => {
      const assetFetcher = vi.fn().mockResolvedValue(
        new Response("not found", { status: 404 }),
      );
      const { serve } = serveWithCache(files, cacheToUse);
      await new Promise((r) => setTimeout(r, 10));
      const resp = await serve(
        makeRequest("https://example.com/main.abc123.js"),
        assetFetcher,
        waitUntil,
      );
      expect(resp.status).toBe(404);
    });

    it("returns 500 when assetFetcher throws", async () => {
      const assetFetcher = vi.fn().mockRejectedValue(new Error("fetch error"));
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const { serve } = serveWithCache(files, cacheToUse);
      await new Promise((r) => setTimeout(r, 10));
      const resp = await serve(
        makeRequest("https://example.com/main.abc123.js"),
        assetFetcher,
        waitUntil,
      );
      expect(resp.status).toBe(500);
      consoleSpy.mockRestore();
    });
  });
});
