import { Hono } from "hono";
import type {
  APIResponse,
  ContextVariables,
  MessageRequest,
  NavigationChecklist,
  NavigationMessage,
  NavigationRequest,
  NavigationStatus,
} from "../../types.js";

// ---------------------------------------------------------------------------
// Engine interface
// ---------------------------------------------------------------------------

export interface NavigationEngine {
  start(request: NavigationRequest & { userId: string }): Promise<NavigationStatus>;
  sendMessage(request: MessageRequest): Promise<NavigationMessage>;
  getStatus(sessionId: string): Promise<NavigationStatus | null>;
  getChecklist(sessionId: string): Promise<NavigationChecklist | null>;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createNavigationRouter(engine: NavigationEngine) {
  const router = new Hono<{ Variables: ContextVariables }>();

  // POST /navigation/start — begin a guided process
  router.post("/start", async (c) => {
    let body: NavigationRequest;
    try {
      body = await c.req.json<NavigationRequest>();
    } catch {
      const res: APIResponse<never> = {
        success: false,
        error: { code: "INVALID_BODY", message: "Request body must be valid JSON" },
      };
      return c.json(res, 400);
    }

    if (!body.sessionId || !body.programId) {
      const res: APIResponse<never> = {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "`sessionId` and `programId` are required",
        },
      };
      return c.json(res, 422);
    }

    const userId = c.get("userId");
    const status = await engine.start({ ...body, userId });
    const res: APIResponse<NavigationStatus> = { success: true, data: status };
    return c.json(res, 201);
  });

  // POST /navigation/message — send a conversational message
  router.post("/message", async (c) => {
    let body: MessageRequest;
    try {
      body = await c.req.json<MessageRequest>();
    } catch {
      const res: APIResponse<never> = {
        success: false,
        error: { code: "INVALID_BODY", message: "Request body must be valid JSON" },
      };
      return c.json(res, 400);
    }

    if (!body.sessionId || !body.content) {
      const res: APIResponse<never> = {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "`sessionId` and `content` are required",
        },
      };
      return c.json(res, 422);
    }

    const message = await engine.sendMessage(body);
    const res: APIResponse<NavigationMessage> = { success: true, data: message };
    return c.json(res);
  });

  // GET /navigation/:sessionId/status
  router.get("/:sessionId/status", async (c) => {
    const sessionId = c.req.param("sessionId");
    const status = await engine.getStatus(sessionId);

    if (!status) {
      const res: APIResponse<never> = {
        success: false,
        error: { code: "NOT_FOUND", message: `No navigation found for session '${sessionId}'` },
      };
      return c.json(res, 404);
    }

    const res: APIResponse<NavigationStatus> = { success: true, data: status };
    return c.json(res);
  });

  // GET /navigation/:sessionId/checklist
  router.get("/:sessionId/checklist", async (c) => {
    const sessionId = c.req.param("sessionId");
    const checklist = await engine.getChecklist(sessionId);

    if (!checklist) {
      const res: APIResponse<never> = {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: `No checklist found for session '${sessionId}'`,
        },
      };
      return c.json(res, 404);
    }

    const res: APIResponse<NavigationChecklist> = { success: true, data: checklist };
    return c.json(res);
  });

  return router;
}
