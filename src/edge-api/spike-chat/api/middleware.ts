import type { Context, Next } from "hono";
import type { Env } from "../core-logic/env";

export type Variables = {
  userId?: string;
  isGuest?: boolean;
};

export async function authMiddleware(
  c: Context<{ Bindings: Env; Variables: Variables }>,
  next: Next,
): Promise<Response | void> {
  const cookie = c.req.header("cookie");
  const authHeader = c.req.header("authorization");
  
  if (!cookie && !authHeader) {
    // Check if it's a guest request (we can use anonymous ID or something similar later)
    const isGuest = c.req.header("x-guest-access") === "true";
    if (isGuest) {
      c.set("isGuest", true);
      c.set("userId", "visitor-" + Math.random().toString(36).substring(7));
      return next();
    }
    return c.json({ error: "Authentication required" }, 401);
  }

  const sessionReq = new Request("https://auth-mcp.spike.land/api/auth/get-session", {
    headers: {
      ...(cookie ? { cookie } : {}),
      ...(authHeader ? { authorization: authHeader } : {}),
      "X-Forwarded-Host": "spike.land",
      "X-Forwarded-Proto": "https",
    },
  });

  let sessionRes: Response;
  try {
    sessionRes = await c.env.AUTH_MCP.fetch(sessionReq);
    if (sessionRes.status === 503) {
      sessionRes = await fetch(sessionReq);
    }
  } catch {
    sessionRes = await fetch(sessionReq);
  }

  if (!sessionRes.ok) {
    return c.json({ error: "Invalid or expired session" }, 401);
  }

  const session = (await sessionRes.json()) as { session?: unknown; user?: { id: string } };

  if (!session?.session || !session?.user) {
    return c.json({ error: "Invalid or expired session" }, 401);
  }

  c.set("userId", session.user.id);
  c.set("isGuest", false);

  return next();
}
