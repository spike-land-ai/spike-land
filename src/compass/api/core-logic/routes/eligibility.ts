import { Hono } from "hono";
import type {
  APIResponse,
  ContextVariables,
  EligibilityRequest,
  EligibilityResult,
  PaginatedResponse,
  Program,
} from "../../types.js";

// ---------------------------------------------------------------------------
// Engine interface
// ---------------------------------------------------------------------------

export interface EligibilityEngine {
  check(request: EligibilityRequest): Promise<EligibilityResult>;
  listPrograms(
    jurisdiction: string,
    page: number,
    pageSize: number,
  ): Promise<{ items: Program[]; total: number }>;
  getProgram(id: string): Promise<Program | null>;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createEligibilityRouter(engine: EligibilityEngine) {
  const router = new Hono<{ Variables: ContextVariables }>();

  // POST /eligibility/check
  router.post("/check", async (c) => {
    let body: EligibilityRequest;
    try {
      body = await c.req.json<EligibilityRequest>();
    } catch {
      const res: APIResponse<never> = {
        success: false,
        error: { code: "INVALID_BODY", message: "Request body must be valid JSON" },
      };
      return c.json(res, 400);
    }

    if (!body.jurisdiction || typeof body.jurisdiction !== "string") {
      const res: APIResponse<never> = {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "`jurisdiction` is required" },
      };
      return c.json(res, 422);
    }

    if (!body.profile || typeof body.profile !== "object" || Array.isArray(body.profile)) {
      const res: APIResponse<never> = {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "`profile` must be a non-null object" },
      };
      return c.json(res, 422);
    }

    const result = await engine.check(body);
    const res: APIResponse<EligibilityResult> = { success: true, data: result };
    return c.json(res);
  });

  // GET /eligibility/programs/:jurisdiction
  router.get("/programs/:jurisdiction", async (c) => {
    const jurisdiction = c.req.param("jurisdiction");
    const page = Math.max(1, parseInt(c.req.query("page") ?? "1", 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(c.req.query("pageSize") ?? "20", 10)));

    const { items, total } = await engine.listPrograms(jurisdiction, page, pageSize);

    const res: PaginatedResponse<Program> = {
      success: true,
      data: items,
      page,
      pageSize,
      total,
    };
    return c.json(res);
  });

  // GET /eligibility/programs/:id — single program detail
  // NOTE: this conflicts with the jurisdiction route above when :id contains a
  // slash.  We distinguish by registering a more-specific pattern.
  router.get("/program/:id", async (c) => {
    const id = c.req.param("id");
    const program = await engine.getProgram(id);

    if (!program) {
      const res: APIResponse<never> = {
        success: false,
        error: { code: "NOT_FOUND", message: `Program '${id}' not found` },
      };
      return c.json(res, 404);
    }

    const res: APIResponse<Program> = { success: true, data: program };
    return c.json(res);
  });

  return router;
}
