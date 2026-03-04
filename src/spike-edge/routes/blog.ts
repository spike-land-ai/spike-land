import { Hono } from "hono";
import type { Env } from "../env.js";
import { getClientId, sendGA4Events } from "../lib/ga4.js";
import { safeCtx, withEdgeCache } from "../lib/edge-cache.js";

const blog = new Hono<{ Bindings: Env }>();

blog.get("/api/blog", async (c) => {
  let cached: Response | null = null;
  try {
    cached = await withEdgeCache(c.req.raw, safeCtx(c), async () => {
      const obj = await c.env.SPA_ASSETS.get("blog/index.json");
      if (!obj) return null;
      return new Response(obj.body, {
        headers: { "Content-Type": "application/json" },
      });
    }, { ttl: 300, swr: 3600 });
  } catch {
    // Cache API unavailable (e.g. spike.land domain) — fall back to direct R2
    const obj = await c.env.SPA_ASSETS.get("blog/index.json");
    if (obj) {
      cached = new Response(obj.body, {
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  if (!cached) return c.json({ error: "Blog index not found" }, 404);

  try {
    c.executionCtx.waitUntil(
      getClientId(c.req.raw).then((clientId) =>
        sendGA4Events(c.env, clientId, [{
          name: "blog_index",
          params: { page_path: "/api/blog" },
        }])
      ),
    );
  } catch { /* no ExecutionContext in some environments */ }

  return cached;
});

blog.get("/api/blog/:slug", async (c) => {
  const slug = c.req.param("slug");

  let cached: Response | null = null;
  try {
    cached = await withEdgeCache(c.req.raw, safeCtx(c), async () => {
      const obj = await c.env.SPA_ASSETS.get(`blog/${slug}.json`);
      if (!obj) return null;
      return new Response(obj.body, {
        headers: { "Content-Type": "application/json" },
      });
    }, { ttl: 300, swr: 3600 });
  } catch {
    // Cache API unavailable — fall back to direct R2
    const obj = await c.env.SPA_ASSETS.get(`blog/${slug}.json`);
    if (obj) {
      cached = new Response(obj.body, {
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  if (!cached) return c.json({ error: "Post not found" }, 404);

  try {
    c.executionCtx.waitUntil(
      getClientId(c.req.raw).then((clientId) =>
        sendGA4Events(c.env, clientId, [{
          name: "blog_view",
          params: { page_path: `/api/blog/${slug}`, slug },
        }])
      ),
    );
  } catch { /* no ExecutionContext in some environments */ }

  return cached;
});

export { blog };
