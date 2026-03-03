import { describe, expect, it } from "vitest";
import { fuzzyFilter, fuzzyScore } from "../../util/fuzzy.js";

describe("fuzzyScore", () => {
  it("returns 0 for empty query", () => {
    expect(fuzzyScore("", "hello")).toBe(0);
  });

  it("returns 0 for empty target", () => {
    expect(fuzzyScore("abc", "")).toBe(0);
  });

  it("returns 0 when query chars are not found", () => {
    expect(fuzzyScore("xyz", "hello")).toBe(0);
  });

  it("scores exact prefix match highest", () => {
    const prefixScore = fuzzyScore("run", "run_tests");
    const middleScore = fuzzyScore("run", "prerun_tests");
    expect(prefixScore).toBeGreaterThan(middleScore);
  });

  it("scores consecutive chars higher than scattered", () => {
    const consecutive = fuzzyScore("abc", "abcdef");
    const scattered = fuzzyScore("abc", "axbxcx");
    expect(consecutive).toBeGreaterThan(scattered);
  });

  it("gives word boundary bonus", () => {
    // "ij" matches "image_jpeg" at word boundaries (i at start, j after _)
    const boundaryScore = fuzzyScore("ij", "image_jpeg");
    // "ij" matches "xxijxx" without boundary bonus
    const noBoundaryScore = fuzzyScore("ij", "xxijxx");
    expect(boundaryScore).toBeGreaterThan(noBoundaryScore);
  });

  it("handles camelCase word boundaries", () => {
    const score = fuzzyScore("gN", "getServerNames");
    expect(score).toBeGreaterThan(0);
  });

  it("is case-insensitive", () => {
    expect(fuzzyScore("ABC", "abcdef")).toBeGreaterThan(0);
    expect(fuzzyScore("abc", "ABCDEF")).toBeGreaterThan(0);
  });

  it("returns 0 when query is longer than matches available", () => {
    expect(fuzzyScore("abcdef", "abc")).toBe(0);
  });
});

describe("fuzzyFilter", () => {
  const items = ["run_tests", "navigate", "reconnect", "read_file", "render"];

  it("returns empty for empty query", () => {
    expect(fuzzyFilter("", items, (x) => x)).toEqual([]);
  });

  it("filters items that match", () => {
    const result = fuzzyFilter("run", items, (x) => x);
    expect(result).toContain("run_tests");
    expect(result).not.toContain("navigate");
  });

  it("sorts by score descending", () => {
    const result = fuzzyFilter("re", items, (x) => x);
    // "reconnect" and "read_file" and "render" all match "re"
    // All start with "re" so they should all be present
    expect(result.length).toBeGreaterThanOrEqual(2);
    // First result should have highest score
    const scores = result.map((item) => fuzzyScore("re", item));
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i - 1]).toBeGreaterThanOrEqual(scores[i]);
    }
  });

  it("works with custom getText", () => {
    const objects = [
      { name: "run_tests", id: 1 },
      { name: "navigate", id: 2 },
    ];
    const result = fuzzyFilter("run", objects, (o) => o.name);
    expect(result).toEqual([{ name: "run_tests", id: 1 }]);
  });
});
