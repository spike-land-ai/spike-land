import { describe, expect, it, vi } from "vitest";
import { AliasResolver } from "../../alias/resolver.js";
import type { AliasConfig } from "../../alias/types.js";

function makeConfig(overrides?: Partial<AliasConfig>): AliasConfig {
  return {
    version: 1,
    commands: {},
    tools: {},
    servers: {},
    composite: {},
    ...overrides,
  };
}

describe("AliasResolver", () => {
  describe("resolveCommand", () => {
    it("resolves a command alias", () => {
      const resolver = new AliasResolver(makeConfig({ commands: { s: "serve" } }));
      const result = resolver.resolveCommand("s");
      expect(result).toEqual({ type: "command", command: "serve" });
    });

    it("returns none for unknown command", () => {
      const resolver = new AliasResolver(makeConfig());
      expect(resolver.resolveCommand("unknown")).toEqual({ type: "none" });
    });
  });

  describe("resolveTool", () => {
    it("resolves a tool alias", () => {
      const resolver = new AliasResolver(makeConfig({ tools: { rt: "vitest__run_tests" } }));
      const result = resolver.resolveTool("rt");
      expect(result).toEqual({ type: "tool", toolName: "vitest__run_tests" });
    });

    it("resolves a composite alias with default args", () => {
      const resolver = new AliasResolver(
        makeConfig({
          composite: {
            test: { tool: "vitest__run_tests", args: { filter: "*.test.ts" } },
          },
        }),
      );
      const result = resolver.resolveTool("test");
      expect(result).toEqual({
        type: "composite",
        toolName: "vitest__run_tests",
        args: { filter: "*.test.ts" },
      });
    });

    it("composite without args returns empty args object", () => {
      const resolver = new AliasResolver(
        makeConfig({ composite: { test: { tool: "vitest__run_tests" } } }),
      );
      const result = resolver.resolveTool("test");
      expect(result).toEqual({
        type: "composite",
        toolName: "vitest__run_tests",
        args: {},
      });
    });

    it("real tool name beats tool alias", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const resolver = new AliasResolver(
        makeConfig({ tools: { vitest__run_tests: "other__tool" } }),
        new Set(["vitest__run_tests"]),
      );
      const result = resolver.resolveTool("vitest__run_tests");
      expect(result).toEqual({ type: "tool", toolName: "vitest__run_tests" });
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("shadows a real tool"));
      consoleSpy.mockRestore();
    });

    it("real tool name beats composite alias", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const resolver = new AliasResolver(
        makeConfig({
          composite: { vitest__run_tests: { tool: "other", args: { a: 1 } } },
        }),
        new Set(["vitest__run_tests"]),
      );
      const result = resolver.resolveTool("vitest__run_tests");
      expect(result).toEqual({ type: "tool", toolName: "vitest__run_tests" });
      consoleSpy.mockRestore();
    });

    it("returns none for unknown tool", () => {
      const resolver = new AliasResolver(makeConfig());
      expect(resolver.resolveTool("unknown")).toEqual({ type: "none" });
    });
  });

  describe("resolveServer", () => {
    it("resolves a server alias", () => {
      const resolver = new AliasResolver(makeConfig({ servers: { prod: "production" } }));
      expect(resolver.resolveServer("prod")).toBe("production");
    });

    it("returns null for unknown server", () => {
      const resolver = new AliasResolver(makeConfig());
      expect(resolver.resolveServer("unknown")).toBeNull();
    });
  });

  describe("getAliasNames", () => {
    it("returns all alias names across sections", () => {
      const resolver = new AliasResolver(
        makeConfig({
          commands: { s: "serve" },
          tools: { rt: "vitest__run_tests" },
          servers: { prod: "production" },
          composite: { test: { tool: "vitest__run_tests" } },
        }),
      );
      const names = resolver.getAliasNames();
      expect(names).toContain("s");
      expect(names).toContain("rt");
      expect(names).toContain("prod");
      expect(names).toContain("test");
      expect(names).toHaveLength(4);
    });
  });

  describe("isReserved", () => {
    it("returns true for reserved names", () => {
      const resolver = new AliasResolver(makeConfig());
      expect(resolver.isReserved("help")).toBe(true);
      expect(resolver.isReserved("quit")).toBe(true);
      expect(resolver.isReserved("exit")).toBe(true);
      expect(resolver.isReserved("servers")).toBe(true);
      expect(resolver.isReserved("tools")).toBe(true);
      expect(resolver.isReserved("call")).toBe(true);
      expect(resolver.isReserved("reconnect")).toBe(true);
      expect(resolver.isReserved("toolsets")).toBe(true);
      expect(resolver.isReserved("load")).toBe(true);
      expect(resolver.isReserved("alias")).toBe(true);
    });

    it("returns false for non-reserved names", () => {
      const resolver = new AliasResolver(makeConfig());
      expect(resolver.isReserved("myalias")).toBe(false);
      expect(resolver.isReserved("serve")).toBe(false);
    });
  });
});
