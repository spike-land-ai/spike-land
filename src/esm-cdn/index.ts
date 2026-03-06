const UPSTREAM_ESM = "https://esm.sh";
const UPSTREAM_CDN = "https://cdn.jsdelivr.net/npm";

function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("Origin") ?? "";
  const allowed =
    origin.endsWith(".spike.land") ||
    origin === "https://spike.land" ||
    origin.startsWith("http://localhost:");

  return {
    "Access-Control-Allow-Origin": allowed ? origin : "https://spike.land",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Max-Age": "86400",
  };
}

function selectUpstream(path: string): string {
  if (path.includes("/min/")) {
    return UPSTREAM_CDN;
  }
  return UPSTREAM_ESM;
}

function getCacheControl(path: string): string {
  if (path.includes("@")) {
    return "public, max-age=31536000, immutable";
  }
  return "public, max-age=3600";
}

export default {
  async fetch(request: Request, _env: unknown, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const cors = getCorsHeaders(request);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    if (url.pathname === "/health") {
      return Response.json(
        { status: "ok", service: "esm-cdn" },
        { headers: cors },
      );
    }

    if (request.method !== "GET") {
      return Response.json(
        { error: "Method not allowed" },
        { status: 405, headers: cors },
      );
    }

    const cache = caches.default;
    const cacheKey = new Request(url.toString(), request);
    const cached = await cache.match(cacheKey);
    if (cached) {
      return cached;
    }

    const upstream = selectUpstream(url.pathname);
    const upstreamUrl = `${upstream}${url.pathname}${url.search}`;

    const upstreamResponse = await fetch(upstreamUrl, { redirect: "follow" });

    if (!upstreamResponse.ok) {
      return new Response(upstreamResponse.body, {
        status: upstreamResponse.status,
        statusText: upstreamResponse.statusText,
        headers: {
          "Content-Type": upstreamResponse.headers.get("Content-Type") ?? "text/plain",
          ...cors,
        },
      });
    }

    const cacheControl = getCacheControl(url.pathname);
    const responseHeaders = new Headers(upstreamResponse.headers);
    responseHeaders.set("Cache-Control", cacheControl);
    for (const [key, value] of Object.entries(cors)) {
      responseHeaders.set(key, value);
    }

    const response = new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      headers: responseHeaders,
    });

    ctx.waitUntil(cache.put(cacheKey, response.clone()));

    return response;
  },
};
