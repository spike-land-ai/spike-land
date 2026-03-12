import type { Context } from "hono";
import { Hono } from "hono";
import type { Env } from "../../core-logic/env.js";
import {
  buildHealthPayload,
  checkCriticalTables,
  checkDependencyHealth,
  checkFetchBindingHealth,
  getHealthHttpStatus,
} from "./health-route-logic.js";

/** Critical tables that must exist for core functionality. */
const CRITICAL_TABLES = [
  "analytics_events",
  "error_logs",
  "subscriptions",
  "credit_balances",
  "blog_posts",
];

const health = new Hono<{ Bindings: Env }>();

async function healthHandler(c: Context<{ Bindings: Env }>) {
  const deep = c.req.query("deep") === "true";
  const [r2Status, d1Status, authMcpStatus, mcpServiceStatus, tableStatuses] = await Promise.all([
    checkDependencyHealth(() => c.env.R2.head("__health_check__")),
    checkDependencyHealth(() => c.env.DB.prepare("SELECT 1").first()),
    deep ? checkFetchBindingHealth(c.env.AUTH_MCP) : Promise.resolve(undefined),
    deep ? checkFetchBindingHealth(c.env.MCP_SERVICE) : Promise.resolve(undefined),
    deep ? checkCriticalTables(c.env.DB, CRITICAL_TABLES) : Promise.resolve(undefined),
  ]);

  const payload = buildHealthPayload({
    r2: r2Status,
    d1: d1Status,
    ...(deep ? { authMcp: authMcpStatus, mcpService: mcpServiceStatus } : {}),
    ...(tableStatuses ? { tables: tableStatuses } : {}),
  });

  return c.json(payload, getHealthHttpStatus(payload));
}

health.get("/health", healthHandler);
health.get("/api/health", healthHandler);

export { health };
