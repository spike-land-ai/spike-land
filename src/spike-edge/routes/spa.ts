import { Hono } from "hono";
import type { Env } from "../env.js";
import { getClientId, sendGA4Events } from "../lib/ga4.js";

const spa = new Hono<{ Bindings: Env }>();

const IMMUTABLE_EXTENSIONS = new Set([".js", ".css", ".wasm", ".woff2", ".woff", ".ttf"]);

function isHashedAsset(path: string): boolean {
  // Match patterns like filename.abc123.js or filename-abc123.css
  return /\.[a-f0-9]{8,}\.\w+$/.test(path);
}

spa.get("/*", async (c) => {
  const path = new URL(c.req.url).pathname;

  // Strip leading slash for R2 key
  let key = path.startsWith("/") ? path.slice(1) : path;

  // Default to index.html for root
  if (!key) {
    key = "index.html";
  }

  const object = await c.env.SPA_ASSETS.get(key);

  if (!object) {
    // SPA fallback: serve index.html for non-file paths
    const fallback = await c.env.SPA_ASSETS.get("index.html");
    if (!fallback) {
      return c.text("Not Found", 404);
    }

    const response = new Response(fallback.body, {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-cache",
      },
    });

    c.executionCtx.waitUntil(
      getClientId(c.req.raw).then((clientId) =>
        sendGA4Events(c.env, clientId, [{
          name: "page_view",
          params: {
            page_path: path,
            referrer: (c.req.header("referer") ?? "").slice(0, 500),
            user_agent: (c.req.header("user-agent") ?? "").slice(0, 200),
          },
        }])
      ),
    );

    return response;
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);

  const ext = key.substring(key.lastIndexOf("."));
  if (IMMUTABLE_EXTENSIONS.has(ext) && isHashedAsset(key)) {
    headers.set("cache-control", "public, max-age=31536000, immutable");
  } else {
    headers.set("cache-control", "public, max-age=3600");
  }

  return new Response(object.body, { headers });
});

export { spa };
