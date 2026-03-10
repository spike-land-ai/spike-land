import { Hono } from "hono";
import { cors } from "hono/cors";
import type { ContextVariables } from "./types.js";
import { authMiddleware } from "./core-logic/middleware/auth.js";
import { RateLimiter } from "./core-logic/middleware/rate-limit.js";
import { localeMiddleware } from "./core-logic/middleware/locale.js";
import type { SessionEngine } from "./core-logic/routes/sessions.js";
import { createSessionsRouter } from "./core-logic/routes/sessions.js";
import type { EligibilityEngine } from "./core-logic/routes/eligibility.js";
import { createEligibilityRouter } from "./core-logic/routes/eligibility.js";
import type { NavigationEngine } from "./core-logic/routes/navigation.js";
import { createNavigationRouter } from "./core-logic/routes/navigation.js";
import type { RightsEngine } from "./core-logic/routes/rights.js";
import { createRightsRouter } from "./core-logic/routes/rights.js";
import type { SearchEngine } from "./core-logic/routes/search.js";
import { createSearchRouter } from "./core-logic/routes/search.js";

// ---------------------------------------------------------------------------
// Engine bundle injected at startup
// ---------------------------------------------------------------------------

export interface CompassEngines {
  sessions: SessionEngine;
  eligibility: EligibilityEngine;
  navigation: NavigationEngine;
  rights: RightsEngine;
  search: SearchEngine;
}

// ---------------------------------------------------------------------------
// App factory
// ---------------------------------------------------------------------------

/**
 * Creates and configures the main Hono application.
 *
 * All engine implementations are injected so the app remains testable without
 * real database or AI connections.
 */
export function createApp(engines: CompassEngines): Hono<{ Variables: ContextVariables }> {
  const app = new Hono<{ Variables: ContextVariables }>();

  // ---- Global middleware --------------------------------------------------

  app.use("*", cors({ origin: "*", allowMethods: ["GET", "POST", "DELETE", "OPTIONS"] }));
  app.use("*", localeMiddleware);

  // Global rate limiter: 100 req / 60 s per client
  const globalLimiter = new RateLimiter(100, 60_000);
  app.use("*", globalLimiter.middleware);

  // ---- Health check (unauthenticated) ------------------------------------

  app.get("/", (c) => {
    return c.json({
      success: true,
      data: {
        service: "compass-api",
        status: "ok",
        version: "0.1.0",
        timestamp: new Date().toISOString(),
      },
    });
  });

  app.get("/health", (c) => {
    return c.json({
      success: true,
      data: { status: "ok", timestamp: new Date().toISOString() },
    });
  });

  // ---- Authenticated routes -----------------------------------------------

  // All routes under /api/* require a valid Bearer token
  app.use("/api/*", authMiddleware);

  const sessions = createSessionsRouter(engines.sessions);
  const eligibility = createEligibilityRouter(engines.eligibility);
  const navigation = createNavigationRouter(engines.navigation);
  const rights = createRightsRouter(engines.rights);
  const search = createSearchRouter(engines.search);

  app.route("/api/sessions", sessions);
  app.route("/api/eligibility", eligibility);
  app.route("/api/navigation", navigation);
  app.route("/api/rights", rights);
  app.route("/api/search", search);

  // ---- 404 fallthrough ---------------------------------------------------

  app.notFound((c) => {
    return c.json(
      {
        success: false,
        error: { code: "NOT_FOUND", message: `Route ${c.req.method} ${c.req.path} not found` },
      },
      404,
    );
  });

  // ---- Error handler -----------------------------------------------------

  app.onError((err, c) => {
    console.error("[compass-api] unhandled error", err);
    return c.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
      },
      500,
    );
  });

  return app;
}
