import type { Context, Next } from "hono";
import type { ContextVariables } from "../../types.js";

/**
 * Extracts and validates a Bearer token from the Authorization header.
 * Attaches the resolved userId to Hono context variables.
 *
 * Stub: replace `verifyToken` with your actual JWT / session-lookup logic.
 */

interface TokenPayload {
  sub: string;
}

/**
 * Stub verification — swap for real JWT validation (e.g. jose, CF KV lookup).
 * Returns null if the token is invalid or expired.
 */
async function verifyToken(token: string): Promise<TokenPayload | null> {
  // TODO: replace with real verification (e.g. verify JWT signature, check
  //       revocation list in KV, or call an auth service binding).
  if (!token || token === "invalid") {
    return null;
  }
  // For development: treat token as a base64-encoded JSON payload.
  // In production this MUST be replaced with cryptographic verification.
  try {
    const raw = atob(token.split(".")[1] ?? "");
    const parsed = JSON.parse(raw) as { sub?: unknown };
    if (typeof parsed.sub === "string" && parsed.sub.length > 0) {
      return { sub: parsed.sub };
    }
  } catch {
    // Fall through to stub path below
  }
  // Stub: accept any non-empty, non-"invalid" token and use it as the userId.
  return { sub: `user:${token.slice(0, 8)}` };
}

export async function authMiddleware(
  c: Context<{ Variables: ContextVariables }>,
  next: Next,
): Promise<Response | void> {
  const authHeader = c.req.header("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json(
      {
        success: false,
        error: { code: "AUTH_REQUIRED", message: "Bearer token required" },
      },
      401,
    );
  }

  const token = authHeader.slice(7).trim();
  const payload = await verifyToken(token);

  if (!payload) {
    return c.json(
      {
        success: false,
        error: { code: "AUTH_INVALID", message: "Invalid or expired token" },
      },
      401,
    );
  }

  c.set("userId", payload.sub);
  return next();
}
