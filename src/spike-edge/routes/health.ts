import { Hono } from "hono";
import type { Env } from "../env.js";

const health = new Hono<{ Bindings: Env }>();

health.get("/health", async (c) => {
  let r2Status = "ok";
  let d1Status = "ok";

  try {
    await c.env.R2.head("__health_check__");
  } catch {
    r2Status = "degraded";
  }

  try {
    await c.env.DB.prepare("SELECT 1").first();
  } catch {
    d1Status = "degraded";
  }

  const overall = r2Status === "ok" && d1Status === "ok" ? "ok" : "degraded";

  return c.json(
    { status: overall, r2: r2Status, d1: d1Status, timestamp: new Date().toISOString() },
    overall === "ok" ? 200 : 503,
  );
});

export { health };
