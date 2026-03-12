import { describe, it, expect } from "vitest";
import { evaluateExperiment } from "../../src/edge-api/main/lazy-imports/experiment-engine";

describe("Tool-First Benchmark: evaluate_experiment", () => {
  it("evaluates a winning variant correctly in milliseconds without browser overhead", async () => {
    // This replicates the exact logic the MCP tool uses, running natively in Vitest.
    const result = evaluateExperiment([
      { id: "control", impressions: 1000, donations: 20 }, // 2%
      { id: "variant-a", impressions: 1000, donations: 50 }, // 5%
    ]);

    expect(result.shouldGraduate).toBe(true);
    expect(result.bestVariant).toBe("variant-a");
    expect(result.improvement).toBeGreaterThan(0.1);
  });
});
