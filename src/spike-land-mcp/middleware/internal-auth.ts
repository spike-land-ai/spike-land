import type { Context, Next } from "hono";
import type { Env } from "../env";

/**
 * Middleware that validates `x-internal-secret` header against `MCP_INTERNAL_SECRET`.
 * Protects /internal/* routes from unauthorized access.
 */
export async function internalAuthMiddleware(
  c: Context<{ Bindings: Env }>,
  next: Next,
): Promise<Response | void> {
  const secret = c.req.header("x-internal-secret");
  if (!secret || !c.env.MCP_INTERNAL_SECRET || secret !== c.env.MCP_INTERNAL_SECRET) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  return next();
}
