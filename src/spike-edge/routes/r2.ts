import { Hono } from "hono";
import type { Env } from "../env.js";
import { getClientId, sendGA4Events } from "../lib/ga4.js";

const r2 = new Hono<{ Bindings: Env }>();

r2.get("/r2/:key{.+}", async (c) => {
  const key = c.req.param("key");
  const object = await c.env.R2.get(key);

  if (!object) {
    return c.json({ error: "Not found" }, 404);
  }

  try {
    c.executionCtx.waitUntil(
      getClientId(c.req.raw).then((clientId) =>
        sendGA4Events(c.env, clientId, [{
          name: "r2_operation",
          params: { operation: "read", key },
        }])
      ),
    );
  } catch { /* no ExecutionContext in test environment */ }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=3600");

  return new Response(object.body, { headers });
});

r2.post("/r2/upload", async (c) => {
  const contentType = c.req.header("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return c.json({ error: "Content-Type must be application/json" }, 400);
  }

  const body = await c.req.json<{ key?: string; contentType?: string }>();
  if (!body.key) {
    return c.json({ error: "Missing required field: key" }, 400);
  }
  const uploadKey = body.key;

  try {
    c.executionCtx.waitUntil(
      getClientId(c.req.raw).then((clientId) =>
        sendGA4Events(c.env, clientId, [{
          name: "r2_operation",
          params: { operation: "upload", key: uploadKey },
        }])
      ),
    );
  } catch { /* no ExecutionContext in test environment */ }

  // Direct upload: read the body from a subsequent PUT, or accept inline data
  // For now, create a placeholder and return the key for a follow-up PUT
  return c.json({ key: body.key, status: "ready" }, 201);
});

r2.delete("/r2/:key{.+}", async (c) => {
  const key = c.req.param("key");
  await c.env.R2.delete(key);

  try {
    c.executionCtx.waitUntil(
      getClientId(c.req.raw).then((clientId) =>
        sendGA4Events(c.env, clientId, [{
          name: "r2_operation",
          params: { operation: "delete", key },
        }])
      ),
    );
  } catch { /* no ExecutionContext in test environment */ }

  return c.json({ deleted: key });
});

export { r2 };
