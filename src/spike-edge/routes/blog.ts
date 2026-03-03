import { Hono } from "hono";
import type { Env } from "../env.js";

const blog = new Hono<{ Bindings: Env }>();

blog.get("/api/blog", async (c) => {
  const obj = await c.env.SPA_ASSETS.get("blog/index.json");
  if (!obj) {
    return c.json({ error: "Blog index not found" }, 404);
  }
  c.header("Cache-Control", "public, max-age=3600");
  c.header("Content-Type", "application/json");
  return c.body(obj.body);
});

blog.get("/api/blog/:slug", async (c) => {
  const slug = c.req.param("slug");
  const obj = await c.env.SPA_ASSETS.get(`blog/${slug}.json`);
  if (!obj) {
    return c.json({ error: "Post not found" }, 404);
  }
  c.header("Cache-Control", "public, max-age=3600");
  c.header("Content-Type", "application/json");
  return c.body(obj.body);
});

export { blog };
