import { Hono } from "hono";
import type {
  APIResponse,
  ContextVariables,
  LegalResource,
  PaginatedResponse,
  Program,
  Rights,
  SearchRequest,
  SearchResult,
} from "../../types.js";

// ---------------------------------------------------------------------------
// Engine interface
// ---------------------------------------------------------------------------

export interface SearchEngine {
  searchPrograms(
    request: SearchRequest,
  ): Promise<{ items: SearchResult<Program>[]; total: number }>;
  searchProcesses(
    request: SearchRequest,
  ): Promise<{ items: SearchResult<Record<string, unknown>>[]; total: number }>;
  searchRights(
    request: SearchRequest,
  ): Promise<{ items: SearchResult<Rights | LegalResource>[]; total: number }>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseSearchQuery(
  raw: Record<string, string | string[] | undefined>,
): SearchRequest | null {
  const query = typeof raw["query"] === "string" ? raw["query"].trim() : undefined;
  if (!query) return null;

  const jurisdiction = typeof raw["jurisdiction"] === "string" ? raw["jurisdiction"] : undefined;
  const domain = typeof raw["domain"] === "string" ? raw["domain"] : undefined;
  const page = raw["page"] ? parseInt(String(raw["page"]), 10) : undefined;

  return { query, jurisdiction, domain, page };
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createSearchRouter(engine: SearchEngine) {
  const router = new Hono<{ Variables: ContextVariables }>();

  // GET /search/programs?query=&jurisdiction=&domain=&page=
  router.get("/programs", async (c) => {
    const req = parseSearchQuery(c.req.query() as Record<string, string | undefined>);

    if (!req) {
      const res: APIResponse<never> = {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "`query` parameter is required" },
      };
      return c.json(res, 422);
    }

    const page = Math.max(1, req.page ?? 1);
    const { items, total } = await engine.searchPrograms(req);

    const paged: PaginatedResponse<SearchResult<Program>> = {
      success: true,
      data: items,
      page,
      pageSize: items.length,
      total,
    };
    return c.json(paged);
  });

  // GET /search/processes?query=&jurisdiction=&domain=&page=
  router.get("/processes", async (c) => {
    const req = parseSearchQuery(c.req.query() as Record<string, string | undefined>);

    if (!req) {
      const res: APIResponse<never> = {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "`query` parameter is required" },
      };
      return c.json(res, 422);
    }

    const page = Math.max(1, req.page ?? 1);
    const { items, total } = await engine.searchProcesses(req);

    const paged: PaginatedResponse<SearchResult<Record<string, unknown>>> = {
      success: true,
      data: items,
      page,
      pageSize: items.length,
      total,
    };
    return c.json(paged);
  });

  // GET /search/rights?query=&jurisdiction=&domain=&page=
  router.get("/rights", async (c) => {
    const req = parseSearchQuery(c.req.query() as Record<string, string | undefined>);

    if (!req) {
      const res: APIResponse<never> = {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "`query` parameter is required" },
      };
      return c.json(res, 422);
    }

    const page = Math.max(1, req.page ?? 1);
    const { items, total } = await engine.searchRights(req);

    const paged: PaginatedResponse<SearchResult<Rights | LegalResource>> = {
      success: true,
      data: items,
      page,
      pageSize: items.length,
      total,
    };
    return c.json(paged);
  });

  return router;
}
