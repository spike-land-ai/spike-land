import { describe, expect, it } from "vitest";
import {
  estimateTokens,
  serializePrd,
  serializeChain,
  buildCatalogText,
  resolveFromChain,
} from "../core-logic/serializer.js";
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

describe("estimateTokens", () => {
  it("estimates tokens from word count", () => {
    const text = "hello world this is a test"; // 6 words
    const tokens = estimateTokens(text);
    expect(tokens).toBe(Math.ceil(6 * 1.3)); // 8
  });

  it("handles empty string", () => {
    expect(estimateTokens("")).toBe(0);
  });
});

describe("serializePrd", () => {
  it("includes level and id in header", () => {
    const prd = makePrd({ id: "platform", level: "platform" });
    const output = serializePrd(prd);
    expect(output).toContain("[PRD:platform:platform]");
  });

  it("includes constraints and acceptance", () => {
    const prd = makePrd({
      id: "test",
      level: "domain",
      constraints: ["no any type", "strict mode"],
      acceptance: ["tests pass"],
    });
    const output = serializePrd(prd);
    expect(output).toContain("Constraints: no any type; strict mode");
    expect(output).toContain("Acceptance: tests pass");
  });

  it("includes tools and categories", () => {
    const prd = makePrd({
      id: "test",
      level: "app",
      toolCategories: ["chess-game"],
      tools: ["chess_create_game"],
    });
    const output = serializePrd(prd);
    expect(output).toContain("Tool categories: chess-game");
    expect(output).toContain("Tools: chess_create_game");
  });

  it("omits empty sections", () => {
    const prd = makePrd({ id: "minimal", level: "platform" });
    const output = serializePrd(prd);
    expect(output).not.toContain("Constraints:");
    expect(output).not.toContain("Tools:");
  });
});

describe("serializeChain", () => {
  it("joins PRDs with separator", () => {
    const chain = [
      makePrd({ id: "platform", level: "platform" }),
      makePrd({ id: "domain:labs", level: "domain" }),
    ];
    const output = serializeChain(chain);
    expect(output).toContain("---");
    expect(output).toContain("[PRD:platform:platform]");
    expect(output).toContain("[PRD:domain:domain:labs]");
  });
});

describe("buildCatalogText", () => {
  it("groups PRDs by level", () => {
    const prds = [
      makePrd({ id: "platform", level: "platform" }),
      makePrd({ id: "domain:labs", level: "domain" }),
      makePrd({ id: "app:chess", level: "app" }),
    ];
    const catalog = buildCatalogText(prds);
    expect(catalog).toContain("## platform");
    expect(catalog).toContain("## domain");
    expect(catalog).toContain("## app");
    expect(catalog).toContain("- platform: Summary for platform");
  });
});

describe("resolveFromChain", () => {
  it("merges constraints and tools from chain", () => {
    const chain = [
      makePrd({
        id: "platform",
        level: "platform",
        constraints: ["strict mode"],
        toolCategories: ["gateway-meta"],
        tokenEstimate: 200,
      }),
      makePrd({
        id: "app:chess",
        level: "app",
        constraints: ["validate moves"],
        toolCategories: ["chess-game"],
        tools: ["chess_create_game"],
        tokenEstimate: 400,
      }),
    ];

    const resolved = resolveFromChain(chain);
    expect(resolved.constraints).toEqual(["strict mode", "validate moves"]);
    expect(resolved.toolCategories).toEqual(["gateway-meta", "chess-game"]);
    expect(resolved.tools).toEqual(["chess_create_game"]);
    expect(resolved.totalTokens).toBe(600);
    expect(resolved.serialized).toContain("[PRD:platform:platform]");
    expect(resolved.serialized).toContain("[PRD:app:app:chess]");
  });

  it("deduplicates tool categories", () => {
    const chain = [
      makePrd({ id: "a", level: "platform", toolCategories: ["x", "y"] }),
      makePrd({ id: "b", level: "domain", toolCategories: ["y", "z"] }),
    ];
    const resolved = resolveFromChain(chain);
    expect(resolved.toolCategories).toEqual(["x", "y", "z"]);
  });
});
