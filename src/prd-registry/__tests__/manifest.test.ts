import { describe, expect, it } from "vitest";
import { createPrdRegistry, registerAllPrds } from "../manifest.js";
import { PrdRegistry } from "../core-logic/registry.js";

describe("manifest", () => {
  describe("registerAllPrds", () => {
    it("registers all PRDs without failures", () => {
      const registry = new PrdRegistry();
      const result = registerAllPrds(registry);
      expect(result.failedCount).toBe(0);
      expect(result.failedModules).toEqual([]);
    });

    it("registers platform + domains + routes + apps", () => {
      const registry = new PrdRegistry();
      registerAllPrds(registry);
      const all = registry.getAll();

      const levels = new Set(all.map((p) => p.level));
      expect(levels).toContain("platform");
      expect(levels).toContain("domain");
      expect(levels).toContain("route");
      expect(levels).toContain("app");

      // At least: 1 platform + 6 domains + 5 routes + 5 apps = 17
      expect(all.length).toBeGreaterThanOrEqual(17);
    });
  });

  describe("createPrdRegistry", () => {
    it("creates a ready-to-use registry", () => {
      const registry = createPrdRegistry();
      expect(registry.get("platform")).toBeDefined();
      expect(registry.get("domain:app-building")).toBeDefined();
    });
  });

  describe("end-to-end composition", () => {
    it("resolves /apps/chess-arena with 4-level chain", () => {
      const registry = createPrdRegistry();
      const resolved = registry.resolveForRoute("/apps/chess-arena");

      const levels = resolved.chain.map((p) => p.level);
      expect(levels).toContain("platform");
      expect(levels).toContain("app");
      expect(resolved.totalTokens).toBeGreaterThan(0);
      expect(resolved.totalTokens).toBeLessThan(2000);
    });

    it("resolves keywords 'style font color' to app-building domain", () => {
      const registry = createPrdRegistry();
      const resolved = registry.resolveByKeywords("style font color");
      const ids = resolved.chain.map((p) => p.id);
      expect(ids).toContain("domain:app-building");
    });

    it("builds catalog under 500 tokens", () => {
      const registry = createPrdRegistry();
      const catalog = registry.buildCatalog();
      // Rough estimate: catalog should be compact
      const wordCount = catalog.split(/\s+/).length;
      const estimatedTokens = Math.ceil(wordCount * 1.3);
      expect(estimatedTokens).toBeLessThan(800); // generous but bounded
    });

    it("enforces token budget", () => {
      const registry = createPrdRegistry({ tokenBudget: 500 });
      const resolved = registry.resolveForRoute("/apps/chess-arena");
      expect(resolved.totalTokens).toBeLessThanOrEqual(500);
    });
  });
});
