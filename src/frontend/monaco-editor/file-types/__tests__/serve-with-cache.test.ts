import { describe, expect, it, vi } from "vitest";
import { serveWithCache } from "../serve-with-cache.js";

function createCache(): Cache {
  return {
    match: vi.fn().mockResolvedValue(undefined),
    put: vi.fn().mockResolvedValue(undefined),
  } as unknown as Cache;
}

async function serveAsset(filePath: string): Promise<Response> {
  const cache = createCache();
  const pending: Promise<unknown>[] = [];
  const server = serveWithCache(
    { [filePath]: filePath },
    async () => cache,
  );

  const response = await server.serve(
    new Request(`https://code.spike.land/${filePath}`),
    vi.fn(async () => new Response("asset-body", { headers: { "cache-control": "max-age=0" } })),
    (promise) => {
      pending.push(promise);
    },
  );

  await Promise.all(pending);
  return response;
}

describe("serveWithCache cache headers", () => {
  it("does not mark HTML files or extensionless routes as immutable", async () => {
    const htmlResponse = await serveAsset("index.html");
    const routeResponse = await serveAsset("live/demo");

    expect(htmlResponse.headers.get("cache-control")).toBe("public, no-cache, must-revalidate");
    expect(routeResponse.headers.get("cache-control")).toBe("public, no-cache, must-revalidate");
  });

  it("marks hashed assets as immutable", async () => {
    const response = await serveAsset("assets/index.12345678.js");

    expect(response.headers.get("cache-control")).toBe("public, max-age=604800, immutable");
  });

  it("gives unhashed assets a short TTL", async () => {
    const response = await serveAsset("assets/index.js");

    expect(response.headers.get("cache-control")).toBe(
      "public, max-age=3600, stale-while-revalidate=86400",
    );
  });
});
