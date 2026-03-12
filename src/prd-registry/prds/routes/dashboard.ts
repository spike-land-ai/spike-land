import type { PrdDefinition } from "../../core-logic/types.js";

export const dashboardRoute: PrdDefinition = {
  id: "route:/dashboard",
  level: "route",
  name: "Dashboard & Cockpit",
  summary: "CEO dashboard with system health, activity stream, error feed, and agent management",
  purpose:
    "Central control surface for platform operators. Shows system overview, health checks, recent errors, agent activity, and key metrics widgets.",
  constraints: [
    "Dashboard must auto-refresh every 30s",
    "Error feed shows last 50 errors with severity",
    "Admin-only sections gated by role check",
  ],
  acceptance: [
    "Dashboard loads all widgets within 2s",
    "Health status accurately reflects current system state",
  ],
  toolCategories: ["dash", "admin", "errors", "env", "reports"],
  tools: [],
  composesFrom: ["platform", "domain:platform-infra"],
  routePatterns: ["/dashboard", "/cockpit"],
  keywords: ["dashboard", "cockpit", "admin", "health", "monitor", "overview"],
  tokenEstimate: 200,
  version: "1.0.0",
};
