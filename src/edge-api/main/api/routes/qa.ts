import { Hono } from "hono";
import type { Env, Variables } from "../../core-logic/env.js";
import { qaHealthCheck } from "../../core-logic/qa-health-check.js";

const qa = new Hono<{ Bindings: Env; Variables: Variables }>();

qa.get("/api/qa/check", async (c) => {
  const rawUrl = c.req.query("url");

  if (!rawUrl || typeof rawUrl !== "string" || rawUrl.trim() === "") {
    return c.json({ error: "Query parameter 'url' is required" }, 400);
  }

  const trimmed = rawUrl.trim();
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return c.json({ error: "URL must start with http:// or https://" }, 400);
  }

  // Validate the URL is parseable
  try {
    new URL(trimmed);
  } catch {
    return c.json({ error: "Invalid URL" }, 400);
  }

  // Rate limit by IP — this endpoint performs outbound fetches, which is expensive
  if (c.env.LIMITERS?.idFromName) {
    const rateLimitKey = c.req.header("cf-connecting-ip") ?? "anon";
    const rateLimitId = c.env.LIMITERS.idFromName(`qa:${rateLimitKey}`);
    const rateLimitStub = c.env.LIMITERS.get(rateLimitId);
    const rateLimitResp = await rateLimitStub.fetch(
      new Request("https://limiter.internal/", {
        method: "POST",
        headers: { "X-Rate-Limit-Profile": "GET_QA" },
      }),
    );
    const cooldown = Number(await rateLimitResp.text());
    if (cooldown > 0) {
      return c.json({ error: "Rate limit exceeded", retryAfterSeconds: cooldown }, 429);
    }
  }

  try {
    const report = await qaHealthCheck(trimmed);
    return c.json(report);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return c.json({ error: "Health check failed", detail: message }, 502);
  }
});

export { qa };
