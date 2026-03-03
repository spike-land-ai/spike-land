import { describe, expect, it } from "vitest";
import { filterTools, matchesAnyGlob, matchesGlob } from "../../util/glob.js";

describe("matchesGlob", () => {
  it("matches exact names", () => {
    expect(matchesGlob("read_file", "read_file")).toBe(true);
  });

  it("does not match different names", () => {
    expect(matchesGlob("write_file", "read_file")).toBe(false);
  });

  it("matches trailing wildcard", () => {
    expect(matchesGlob("read_file", "read_*")).toBe(true);
    expect(matchesGlob("read_dir", "read_*")).toBe(true);
    expect(matchesGlob("write_file", "read_*")).toBe(false);
  });

  it("matches leading wildcard", () => {
    expect(matchesGlob("read_file", "*_file")).toBe(true);
    expect(matchesGlob("write_file", "*_file")).toBe(true);
    expect(matchesGlob("read_dir", "*_file")).toBe(false);
  });

  it("matches middle wildcard", () => {
    expect(matchesGlob("run_all_tests", "run_*_tests")).toBe(true);
    expect(matchesGlob("run_tests", "run_*_tests")).toBe(false);
  });

  it("matches double wildcard", () => {
    expect(matchesGlob("anything", "*")).toBe(true);
    expect(matchesGlob("", "*")).toBe(true);
  });

  it("handles special regex characters in patterns", () => {
    expect(matchesGlob("file.read", "file.read")).toBe(true);
    expect(matchesGlob("file_read", "file.read")).toBe(false);
  });
});

describe("matchesAnyGlob", () => {
  it("returns true if any pattern matches", () => {
    expect(matchesAnyGlob("read_file", ["write_*", "read_*"])).toBe(true);
  });

  it("returns false if no pattern matches", () => {
    expect(matchesAnyGlob("delete_file", ["write_*", "read_*"])).toBe(false);
  });

  it("returns false for empty patterns", () => {
    expect(matchesAnyGlob("anything", [])).toBe(false);
  });
});

describe("filterTools", () => {
  const tools = [
    { name: "read_file", description: "Read a file" },
    { name: "write_file", description: "Write a file" },
    { name: "search_code", description: "Search code" },
    { name: "dangerous_delete", description: "Dangerous delete" },
    { name: "run_tests", description: "Run tests" },
  ];

  it("returns all tools when no config", () => {
    expect(filterTools(tools)).toEqual(tools);
    expect(filterTools(tools, undefined)).toEqual(tools);
  });

  it("returns all tools when config is empty", () => {
    expect(filterTools(tools, {})).toEqual(tools);
  });

  it("filters by allowed patterns", () => {
    const result = filterTools(tools, { allowed: ["read_*", "search_*"] });
    expect(result.map((t) => t.name)).toEqual(["read_file", "search_code"]);
  });

  it("filters by blocked patterns", () => {
    const result = filterTools(tools, { blocked: ["dangerous_*"] });
    expect(result.map((t) => t.name)).toEqual([
      "read_file",
      "write_file",
      "search_code",
      "run_tests",
    ]);
  });

  it("applies allowed first, then blocked", () => {
    const result = filterTools(tools, {
      allowed: ["read_*", "write_*"],
      blocked: ["write_*"],
    });
    expect(result.map((t) => t.name)).toEqual(["read_file"]);
  });

  it("returns empty when allowed matches nothing", () => {
    const result = filterTools(tools, { allowed: ["nonexistent_*"] });
    expect(result).toEqual([]);
  });

  it("returns all when blocked matches nothing", () => {
    const result = filterTools(tools, { blocked: ["nonexistent_*"] });
    expect(result).toEqual(tools);
  });
});
