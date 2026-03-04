import { describe, expect, it } from "vitest";
import { formatToolList } from "../../../../src/spike-cli/shell/formatter.js";

describe("formatToolList", () => {
  it("returns dim '(no tools)' for empty array", () => {
    const result = formatToolList([]);
    expect(result).toContain("no tools");
  });

  it("formats a tool with description", () => {
    const result = formatToolList([{ name: "my_tool", description: "Does something" }]);
    expect(result).toContain("my_tool");
    expect(result).toContain("Does something");
  });

  it("handles a tool without description (undefined)", () => {
    const result = formatToolList([{ name: "nameless" }]);
    expect(result).toContain("nameless");
    // description is undefined, falls back to empty string - should not throw
  });

  it("aligns multiple tools by name length", () => {
    const result = formatToolList([
      { name: "short", description: "a" },
      { name: "very_long_name", description: "b" },
    ]);
    expect(result).toContain("short");
    expect(result).toContain("very_long_name");
  });
});
