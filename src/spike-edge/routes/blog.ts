import { Hono } from "hono";
import type { Env } from "../env.js";
import { getClientId, sendGA4Events } from "../lib/ga4.js";
import { safeCtx, withEdgeCache } from "../lib/edge-cache.js";

const blog = new Hono<{ Bindings: Env }>();

blog.get("/api/blog", async (c) => {
  const cached = await withEdgeCache(c.req.raw, safeCtx(c), async () => {
    const obj = await c.env.SPA_ASSETS.get("blog/index.json");
    if (!obj) return null;
    return new Response(obj.body, {
      headers: { "Content-Type": "application/json" },
    });
  }, { ttl: 300, swr: 3600 });

  if (!cached) return c.json({ error: "Blog index not found" }, 404);

  c.executionCtx.waitUntil(
    getClientId(c.req.raw).then((clientId) =>
      sendGA4Events(c.env, clientId, [{
        name: "blog_index",
        params: { page_path: "/api/blog" },
      }])
    ),
  );

  return cached;
});

blog.get("/api/blog/:slug", async (c) => {
  const slug = c.req.param("slug");

  const cached = await withEdgeCache(c.req.raw, safeCtx(c), async () => {
    const obj = await c.env.SPA_ASSETS.get(`blog/${slug}.json`);
    if (!obj) return null;
    return new Response(obj.body, {
      headers: { "Content-Type": "application/json" },
    });
  }, { ttl: 300, swr: 3600 });

  if (!cached) return c.json({ error: "Post not found" }, 404);

  c.executionCtx.waitUntil(
    getClientId(c.req.raw).then((clientId) =>
      sendGA4Events(c.env, clientId, [{
        name: "blog_view",
        params: { page_path: `/api/blog/${slug}`, slug },
      }])
    ),
  );

  return cached;
});

export { blog };
