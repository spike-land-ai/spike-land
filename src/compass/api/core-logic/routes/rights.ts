import { Hono } from "hono";
import type {
  APIResponse,
  ContextVariables,
  LegalResource,
  PaginatedResponse,
  RejectionAnalysis,
  Rights,
} from "../../types.js";

// ---------------------------------------------------------------------------
// Engine interface
// ---------------------------------------------------------------------------

export interface RightsEngine {
  getRights(jurisdiction: string, domain: string): Promise<Rights | null>;
  analyzeRejection(payload: Record<string, unknown>): Promise<RejectionAnalysis>;
  getLegalResources(
    jurisdiction: string,
    page: number,
    pageSize: number,
  ): Promise<{ items: LegalResource[]; total: number }>;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createRightsRouter(engine: RightsEngine) {
  const router = new Hono<{ Variables: ContextVariables }>();

  // GET /rights/resources/:jurisdiction — must be registered BEFORE /:jurisdiction/:domain
  // so that the literal segment "resources" is not swallowed by the first wildcard.
  router.get("/resources/:jurisdiction", async (c) => {
    const jurisdiction = c.req.param("jurisdiction");
    const page = Math.max(1, parseInt(c.req.query("page") ?? "1", 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(c.req.query("pageSize") ?? "20", 10)));

    const { items, total } = await engine.getLegalResources(jurisdiction, page, pageSize);

    const res: PaginatedResponse<LegalResource> = {
      success: true,
      data: items,
      page,
      pageSize,
      total,
    };
    return c.json(res);
  });

  // GET /rights/:jurisdiction/:domain
  router.get("/:jurisdiction/:domain", async (c) => {
    const jurisdiction = c.req.param("jurisdiction");
    const domain = c.req.param("domain");

    const rights = await engine.getRights(jurisdiction, domain);

    if (!rights) {
      const res: APIResponse<never> = {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: `No rights data found for jurisdiction '${jurisdiction}' domain '${domain}'`,
        },
      };
      return c.json(res, 404);
    }

    const res: APIResponse<Rights> = { success: true, data: rights };
    return c.json(res);
  });

  // POST /rights/analyze-rejection
  router.post("/analyze-rejection", async (c) => {
    let body: Record<string, unknown>;
    try {
      body = await c.req.json<Record<string, unknown>>();
    } catch {
      const res: APIResponse<never> = {
        success: false,
        error: { code: "INVALID_BODY", message: "Request body must be valid JSON" },
      };
      return c.json(res, 400);
    }

    const analysis = await engine.analyzeRejection(body);
    const res: APIResponse<RejectionAnalysis> = { success: true, data: analysis };
    return c.json(res);
  });

  return router;
}
