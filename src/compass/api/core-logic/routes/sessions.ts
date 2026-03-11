import { Hono } from "hono";
import type { Session, SessionCreateRequest, ContextVariables } from "../../types.js";
import type { APIResponse } from "../../types.js";

// ---------------------------------------------------------------------------
// Engine interface (injected — no real engine imported here)
// ---------------------------------------------------------------------------

export interface SessionEngine {
  create(opts: {
    locale: string;
    jurisdiction?: string | undefined;
    userId: string;
  }): Promise<Session>;
  get(id: string): Promise<Session | null>;
  end(id: string): Promise<Session | null>;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Creates the /sessions router with a caller-supplied engine implementation.
 * This keeps the route handlers fully testable without real engine code.
 */
export function createSessionsRouter(engine: SessionEngine) {
  const router = new Hono<{ Variables: ContextVariables }>();

  // POST /sessions — create a new session
  router.post("/", async (c) => {
    let body: SessionCreateRequest;
    try {
      body = await c.req.json<SessionCreateRequest>();
    } catch {
      const res: APIResponse<never> = {
        success: false,
        error: { code: "INVALID_BODY", message: "Request body must be valid JSON" },
      };
      return c.json(res, 400);
    }

    if (!body.locale || typeof body.locale !== "string") {
      const res: APIResponse<never> = {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "`locale` is required" },
      };
      return c.json(res, 422);
    }

    const userId = c.get("userId");
    const session = await engine.create({
      locale: body.locale,
      jurisdiction: body.jurisdiction,
      userId,
    });

    const res: APIResponse<Session> = { success: true, data: session };
    return c.json(res, 201);
  });

  // GET /sessions/:id — retrieve a session
  router.get("/:id", async (c) => {
    const id = c.req.param("id");
    const session = await engine.get(id);

    if (!session) {
      const res: APIResponse<never> = {
        success: false,
        error: { code: "NOT_FOUND", message: `Session '${id}' not found` },
      };
      return c.json(res, 404);
    }

    const res: APIResponse<Session> = { success: true, data: session };
    return c.json(res);
  });

  // DELETE /sessions/:id — end a session
  router.delete("/:id", async (c) => {
    const id = c.req.param("id");
    const session = await engine.end(id);

    if (!session) {
      const res: APIResponse<never> = {
        success: false,
        error: { code: "NOT_FOUND", message: `Session '${id}' not found` },
      };
      return c.json(res, 404);
    }

    const res: APIResponse<Session> = { success: true, data: session };
    return c.json(res);
  });

  return router;
}
