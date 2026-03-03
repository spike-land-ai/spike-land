import type { Context, Next } from "hono";
import type { Env } from "../env.js";

/**
 * Auth middleware that validates the user session via the AUTH_MCP service binding.
 * Returns 401 if no valid session exists.
 */
export async function authMiddleware(
  c: Context<{ Bindings: Env }>,
  next: Next,
): Promise<Response | void> {
  const cookie = c.req.header("cookie");
  const authHeader = c.req.header("authorization");

  if (!cookie && !authHeader) {
    return c.json({ error: "Authentication required" }, 401);
  }

  // Validate session via AUTH_MCP service binding (sub-1ms internal call)
  const sessionReq = new Request("https://auth-mcp.spike.land/api/auth/get-session", {
    headers: {
      ...(cookie ? { cookie } : {}),
      ...(authHeader ? { authorization: authHeader } : {}),
      "X-Forwarded-Host": "spike.land",
      "X-Forwarded-Proto": "https",
    },
  });

  const sessionRes = await c.env.AUTH_MCP.fetch(sessionReq);

  if (!sessionRes.ok) {
    return c.json({ error: "Invalid or expired session" }, 401);
  }

  const session = await sessionRes.json<{ session?: unknown; user?: { id: string } }>();

  if (!session?.session || !session?.user) {
    return c.json({ error: "Invalid or expired session" }, 401);
  }

  // Store user info for downstream handlers
  c.set("userId" as never, session.user.id as never);

  return next();
}
