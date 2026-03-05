import { describe, expect, it, vi } from "vitest";
import { withEdgeCache, safeCtx } from "../../../src/spike-edge/lib/edge-cache.js";
import type { Context } from "hono";

describe("safeCtx", () => {
  it("returns executionCtx when available", () => {
    const ctx = { waitUntil: vi.fn(), passThroughOnException: vi.fn() } as unknown as ExecutionContext;
    const honoCtx = { executionCtx: ctx } as unknown as Context;
    expect(safeCtx(honoCtx)).toBe(ctx);
  });

  it("returns undefined when executionCtx throws", () => {
    const honoCtx = {
      get executionCtx() {
        throw new Error("no ctx");
      },
    } as unknown as Context;
    expect(safeCtx(honoCtx)).toBeUndefined();
  });
});

describe("withEdgeCache", () => {
  it("returns fetcher result when cache API unavailable (no caches global)", async () => {
    const request = new Request("https://spike.land/test");
    const fetcher = vi.fn().mockResolvedValue(
      new Response("hello", { status: 200, headers: { "content-type": "text/plain" } }),
    );

    const result = await withEdgeCache(request, undefined, fetcher, { ttl: 300 });
    expect(result).not.toBeNull();
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it("returns null when fetcher returns null", async () => {
    const request = new Request("https://spike.land/null");
    const fetcher = vi.fn().mockResolvedValue(null);
    const result = await withEdgeCache(request, undefined, fetcher, { ttl: 300 });
    expect(result).toBeNull();
  });

  it("returns response without caching when fetcher returns non-ok response", async () => {
    const request = new Request("https://spike.land/error");
    const fetcher = vi.fn().mockResolvedValue(new Response("Not Found", { status: 404 }));
    const result = await withEdgeCache(request, undefined, fetcher, { ttl: 300 });
    expect(result).not.toBeNull();
    expect(result?.status).toBe(404);
  });

  it("adds swr to Cache-Control when swr option provided", async () => {
    const request = new Request("https://spike.land/swr");
    const fetcher = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }));
    const result = await withEdgeCache(request, undefined, fetcher, { ttl: 300, swr: 3600 });
    expect(result?.headers.get("Cache-Control")).toContain("stale-while-revalidate=3600");
  });

  it("adds immutable to Cache-Control when immutable option is true", async () => {
    const request = new Request("https://spike.land/immutable");
    const fetcher = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }));
    const result = await withEdgeCache(request, undefined, fetcher, { ttl: 31536000, immutable: true });
    expect(result?.headers.get("Cache-Control")).toContain("immutable");
  });

  it("uses custom cacheKey when provided", async () => {
    const request = new Request("https://spike.land/asset.js?version=1");
    const fetcher = vi.fn().mockResolvedValue(new Response("js code", { status: 200 }));
    const result = await withEdgeCache(
      request,
      undefined,
      fetcher,
      { ttl: 300, cacheKey: "https://spike.land/asset.js?_cv=v2" },
    );
    expect(result).not.toBeNull();
    expect(fetcher).toHaveBeenCalled();
  });

  it("uses Cache API when available — returns cached response on hit", async () => {
    const cachedResponse = new Response("cached!", { status: 200, headers: { "x-cached": "true" } });
    const mockCache = {
      match: vi.fn().mockResolvedValue(cachedResponse),
      put: vi.fn().mockResolvedValue(undefined),
    };

    // Stub caches.default
    vi.stubGlobal("caches", { default: mockCache });

    const request = new Request("https://spike.land/cached");
    const fetcher = vi.fn().mockResolvedValue(new Response("fresh", { status: 200 }));

    try {
      const result = await withEdgeCache(request, undefined, fetcher, { ttl: 300 });
      // Should return cached response, fetcher should NOT be called
      expect(result).toBe(cachedResponse);
      expect(fetcher).not.toHaveBeenCalled();
      expect(mockCache.match).toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("stores response in cache via waitUntil on cache miss", async () => {
    const mockCache = {
      match: vi.fn().mockResolvedValue(undefined), // cache miss
      put: vi.fn().mockResolvedValue(undefined),
    };

    vi.stubGlobal("caches", { default: mockCache });

    const waitUntilMock = vi.fn();
    const ctx = { waitUntil: waitUntilMock, passThroughOnException: vi.fn() } as unknown as ExecutionContext;
    const request = new Request("https://spike.land/miss");
    const fetcher = vi.fn().mockResolvedValue(
      new Response("fresh content", { status: 200, headers: { "content-type": "text/html" } }),
    );

    try {
      const result = await withEdgeCache(request, ctx, fetcher, { ttl: 300 });
      expect(result).not.toBeNull();
      expect(fetcher).toHaveBeenCalled();
      // waitUntil should have been called to cache the response in background
      expect(waitUntilMock).toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("stores response with cacheKey in cache on miss", async () => {
    const mockCache = {
      match: vi.fn().mockResolvedValue(undefined),
      put: vi.fn().mockResolvedValue(undefined),
    };

    vi.stubGlobal("caches", { default: mockCache });

    const waitUntilMock = vi.fn();
    const ctx = { waitUntil: waitUntilMock, passThroughOnException: vi.fn() } as unknown as ExecutionContext;
    const request = new Request("https://spike.land/asset.js");
    const fetcher = vi.fn().mockResolvedValue(new Response("code", { status: 200 }));

    try {
      await withEdgeCache(
        request,
        ctx,
        fetcher,
        { ttl: 31536000, immutable: true, cacheKey: "https://spike.land/asset.js?_cv=v1" },
      );
      expect(mockCache.match).toHaveBeenCalledWith(
        expect.objectContaining({ url: "https://spike.land/asset.js?_cv=v1" }),
      );
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
