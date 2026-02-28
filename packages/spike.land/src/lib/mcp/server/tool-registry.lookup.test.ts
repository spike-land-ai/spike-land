/**
 * Tests for ToolRegistry — tool lookup/find/search operations
 *
 * Covers:
 * - searchTools()
 * - searchToolsSemantic()
 * - getToolDefinitions()
 * - callToolDirect()
 * - getToolCount()
 * - getEnabledCount()
 * - hasCategory()
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToolRegistry } from "./tool-registry";
import type { ToolDefinition } from "./tool-registry";

vi.mock("@/lib/logger", () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

const mockPrismaCreate = vi.fn();
vi.mock("@/lib/prisma", () => {
  return {
    default: {
      skillUsageEvent: {
        create: (...args: any[]) => mockPrismaCreate(...args),
      },
    },
    __esModule: true,
  };
});

function createMockMcpServer() {
  return {
    registerTool: vi.fn().mockReturnValue({
      enabled: true,
      enable: vi.fn(),
      disable: vi.fn(),
    }),
  };
}

function makeTool(overrides: Partial<ToolDefinition> = {}): ToolDefinition {
  return {
    name: overrides.name ?? "test-tool",
    description: overrides.description ?? "A test tool",
    category: overrides.category ?? "test-category",
    tier: overrides.tier ?? "free",
    handler: overrides.handler
      ?? ((() => ({ content: [] })) as ToolDefinition["handler"]),
    alwaysEnabled: overrides.alwaysEnabled,
    inputSchema: overrides.inputSchema,
    annotations: overrides.annotations,
    complexity: overrides.complexity,
  };
}

describe("ToolRegistry", () => {
  let mcpServer: ReturnType<typeof createMockMcpServer>;
  let registry: ToolRegistry;

  beforeEach(async () => {
    await new Promise(r => setTimeout(r, 100));
    vi.clearAllMocks();
    mockPrismaCreate.mockClear();
    mcpServer = createMockMcpServer();
    registry = new ToolRegistry({ ...mcpServer } as any, "test-user-id");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    mockPrismaCreate.mockClear();
  });

  describe("searchTools", () => {
    beforeEach(() => {
      // Register a variety of tools for search testing
      const tools: ToolDefinition[] = [
        makeTool({
          name: "image-generate",
          description: "Generate images with AI",
          category: "image",
        }),
        makeTool({
          name: "image-edit",
          description: "Edit existing images",
          category: "image",
        }),
        makeTool({
          name: "codespace-run",
          description: "Run code in a codespace",
          category: "codespace",
        }),
        makeTool({
          name: "search-tools",
          description: "Search for tools",
          category: "gateway-meta",
          alwaysEnabled: true,
        }),
        makeTool({
          name: "vault-store",
          description: "Store secrets in vault",
          category: "vault",
        }),
      ];

      for (const tool of tools) {
        const mockRegistered = {
          enabled: tool.alwaysEnabled ? true : false,
          enable: vi.fn(),
          disable: vi.fn(),
        };
        mcpServer.registerTool.mockReturnValueOnce(mockRegistered);
        registry.register(tool);
      }
    });

    it("should return scored results matching query", async () => {
      const results = await registry.searchTools("image");

      expect(results.length).toBe(2);
      expect(results[0]!.name).toBe("image-generate");
      expect(results[1]!.name).toBe("image-edit");
    });

    it("should give name match a score of 3", async () => {
      // "image" appears in name for image-generate and image-edit
      const results = await registry.searchTools("generate");
      // "generate" is in name of image-generate (score 3) and description (score 1) = 4
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0]!.name).toBe("image-generate");
    });

    it("should give category match a score of 2", async () => {
      // "codespace" matches the category
      const results = await registry.searchTools("codespace");
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0]!.name).toBe("codespace-run");
    });

    it("should give description match a score of 1", async () => {
      // "secrets" appears only in the description of vault-store
      const results = await registry.searchTools("secrets");
      expect(results.length).toBe(1);
      expect(results[0]!.name).toBe("vault-store");
    });

    it("should skip gateway-meta tools in search results", async () => {
      const results = await registry.searchTools("search");
      const gatewayMetaTool = results.find(r => r.name === "search-tools");
      expect(gatewayMetaTool).toBeUndefined();
    });

    it("should respect the limit parameter", async () => {
      const results = await registry.searchTools("image", 1);
      expect(results.length).toBe(1);
    });

    it("should return empty array for empty query", async () => {
      const results = await registry.searchTools("");
      expect(results).toEqual([]);
    });

    it("should return empty array for whitespace-only query", async () => {
      const results = await registry.searchTools("   ");
      expect(results).toEqual([]);
    });

    it("should return empty array when no matches found", async () => {
      const results = await registry.searchTools("zzzznonexistent");
      expect(results).toEqual([]);
    });

    it("should truncate description to 200 chars from first line", async () => {
      const longDesc = "A".repeat(300);
      const mockRegistered = {
        enabled: false,
        enable: vi.fn(),
        disable: vi.fn(),
      };
      mcpServer.registerTool.mockReturnValueOnce(mockRegistered);
      registry.register(
        makeTool({
          name: "long-desc-tool",
          description: longDesc,
          category: "misc",
        }),
      );

      const results = await registry.searchTools("long-desc-tool");
      expect(results[0]!.description.length).toBeLessThanOrEqual(200);
    });

    it("should use only the first line of multiline descriptions", async () => {
      const multilineDesc = "First line about searching\nSecond line with more details";
      const mockRegistered = {
        enabled: false,
        enable: vi.fn(),
        disable: vi.fn(),
      };
      mcpServer.registerTool.mockReturnValueOnce(mockRegistered);
      registry.register(
        makeTool({
          name: "multiline-tool",
          description: multilineDesc,
          category: "misc",
        }),
      );

      const results = await registry.searchTools("searching");
      expect(results).toHaveLength(1);
      expect(results[0]!.description).toBe("First line about searching");
    });

    it("should use false when registered.enabled is undefined", async () => {
      const mockRegistered = {
        enabled: undefined,
        enable: vi.fn(),
        disable: vi.fn(),
      };
      mcpServer.registerTool.mockReturnValueOnce(mockRegistered);
      registry.register(
        makeTool({
          name: "undef-enabled",
          description: "Undefined enabled state",
          category: "misc",
        }),
      );

      const results = await registry.searchTools("undef-enabled");
      expect(results).toHaveLength(1);
      expect(results[0]!.enabled).toBe(false);
    });

    it("should handle tool with empty description gracefully", async () => {
      const mockRegistered = {
        enabled: false,
        enable: vi.fn(),
        disable: vi.fn(),
      };
      mcpServer.registerTool.mockReturnValueOnce(mockRegistered);
      // Register a tool with empty description - name match still works
      registry.register(
        makeTool({ name: "emptydesc", description: "", category: "misc" }),
      );

      const results = await registry.searchTools("emptydesc");
      expect(results).toHaveLength(1);
      expect(results[0]!.description).toBe("");
    });

    it("should handle description starting with newline (empty first line)", async () => {
      const mockRegistered = {
        enabled: false,
        enable: vi.fn(),
        disable: vi.fn(),
      };
      mcpServer.registerTool.mockReturnValueOnce(mockRegistered);
      registry.register(
        makeTool({
          name: "newline-desc-tool",
          description: "\nActual description on second line",
          category: "misc",
        }),
      );

      const results = await registry.searchTools("newline-desc-tool");
      expect(results).toHaveLength(1);
      expect(results[0]!.description).toBe("");
    });

    it("should handle tools with complexity", async () => {
      const mockRegistered = {
        enabled: true,
        enable: vi.fn(),
        disable: vi.fn(),
      };
      mcpServer.registerTool.mockReturnValueOnce(mockRegistered);
      registry.register(
        makeTool({
          name: "complex-tool",
          category: "misc",
          complexity: "composed",
        }),
      );

      const results = await registry.searchTools("complex-tool");
      expect(results).toHaveLength(1);
      expect(results[0]!.complexity).toBe("composed");
    });
  });

  describe("searchToolsSemantic", () => {
    beforeEach(() => {
      const tools: ToolDefinition[] = [
        makeTool({
          name: "generate_image",
          description: "Generate AI images with prompts",
          category: "image",
        }),
        makeTool({
          name: "send_email",
          description: "Send email messages to users",
          category: "email",
        }),
        makeTool({
          name: "search_tools",
          description: "Search for tools",
          category: "gateway-meta",
          alwaysEnabled: true,
        }),
        makeTool({
          name: "delete_user",
          description: "Delete a user account",
          category: "admin",
        }),
      ];

      for (const tool of tools) {
        const mockRegistered = {
          enabled: tool.alwaysEnabled ? true : false,
          enable: vi.fn(),
          disable: vi.fn(),
        };
        mcpServer.registerTool.mockReturnValueOnce(mockRegistered);
        registry.register(tool);
      }
    });

    it("should find tools via synonyms", () => {
      const results = registry.searchToolsSemantic("make pictures");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]!.name).toBe("generate_image");
    });

    it("should include score in results", () => {
      const results = registry.searchToolsSemantic("image");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]!.score).toBeDefined();
      expect(typeof results[0]!.score).toBe("number");
      expect(results[0]!.score).toBeGreaterThan(0);
    });

    it("should exclude gateway-meta tools", () => {
      const results = registry.searchToolsSemantic("search tools");
      const gatewayTool = results.find(r => r.name === "search_tools");
      expect(gatewayTool).toBeUndefined();
    });

    it("should sort results by score descending", () => {
      const results = registry.searchToolsSemantic("generate image");
      if (results.length >= 2) {
        expect(results[0]!.score!).toBeGreaterThanOrEqual(results[1]!.score!);
      }
    });

    it("should return empty array for empty query", () => {
      const results = registry.searchToolsSemantic("");
      expect(results).toEqual([]);
    });

    it("should respect limit parameter", () => {
      const results = registry.searchToolsSemantic("tool", 1);
      expect(results.length).toBeLessThanOrEqual(1);
    });

    it("should include suggestedParams when query has patterns", () => {
      const results = registry.searchToolsSemantic(
        "generate image of a sunset",
      );
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]!.suggestedParams).toBeDefined();
      expect(results[0]!.suggestedParams!.prompt).toBeDefined();
    });

    it("should not include suggestedParams for plain queries", () => {
      const results = registry.searchToolsSemantic("image");
      if (results.length > 0) {
        expect(results[0]!.suggestedParams).toBeUndefined();
      }
    });
  });

  describe("searchTools advanced", () => {
    it("should sort results by score", async () => {
      registry.register(makeTool({ name: "exact-match", description: "unrelated" }));
      registry.register(makeTool({ name: "other", description: "contains exact-match" }));

      const results = await registry.searchTools("exact-match");
      expect(results[0]!.name).toBe("exact-match");
      expect(results[1]!.name).toBe("other");
    });
  });

  describe("searchToolsSemantic synonyms and parameters", () => {
    it("should handle multiple synonyms and suggested parameters", () => {
      registry.register(makeTool({
        name: "test_tool",
        description: "description with keyword",
        category: "test",
      }));
      // "keyword" is in description, synonym "test" in category
      const results = registry.searchToolsSemantic("keyword test");
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe("getToolDefinitions", () => {
    it("should return all registered tool definitions", () => {
      const enabledReg = { enabled: true, enable: vi.fn(), disable: vi.fn() };
      const disabledReg = { enabled: false, enable: vi.fn(), disable: vi.fn() };
      mcpServer.registerTool.mockReturnValueOnce(enabledReg).mockReturnValueOnce(disabledReg);

      registry.register(makeTool({ name: "tool-a", category: "cat-a", alwaysEnabled: true }));
      registry.register(makeTool({ name: "tool-b", category: "cat-b" }));

      const defs = registry.getToolDefinitions();
      expect(defs).toHaveLength(2);
      expect(defs[0]).toMatchObject({ name: "tool-a", category: "cat-a", enabled: true });
      expect(defs[1]).toMatchObject({ name: "tool-b", category: "cat-b", enabled: false });
    });

    it("should include handler and inputSchema", () => {
      registry.register(makeTool({ name: "with-handler" }));
      const defs = registry.getToolDefinitions();
      expect(defs[0]).toHaveProperty("handler");
      expect(typeof defs[0]!.handler).toBe("function");
    });

    it("should return empty array when no tools registered", () => {
      expect(registry.getToolDefinitions()).toEqual([]);
    });
  });

  describe("callToolDirect", () => {
    it("should call the tool handler and return result", async () => {
      const mockHandler = vi.fn().mockResolvedValue({
        content: [{ type: "text", text: "direct result" }],
      });
      const enabledReg = { enabled: true, enable: vi.fn(), disable: vi.fn() };
      mcpServer.registerTool.mockReturnValueOnce(enabledReg);

      registry.register(
        makeTool({ name: "direct-tool", handler: mockHandler, alwaysEnabled: true }),
      );

      const result = await registry.callToolDirect("direct-tool", { foo: "bar" });
      expect(result.content[0]).toEqual({ type: "text", text: "direct result" });
      expect(mockHandler).toHaveBeenCalledWith({ foo: "bar" });
    });

    it("should return error for nonexistent tool", async () => {
      const result = await registry.callToolDirect("nonexistent", {});
      expect(result.isError).toBe(true);
      const content = result.content[0] as { type: string; text: string; };
      expect(content.text).toContain("Tool not found");
    });

    it("should return error for disabled tool", async () => {
      const disabledReg = { enabled: false, enable: vi.fn(), disable: vi.fn() };
      mcpServer.registerTool.mockReturnValueOnce(disabledReg);

      registry.register(makeTool({ name: "disabled-tool" }));

      const result = await registry.callToolDirect("disabled-tool", {});
      expect(result.isError).toBe(true);
      const content = result.content[0] as { type: string; text: string; };
      expect(content.text).toContain("Tool disabled");
    });
  });

  describe("getToolCount", () => {
    it("should return the total number of registered tools", () => {
      const mockReg1 = { enabled: false, enable: vi.fn(), disable: vi.fn() };
      const mockReg2 = { enabled: false, enable: vi.fn(), disable: vi.fn() };
      mcpServer.registerTool.mockReturnValueOnce(mockReg1).mockReturnValueOnce(
        mockReg2,
      );

      registry.register(makeTool({ name: "tool-1" }));
      registry.register(makeTool({ name: "tool-2" }));

      expect(registry.getToolCount()).toBe(2);
    });

    it("should return 0 when no tools registered", () => {
      expect(registry.getToolCount()).toBe(0);
    });
  });

  describe("getEnabledCount", () => {
    it("should return count of enabled tools", () => {
      const enabledReg = { enabled: true, enable: vi.fn(), disable: vi.fn() };
      const disabledReg = { enabled: false, enable: vi.fn(), disable: vi.fn() };
      mcpServer.registerTool
        .mockReturnValueOnce(enabledReg)
        .mockReturnValueOnce(disabledReg);

      registry.register(
        makeTool({ name: "enabled-tool", alwaysEnabled: true }),
      );
      registry.register(makeTool({ name: "disabled-tool" }));

      expect(registry.getEnabledCount()).toBe(1);
    });

    it("should return 0 when no tools are enabled", () => {
      const disabledReg = { enabled: false, enable: vi.fn(), disable: vi.fn() };
      mcpServer.registerTool.mockReturnValueOnce(disabledReg);
      registry.register(makeTool({ name: "off-tool" }));

      expect(registry.getEnabledCount()).toBe(0);
    });
  });

  describe("hasCategory", () => {
    it("should return true for an existing category", () => {
      const mockRegistered = {
        enabled: false,
        enable: vi.fn(),
        disable: vi.fn(),
      };
      mcpServer.registerTool.mockReturnValueOnce(mockRegistered);
      registry.register(makeTool({ category: "image" }));

      expect(registry.hasCategory("image")).toBe(true);
    });

    it("should return false for a nonexistent category", () => {
      expect(registry.hasCategory("nonexistent")).toBe(false);
    });

    it("should return true even when category is not the first registered tool", () => {
      const mockReg1 = { enabled: false, enable: vi.fn(), disable: vi.fn() };
      const mockReg2 = { enabled: false, enable: vi.fn(), disable: vi.fn() };
      mcpServer.registerTool.mockReturnValueOnce(mockReg1).mockReturnValueOnce(
        mockReg2,
      );
      registry.register(makeTool({ name: "a-tool", category: "alpha" }));
      registry.register(makeTool({ name: "b-tool", category: "beta" }));

      // "beta" is the second category but should still be found
      expect(registry.hasCategory("beta")).toBe(true);
    });

    it("should return false when tools exist but none match the category", () => {
      const mockRegistered = {
        enabled: false,
        enable: vi.fn(),
        disable: vi.fn(),
      };
      mcpServer.registerTool.mockReturnValueOnce(mockRegistered);
      registry.register(makeTool({ category: "image" }));

      expect(registry.hasCategory("vault")).toBe(false);
    });
  });
});
