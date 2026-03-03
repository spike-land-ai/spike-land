import { describe, expect, it } from "vitest";
import { namespaceTool, parseNamespacedTool, stripNamespace } from "../../multiplexer/namespace.js";

describe("namespaceTool", () => {
  it("prefixes tool name with server name and default separator", () => {
    expect(namespaceTool("vitest", "run_tests")).toBe("vitest__run_tests");
  });

  it("uses custom separator", () => {
    expect(namespaceTool("vitest", "run_tests", "::")).toBe("vitest::run_tests");
  });

  it("handles empty tool name", () => {
    expect(namespaceTool("server", "")).toBe("server__");
  });
});

describe("parseNamespacedTool", () => {
  const servers = ["vitest", "playwright", "error-mcp"];

  it("parses a simple namespaced tool", () => {
    expect(parseNamespacedTool("vitest__run_tests", servers)).toEqual({
      serverName: "vitest",
      toolName: "run_tests",
    });
  });

  it("parses with hyphenated server name", () => {
    expect(parseNamespacedTool("error-mcp__list_issues", servers)).toEqual({
      serverName: "error-mcp",
      toolName: "list_issues",
    });
  });

  it("returns null for unknown server prefix", () => {
    expect(parseNamespacedTool("unknown__tool", servers)).toBeNull();
  });

  it("uses greedy matching (longest server name first)", () => {
    const ambiguousServers = ["test", "test_server"];
    expect(parseNamespacedTool("test_server__do_thing", ambiguousServers)).toEqual({
      serverName: "test_server",
      toolName: "do_thing",
    });
  });

  it("handles custom separator", () => {
    expect(parseNamespacedTool("vitest::run_tests", servers, "::")).toEqual({
      serverName: "vitest",
      toolName: "run_tests",
    });
  });

  it("returns null when no separator found", () => {
    expect(parseNamespacedTool("notnamespaced", servers)).toBeNull();
  });
});

describe("stripNamespace", () => {
  it("strips matching prefix", () => {
    expect(stripNamespace("vitest__run_tests", "vitest")).toBe("run_tests");
  });

  it("returns unchanged if prefix doesn't match", () => {
    expect(stripNamespace("other__run_tests", "vitest")).toBe("other__run_tests");
  });

  it("works with custom separator", () => {
    expect(stripNamespace("vitest::run_tests", "vitest", "::")).toBe("run_tests");
  });
});
