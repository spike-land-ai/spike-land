import { describe, expect, it, beforeEach } from "vitest";
import { PrdRegistry } from "../core-logic/registry.js";
import type { PrdDefinition } from "../core-logic/types.js";

function makePrd(
  overrides: Partial<PrdDefinition> & Pick<PrdDefinition, "id" | "level">,
): PrdDefinition {
  return {
    name: overrides.id,
    summary: `Summary for ${overrides.id}`,
    constraints: [],
    acceptance: [],
    toolCategories: [],
    tools: [],
    composesFrom: [],
    routePatterns: [],
    keywords: [],
    tokenEstimate: 100,
    version: "1.0.0",
    ...overrides,
  };
}

describe("PrdRegistry", () => {
  let registry: PrdRegistry;

  beforeEach(() => {
    registry = new PrdRegistry();
  });

  describe("register", () => {
    it("registers and retrieves a PRD", () => {
      const prd = makePrd({ id: "platform", level: "platform" });
      registry.register(prd);
      expect(registry.get("platform")).toEqual(prd);
    });

    it("validates PRD on registration", () => {
      expect(() =>
        registry.register({
          id: "",
          level: "platform",
          name: "Bad",
          summary: "x",
          tokenEstimate: 100,
        } as PrdDefinition),
      ).toThrow();
    });

    it("rejects summary over 120 chars", () => {
      expect(() =>
        registry.register(makePrd({ id: "long", level: "platform", summary: "x".repeat(121) })),
      ).toThrow();
    });
  });

  describe("resolveForRoute", () => {
    it("matches exact route", () => {
      const platform = makePrd({ id: "platform", level: "platform" });
      const route = makePrd({
        id: "route:/apps",
        level: "route",
        routePatterns: ["/apps"],
        composesFrom: ["platform"],
      });
      registry.register(platform);
      registry.register(route);

      const resolved = registry.resolveForRoute("/apps");
      expect(resolved.chain.map((p) => p.id)).toEqual(["platform", "route:/apps"]);
    });

    it("matches wildcard route", () => {
      const platform = makePrd({ id: "platform", level: "platform" });
      const route = makePrd({
        id: "route:/apps",
        level: "route",
        routePatterns: ["/apps/*"],
        composesFrom: ["platform"],
      });
      const app = makePrd({
        id: "app:chess",
        level: "app",
        routePatterns: ["/apps/chess"],
        composesFrom: ["route:/apps"],
      });
      registry.register(platform);
      registry.register(route);
      registry.register(app);

      const resolved = registry.resolveForRoute("/apps/chess");
      expect(resolved.chain.map((p) => p.id)).toEqual(["platform", "route:/apps", "app:chess"]);
    });

    it("returns platform only for unknown route", () => {
      const platform = makePrd({ id: "platform", level: "platform" });
      registry.register(platform);

      const resolved = registry.resolveForRoute("/unknown");
      expect(resolved.chain.map((p) => p.id)).toEqual(["platform"]);
    });
  });

  describe("resolveByKeywords", () => {
    it("matches keywords from text", () => {
      const platform = makePrd({ id: "platform", level: "platform" });
      const domain = makePrd({
        id: "domain:app-building",
        level: "domain",
        keywords: ["style", "font", "color", "design"],
        composesFrom: ["platform"],
      });
      registry.register(platform);
      registry.register(domain);

      const resolved = registry.resolveByKeywords("style font color");
      expect(resolved.chain.map((p) => p.id)).toContain("domain:app-building");
    });

    it("limits results to max parameter", () => {
      const platform = makePrd({ id: "platform", level: "platform" });
      registry.register(platform);
      for (let i = 0; i < 5; i++) {
        registry.register(
          makePrd({
            id: `domain:d${i}`,
            level: "domain",
            keywords: ["shared"],
            composesFrom: ["platform"],
          }),
        );
      }

      const resolved = registry.resolveByKeywords("shared", 2);
      // Should have at most 2 domain PRDs + platform
      const domainCount = resolved.chain.filter((p) => p.level === "domain").length;
      expect(domainCount).toBeLessThanOrEqual(2);
    });
  });

  describe("resolveForApp", () => {
    it("resolves app with full parent chain", () => {
      const platform = makePrd({ id: "platform", level: "platform" });
      const domain = makePrd({
        id: "domain:app-building",
        level: "domain",
        composesFrom: ["platform"],
      });
      const route = makePrd({
        id: "route:/apps",
        level: "route",
        routePatterns: ["/apps/*"],
        composesFrom: ["domain:app-building"],
      });
      const app = makePrd({
        id: "app:chess-arena",
        level: "app",
        composesFrom: ["route:/apps"],
        tools: ["chess_create_game"],
        toolCategories: ["chess-game"],
      });
      registry.register(platform);
      registry.register(domain);
      registry.register(route);
      registry.register(app);

      const resolved = registry.resolveForApp("chess-arena");
      expect(resolved.chain).toHaveLength(4);
      expect(resolved.tools).toContain("chess_create_game");
      expect(resolved.toolCategories).toContain("chess-game");
    });
  });

  describe("resolveForToolCategory", () => {
    it("finds PRDs by tool category", () => {
      const platform = makePrd({
        id: "platform",
        level: "platform",
        toolCategories: ["gateway-meta"],
      });
      registry.register(platform);

      const resolved = registry.resolveForToolCategory("gateway-meta");
      expect(resolved.chain.map((p) => p.id)).toContain("platform");
    });
  });

  describe("buildCatalog", () => {
    it("generates compact catalog text", () => {
      registry.register(makePrd({ id: "platform", level: "platform" }));
      registry.register(
        makePrd({ id: "domain:labs", level: "domain", composesFrom: ["platform"] }),
      );
      registry.register(makePrd({ id: "app:chess", level: "app", composesFrom: ["domain:labs"] }));

      const catalog = registry.buildCatalog();
      expect(catalog).toContain("# PRD Catalog");
      expect(catalog).toContain("platform");
      expect(catalog).toContain("domain:labs");
      expect(catalog).toContain("app:chess");
    });
  });
});
