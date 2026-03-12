import { describe, expect, it } from "vitest";
import { buildChain, trimToBudget } from "../core-logic/composer.js";
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

describe("buildChain", () => {
  it("builds chain from leaf to root", () => {
    const prds = new Map<string, PrdDefinition>();
    prds.set("platform", makePrd({ id: "platform", level: "platform" }));
    prds.set(
      "domain:labs",
      makePrd({ id: "domain:labs", level: "domain", composesFrom: ["platform"] }),
    );
    prds.set("app:crdt", makePrd({ id: "app:crdt", level: "app", composesFrom: ["domain:labs"] }));

    const chain = buildChain("app:crdt", prds);
    expect(chain.map((p) => p.id)).toEqual(["platform", "domain:labs", "app:crdt"]);
  });

  it("deduplicates diamond paths", () => {
    const prds = new Map<string, PrdDefinition>();
    prds.set("platform", makePrd({ id: "platform", level: "platform" }));
    prds.set("domain:a", makePrd({ id: "domain:a", level: "domain", composesFrom: ["platform"] }));
    prds.set("domain:b", makePrd({ id: "domain:b", level: "domain", composesFrom: ["platform"] }));
    prds.set(
      "app:x",
      makePrd({ id: "app:x", level: "app", composesFrom: ["domain:a", "domain:b"] }),
    );

    const chain = buildChain("app:x", prds);
    const ids = chain.map((p) => p.id);
    // Platform should appear exactly once despite being reached via both domains
    expect(ids.filter((id) => id === "platform")).toHaveLength(1);
    expect(chain).toHaveLength(4);
  });

  it("handles missing parent gracefully", () => {
    const prds = new Map<string, PrdDefinition>();
    prds.set(
      "app:orphan",
      makePrd({ id: "app:orphan", level: "app", composesFrom: ["nonexistent"] }),
    );

    const chain = buildChain("app:orphan", prds);
    expect(chain.map((p) => p.id)).toEqual(["app:orphan"]);
  });

  it("sorts by level hierarchy", () => {
    const prds = new Map<string, PrdDefinition>();
    prds.set("platform", makePrd({ id: "platform", level: "platform" }));
    prds.set(
      "route:/apps",
      makePrd({ id: "route:/apps", level: "route", composesFrom: ["platform"] }),
    );
    prds.set("domain:d", makePrd({ id: "domain:d", level: "domain", composesFrom: ["platform"] }));
    prds.set(
      "app:a",
      makePrd({
        id: "app:a",
        level: "app",
        composesFrom: ["route:/apps", "domain:d"],
      }),
    );

    const chain = buildChain("app:a", prds);
    const levels = chain.map((p) => p.level);
    expect(levels).toEqual(["platform", "domain", "route", "app"]);
  });
});

describe("trimToBudget", () => {
  it("returns chain unchanged if within budget", () => {
    const chain = [
      makePrd({ id: "platform", level: "platform", tokenEstimate: 200 }),
      makePrd({ id: "domain:d", level: "domain", tokenEstimate: 300 }),
    ];
    const trimmed = trimToBudget(chain, 2000);
    expect(trimmed).toHaveLength(2);
  });

  it("drops app-level PRDs first when over budget", () => {
    const chain = [
      makePrd({ id: "platform", level: "platform", tokenEstimate: 200 }),
      makePrd({ id: "domain:d", level: "domain", tokenEstimate: 300 }),
      makePrd({ id: "route:/r", level: "route", tokenEstimate: 200 }),
      makePrd({ id: "app:a", level: "app", tokenEstimate: 400 }),
      makePrd({ id: "app:b", level: "app", tokenEstimate: 400 }),
    ];
    const trimmed = trimToBudget(chain, 800);
    // Should drop both apps (400+400) to get to 700 (200+300+200)
    expect(trimmed.map((p) => p.level)).not.toContain("app");
    expect(trimmed.some((p) => p.level === "platform")).toBe(true);
  });

  it("never drops platform", () => {
    const chain = [
      makePrd({ id: "platform", level: "platform", tokenEstimate: 500 }),
      makePrd({ id: "domain:d", level: "domain", tokenEstimate: 500 }),
      makePrd({ id: "app:a", level: "app", tokenEstimate: 500 }),
    ];
    const trimmed = trimToBudget(chain, 100);
    expect(trimmed.some((p) => p.level === "platform")).toBe(true);
  });

  it("drops route before domain when apps insufficient", () => {
    const chain = [
      makePrd({ id: "platform", level: "platform", tokenEstimate: 200 }),
      makePrd({ id: "domain:d", level: "domain", tokenEstimate: 300 }),
      makePrd({ id: "route:/r", level: "route", tokenEstimate: 300 }),
    ];
    const trimmed = trimToBudget(chain, 400);
    // Should drop route (300), leaving platform(200)+domain(300)=500, still over
    // Then drop domain(300), leaving platform(200)
    const ids = trimmed.map((p) => p.id);
    expect(ids).toContain("platform");
  });
});
