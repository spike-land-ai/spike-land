import { describe, it, expect } from "vitest";
import {
  buildAetherSystemPrompt,
  buildClassifyPrompt,
  buildPlanPrompt,
  buildExtractPrompt,
} from "../core-logic/prompt-builder.js";
import type { UserMemory } from "../core-logic/types.js";

describe("buildAetherSystemPrompt", () => {
  it("returns stable prefix when no user state", () => {
    const memory: UserMemory = { lifeSummary: "", notes: [], currentGoals: [] };
    const { stablePrefix, dynamicSuffix } = buildAetherSystemPrompt(memory);
    expect(stablePrefix).toContain("You are Spike");
    expect(dynamicSuffix).toBe("");
  });

  it("includes life summary in dynamic suffix", () => {
    const memory: UserMemory = {
      lifeSummary: "Senior engineer at ACME",
      notes: [],
      currentGoals: [],
    };
    const { dynamicSuffix } = buildAetherSystemPrompt(memory);
    expect(dynamicSuffix).toContain("Senior engineer at ACME");
    expect(dynamicSuffix).toContain("About This User");
  });

  it("includes goals in dynamic suffix", () => {
    const memory: UserMemory = {
      lifeSummary: "",
      notes: [],
      currentGoals: ["Ship v2", "Learn Rust"],
    };
    const { dynamicSuffix } = buildAetherSystemPrompt(memory);
    expect(dynamicSuffix).toContain("Ship v2");
    expect(dynamicSuffix).toContain("Learn Rust");
    expect(dynamicSuffix).toContain("Current Goals");
  });

  it("includes notes in dynamic suffix", () => {
    const memory: UserMemory = {
      lifeSummary: "",
      notes: [
        {
          id: "1",
          trigger: "asks about TS",
          lesson: "prefers strict mode",
          confidence: 0.8,
          helpCount: 5,
          createdAt: Date.now(),
          lastUsedAt: Date.now(),
        },
      ],
      currentGoals: [],
    };
    const { dynamicSuffix } = buildAetherSystemPrompt(memory);
    expect(dynamicSuffix).toContain("prefers strict mode");
    expect(dynamicSuffix).toContain("0.80");
    expect(dynamicSuffix).toContain("Memory Notes");
  });
});

describe("buildClassifyPrompt", () => {
  it("returns classification instructions", () => {
    const prompt = buildClassifyPrompt();
    expect(prompt).toContain("classifier");
    expect(prompt).toContain("intent");
  });
});

describe("buildPlanPrompt", () => {
  it("includes intent and tools", () => {
    const prompt = buildPlanPrompt('{"intent":"task"}', ["tool_a", "tool_b"]);
    expect(prompt).toContain("task");
    expect(prompt).toContain("tool_a");
  });

  it("handles empty tools list", () => {
    const prompt = buildPlanPrompt("{}", []);
    expect(prompt).toContain("No tools available");
  });
});

describe("buildExtractPrompt", () => {
  it("returns extraction instructions", () => {
    const prompt = buildExtractPrompt();
    expect(prompt).toContain("memory extraction");
    expect(prompt).toContain("trigger");
    expect(prompt).toContain("lesson");
  });
});
