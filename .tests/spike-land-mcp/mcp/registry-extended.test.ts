/**
 * Extended tests for mcp/registry.ts — covers uncovered branches:
 * callToolDirect tier gating, filterByStability, enableByStability,
 * disableCategory, registerBuilt, restoreCategories, getToolDefinitions with options.
 */
import { describe, expect, it, vi } from "vitest";
import { ToolRegistry } from "../../../src/spike-land-mcp/mcp/registry";
import type { McpServer, RegisteredTool } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

function createMockMcpServer(): McpServer {
  return {
    registerTool: vi.fn((_name: string, _config: unknown, handler: unknown): RegisteredTool => {
      let isEnabled = true;
      return {
        enable: () => { isEnabled = true; },
        disable: () => { isEnabled = false; },
        get enabled() { return isEnabled; },
        update: vi.fn(),
        remove: vi.fn(),
        handler: handler as RegisteredTool["handler"],
      };
    }),
  } as unknown as McpServer;
}

function registerTool(
  registry: ToolRegistry,
  opts: {
    name: string;
    category?: string;
    stability?: "stable" | "beta" | "experimental" | "deprecated";
    requiredTier?: "free" | "pro" | "business";
    alwaysEnabled?: boolean;
    version?: string;
    examples?: Array<{ name: string; input: Record<string, unknown>; description: string }>;
    inputSchema?: Record<string, unknown>;
  },
) {
  registry.register({
    name: opts.name,
    description: `Description of ${opts.name}`,
    category: opts.category ?? "test-cat",
    tier: "free",
    stability: opts.stability,
    requiredTier: opts.requiredTier,
    alwaysEnabled: opts.alwaysEnabled,
    version: opts.version,
    examples: opts.examples,
    inputSchema: opts.inputSchema as Record<string, ReturnType<typeof z.string>>,
    handler: async () => ({ content: [{ type: "text" as const, text: "result" }] }),
  });
}

describe("ToolRegistry.callToolDirect - tier gating", () => {
  it("blocks access when user tier is below required tier", async () => {
    const server = createMockMcpServer();
    const registry = new ToolRegistry(server, "user-1");

    registerTool(registry, { name: "pro_tool", requiredTier: "pro", alwaysEnabled: true });

    const result = await registry.callToolDirect("pro_tool", {}, "free");

    expect(result.isError).toBe(true);
    expect((result.content[0] as { text: string }).text).toContain("pro tier");
  });

  it("allows access when user tier meets required tier", async () => {
    const server = createMockMcpServer();
    const registry = new ToolRegistry(server, "user-1");

    registerTool(registry, { name: "pro_tool", requiredTier: "pro", alwaysEnabled: true });

    const result = await registry.callToolDirect("pro_tool", {}, "pro");

    expect(result.isError).toBeUndefined();
  });

  it("allows access when user tier exceeds required tier", async () => {
    const server = createMockMcpServer();
    const registry = new ToolRegistry(server, "user-1");

    registerTool(registry, { name: "pro_tool", requiredTier: "pro", alwaysEnabled: true });

    const result = await registry.callToolDirect("pro_tool", {}, "business");

    expect(result.isError).toBeUndefined();
  });

  it("skips tier check when no userTier provided", async () => {
    const server = createMockMcpServer();
    const registry = new ToolRegistry(server, "user-1");

    registerTool(registry, { name: "pro_tool", requiredTier: "pro", alwaysEnabled: true });

    // No userTier — should not be blocked
    const result = await registry.callToolDirect("pro_tool", {});

    expect(result.isError).toBeUndefined();
  });

  it("skips tier check when tool has no requiredTier", async () => {
    const server = createMockMcpServer();
    const registry = new ToolRegistry(server, "user-1");

    registerTool(registry, { name: "free_tool", alwaysEnabled: true });

    const result = await registry.callToolDirect("free_tool", {}, "free");

    expect(result.isError).toBeUndefined();
  });

  it("returns error for disabled tool", async () => {
    const server = createMockMcpServer();
    const registry = new ToolRegistry(server, "user-1");

    registerTool(registry, { name: "disabled_tool" });
    // Tool is NOT alwaysEnabled so it is disabled by default

    const result = await registry.callToolDirect("disabled_tool", {});

    expect(result.isError).toBe(true);
    expect((result.content[0] as { text: string }).text).toContain("disabled");
  });
});

describe("ToolRegistry.filterByStability", () => {
  it("returns only tools with the given stability", () => {
    const server = createMockMcpServer();
    const registry = new ToolRegistry(server, "user-1");

    registerTool(registry, { name: "stable_tool", stability: "stable" });
    registerTool(registry, { name: "beta_tool", stability: "beta" });
    registerTool(registry, { name: "exp_tool", stability: "experimental" });
    registerTool(registry, { name: "dep_tool", stability: "deprecated" });

    const betaTools = registry.filterByStability("beta");
    expect(betaTools).toHaveLength(1);
    expect(betaTools[0].name).toBe("beta_tool");
  });

  it("defaults to stable when no stability specified", () => {
    const server = createMockMcpServer();
    const registry = new ToolRegistry(server, "user-1");

    registerTool(registry, { name: "default_tool" }); // no stability = stable

    const stableTools = registry.filterByStability("stable");
    expect(stableTools.map((t) => t.name)).toContain("default_tool");
  });

  it("returns empty array when no tools match stability", () => {
    const server = createMockMcpServer();
    const registry = new ToolRegistry(server, "user-1");

    registerTool(registry, { name: "stable_tool", stability: "stable" });

    const betaTools = registry.filterByStability("deprecated");
    expect(betaTools).toHaveLength(0);
  });
});

