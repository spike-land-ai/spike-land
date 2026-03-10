import { Hono } from "hono";
import type { Env } from "../../core-logic/env.js";

const settings = new Hono<{ Bindings: Env }>();

settings.get("/api/settings/public", (c) => {
  const configured = Number.parseInt(c.env.LLM_CONTEXT_WINDOW ?? "", 10);
  const contextWindow = Number.isFinite(configured) && configured > 0 ? configured : 128_000;

  return c.json({
    context_window: contextWindow,
  });
});

export { settings };
