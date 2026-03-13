import { PrdRegistry } from "./core-logic/registry.js";
import type { PrdDefinition } from "./core-logic/types.js";

// Platform
import { platformPrd } from "./prds/platform.js";

// Domains
import { aiAutomationDomain } from "./prds/domains/ai-automation.js";
import { appBuildingDomain } from "./prds/domains/app-building.js";
import { contentDomain } from "./prds/domains/content.js";
import { labsDomain } from "./prds/domains/labs.js";
import { learningDomain } from "./prds/domains/learning.js";
import { platformInfraDomain } from "./prds/domains/platform-infra.js";
import { aetherDomain } from "./prds/domains/aether.js";

// Routes
import { appsRoute } from "./prds/routes/apps.js";
import { blogRoute } from "./prds/routes/blog.js";
import { dashboardRoute } from "./prds/routes/dashboard.js";
import { pricingRoute } from "./prds/routes/pricing.js";
import { vibeCodeRoute } from "./prds/routes/vibe-code.js";

// Apps
import { aiGatewayPrd } from "./prds/apps/ai-gateway.js";
import { chessArenaPrd } from "./prds/apps/chess-arena.js";
import { crdtLabPrd } from "./prds/apps/crdt-lab.js";
import { imageStudioPrd } from "./prds/apps/image-studio.js";
import { qaStudioPrd } from "./prds/apps/qa-studio.js";

const ALL_PRDS: PrdDefinition[] = [
  // Platform (always first)
  platformPrd,
  // Domains
  appBuildingDomain,
  aiAutomationDomain,
  labsDomain,
  learningDomain,
  platformInfraDomain,
  contentDomain,
  aetherDomain,
  // Routes
  appsRoute,
  blogRoute,
  dashboardRoute,
  vibeCodeRoute,
  pricingRoute,
  // Apps
  chessArenaPrd,
  aiGatewayPrd,
  imageStudioPrd,
  qaStudioPrd,
  crdtLabPrd,
];

let registrationFailures: string[] = [];

function safeRegister(registry: PrdRegistry, label: string, prd: PrdDefinition): void {
  try {
    registry.register(prd);
  } catch (err) {
    registrationFailures.push(label);
    console.error(`[PRD] Failed to register ${label}:`, err);
  }
}

/**
 * Register all PRDs into a registry instance.
 * Uses safeRegister() for error isolation (same pattern as MCP manifest.ts).
 */
export function registerAllPrds(registry: PrdRegistry): {
  failedCount: number;
  failedModules: string[];
} {
  registrationFailures = [];

  for (const prd of ALL_PRDS) {
    safeRegister(registry, prd.id, prd);
  }

  return {
    failedCount: registrationFailures.length,
    failedModules: [...registrationFailures],
  };
}

/**
 * Create a fully-loaded registry with all PRDs registered.
 * Convenience for consumers that just want a ready-to-use registry.
 */
export function createPrdRegistry(options?: { tokenBudget?: number }): PrdRegistry {
  const registry = new PrdRegistry(options);
  registerAllPrds(registry);
  return registry;
}