describe("ToolRegistry.enableByStability", () => {
  it("enables all tools with the given stability", () => {
    const server = createMockMcpServer();
    const registry = new ToolRegistry(server, "user-1");

    registerTool(registry, { name: "beta_1", stability: "beta" });
    registerTool(registry, { name: "beta_2", stability: "beta" });
    registerTool(registry, { name: "stable_1", stability: "stable" });

    const enabled = registry.enableByStability("beta");

    expect(enabled).toHaveLength(2);
    expect(enabled).toContain("beta_1");
    expect(enabled).toContain("beta_2");
  });

  it("does not re-enable already-enabled tools", () => {
    const server = createMockMcpServer();
    const registry = new ToolRegistry(server, "user-1");

    registerTool(registry, { name: "beta_tool", stability: "beta" });
    registry.enableByStability("beta");

    // Second call should return empty (already enabled)
    const enabled = registry.enableByStability("beta");
    expect(enabled).toHaveLength(0);
  });
});

describe("ToolRegistry.disableCategory", () => {
  it("disables all non-alwaysEnabled tools in category", () => {
    const server = createMockMcpServer();
    const registry = new ToolRegistry(server, "user-1");

    registerTool(registry, { name: "tool_a", category: "storage" });
    registerTool(registry, { name: "tool_b", category: "storage" });
    registry.enableCategory("storage");

    const disabled = registry.disableCategory("storage");

    expect(disabled).toHaveLength(2);
    expect(registry.getEnabledCount()).toBe(0);
  });

  it("does not disable alwaysEnabled tools", () => {
    const server = createMockMcpServer();
    const registry = new ToolRegistry(server, "user-1");

    registerTool(registry, { name: "always_on", category: "gateway-meta", alwaysEnabled: true });
    registerTool(registry, { name: "normal", category: "gateway-meta" });
    registry.enableCategory("gateway-meta");

    const disabled = registry.disableCategory("gateway-meta");

    // only "normal" should be disabled; "always_on" is excluded
    expect(disabled).toContain("normal");
    expect(disabled).not.toContain("always_on");
  });

  it("returns empty array if no tools enabled in category", () => {
    const server = createMockMcpServer();
    const registry = new ToolRegistry(server, "user-1");

    registerTool(registry, { name: "tool_a", category: "storage" });
    // Not enabled

    const disabled = registry.disableCategory("storage");
    expect(disabled).toHaveLength(0);
  });
});

describe("ToolRegistry.registerBuilt", () => {
  it("registers a BuiltTool with all optional meta fields", () => {
    const server = createMockMcpServer();
    const registry = new ToolRegistry(server, "user-1");

    registry.registerBuilt({
      name: "built_tool",
      description: "A built tool",
      inputSchema: { q: z.string().describe("search query") },
      meta: {
        category: "search",
        tier: "free",
        complexity: "primitive",
        annotations: { "mcp.priority": 1 },
        alwaysEnabled: true,
        version: "2.0.0",
        stability: "beta",
        examples: [{ name: "example", input: {}, description: "basic" }],
      },
      handler: async () => ({ content: [{ type: "text" as const, text: "result" }] }),
    });

    expect(registry.getToolCount()).toBe(1);
    expect(registry.hasCategory("search")).toBe(true);
    expect(registry.getEnabledCount()).toBe(1); // alwaysEnabled
  });

  it("registers a BuiltTool with minimal meta", () => {
    const server = createMockMcpServer();
    const registry = new ToolRegistry(server, "user-1");

    registry.registerBuilt({
      name: "minimal_tool",
      description: "Minimal",
      inputSchema: undefined,
      meta: {},
      handler: async () => ({ content: [] }),
    });

    expect(registry.getToolCount()).toBe(1);
  });
});

describe("ToolRegistry.getToolDefinitions", () => {
  it("includes alwaysEnabled, version, stability, and examples when set", () => {
    const server = createMockMcpServer();
    const registry = new ToolRegistry(server, "user-1");

    registerTool(registry, {
      name: "full_tool",
      stability: "beta",
      version: "3.0.0",
      alwaysEnabled: true,
      examples: [{ name: "ex", input: {}, description: "example desc" }],
      inputSchema: { q: z.string().describe("query") } as Record<string, unknown>,
    });

    const defs = registry.getToolDefinitions();
    expect(defs).toHaveLength(1);
    const def = defs[0]!;
    expect(def.stability).toBe("beta");
    expect(def.version).toBe("3.0.0");
    expect(def.alwaysEnabled).toBe(true);
    expect(def.examples).toHaveLength(1);
    expect(def.inputSchema).toBeDefined();
  });
});

describe("ToolRegistry.restoreCategories", () => {
  it("enables tools from multiple categories", () => {
    const server = createMockMcpServer();
    const registry = new ToolRegistry(server, "user-1");

    registerTool(registry, { name: "storage_1", category: "storage" });
    registerTool(registry, { name: "search_1", category: "search" });

    registry.restoreCategories(["storage", "search"]);

    expect(registry.getEnabledCount()).toBe(2);
  });

  it("handles empty array gracefully", () => {
    const server = createMockMcpServer();
    const registry = new ToolRegistry(server, "user-1");

    registerTool(registry, { name: "tool_a", category: "storage" });

    registry.restoreCategories([]);

    expect(registry.getEnabledCount()).toBe(0);
  });
});

describe("ToolRegistry.getUserId", () => {
  it("returns the userId passed at construction", () => {
    const server = createMockMcpServer();
    const registry = new ToolRegistry(server, "my-user-id");
    expect(registry.getUserId()).toBe("my-user-id");
  });
});
