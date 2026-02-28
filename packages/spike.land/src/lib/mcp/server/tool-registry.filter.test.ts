/**
 * Tests for ToolRegistry — capability filtering operations
 *
 * Covers:
 * - enableTools()
 * - enableCategory()
 * - disableCategory()
 * - listCategories()
 * - getEnabledCategories()
 * - restoreCategories()
 * - enableAll()
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

  describe("enableTools", () => {
    it("should enable tools by name and return enabled names", () => {
      const mockRegistered = {
        enabled: false,
        enable: vi.fn(),
        disable: vi.fn(),
      };
      mcpServer.registerTool.mockReturnValueOnce(mockRegistered);
      registry.register(makeTool({ name: "my-tool" }));

      const enabled = registry.enableTools(["my-tool"]);

      expect(enabled).toEqual(["my-tool"]);
      expect(mockRegistered.enable).toHaveBeenCalled();
    });

    it("should skip already-enabled tools", () => {
      const mockRegistered = {
        enabled: true,
        enable: vi.fn(),
        disable: vi.fn(),
      };
      mcpServer.registerTool.mockReturnValueOnce(mockRegistered);
      registry.register(
        makeTool({ name: "enabled-tool", alwaysEnabled: true }),
      );

      const enabled = registry.enableTools(["enabled-tool"]);

      expect(enabled).toEqual([]);
      expect(mockRegistered.enable).not.toHaveBeenCalled();
    });

    it("should skip nonexistent tools", () => {
      const enabled = registry.enableTools(["nonexistent"]);
      expect(enabled).toEqual([]);
    });
  });

  describe("enableCategory", () => {
    it("should enable all tools in a category and return names", () => {
      const mockRegistered1 = {
        enabled: false,
        enable: vi.fn(),
        disable: vi.fn(),
      };
      const mockRegistered2 = {
        enabled: false,
        enable: vi.fn(),
        disable: vi.fn(),
      };
      mcpServer.registerTool.mockReturnValueOnce(mockRegistered1)
        .mockReturnValueOnce(mockRegistered2);

      registry.register(makeTool({ name: "cat-tool-1", category: "my-cat" }));
      registry.register(makeTool({ name: "cat-tool-2", category: "my-cat" }));

      const enabled = registry.enableCategory("my-cat");

      expect(enabled).toEqual(["cat-tool-1", "cat-tool-2"]);
      expect(mockRegistered1.enable).toHaveBeenCalled();
      expect(mockRegistered2.enable).toHaveBeenCalled();
    });

    it("should skip already-enabled tools in the category", () => {
      const mockRegistered = {
        enabled: true,
        enable: vi.fn(),
        disable: vi.fn(),
      };
      mcpServer.registerTool.mockReturnValueOnce(mockRegistered);
      registry.register(
        makeTool({
          name: "already-on",
          category: "cat-a",
          alwaysEnabled: true,
        }),
      );

      const enabled = registry.enableCategory("cat-a");
      expect(enabled).toEqual([]);
    });

    it("should return empty array for nonexistent category", () => {
      const enabled = registry.enableCategory("nonexistent-cat");
      expect(enabled).toEqual([]);
    });
  });

  describe("disableCategory", () => {
    it("should disable non-alwaysEnabled tools in category", () => {
      const mockRegistered = {
        enabled: true,
        enable: vi.fn(),
        disable: vi.fn(),
      };
      mcpServer.registerTool.mockReturnValueOnce(mockRegistered);
      registry.register(makeTool({ name: "disable-me", category: "my-cat" }));

      const disabled = registry.disableCategory("my-cat");

      expect(disabled).toEqual(["disable-me"]);
      expect(mockRegistered.disable).toHaveBeenCalled();
    });

    it("should skip alwaysEnabled tools when disabling", () => {
      const mockRegistered = {
        enabled: true,
        enable: vi.fn(),
        disable: vi.fn(),
      };
      mcpServer.registerTool.mockReturnValueOnce(mockRegistered);
      registry.register(
        makeTool({ name: "keep-me", category: "my-cat", alwaysEnabled: true }),
      );

      const disabled = registry.disableCategory("my-cat");

      expect(disabled).toEqual([]);
      expect(mockRegistered.disable).not.toHaveBeenCalled();
    });

    it("should skip disabled tools", () => {
      const mockRegistered = {
        enabled: false,
        enable: vi.fn(),
        disable: vi.fn(),
      };
      mcpServer.registerTool.mockReturnValueOnce(mockRegistered);
      registry.register(makeTool({ name: "already-off", category: "my-cat" }));

      const disabled = registry.disableCategory("my-cat");

      expect(disabled).toEqual([]);
    });

    it("should return empty array for nonexistent category", () => {
      const disabled = registry.disableCategory("nonexistent");
      expect(disabled).toEqual([]);
    });
  });

  describe("listCategories", () => {
    it("should return categories with descriptions from CATEGORY_DESCRIPTIONS", () => {
      const mockRegistered = {
        enabled: true,
        enable: vi.fn(),
        disable: vi.fn(),
      };
      mcpServer.registerTool.mockReturnValueOnce(mockRegistered);
      registry.register(
        makeTool({ name: "img-tool", category: "image", alwaysEnabled: true }),
      );

      const categories = registry.listCategories();

      expect(categories).toHaveLength(1);
      expect(categories[0]).toEqual({
        name: "image",
        description: "AI image generation, modification, and job management",
        tier: "free",
        toolCount: 1,
        enabledCount: 1,
        tools: ["img-tool"],
      });
    });

    it("should use fallback description for unknown categories", () => {
      const mockRegistered = {
        enabled: false,
        enable: vi.fn(),
        disable: vi.fn(),
      };
      mcpServer.registerTool.mockReturnValueOnce(mockRegistered);
      registry.register(
        makeTool({ name: "custom-tool", category: "custom-unknown" }),
      );

      const categories = registry.listCategories();

      expect(categories[0]!.description).toBe("custom-unknown tools");
    });

    it("should aggregate multiple tools per category", () => {
      const mockReg1 = { enabled: true, enable: vi.fn(), disable: vi.fn() };
      const mockReg2 = { enabled: false, enable: vi.fn(), disable: vi.fn() };
      mcpServer.registerTool.mockReturnValueOnce(mockReg1).mockReturnValueOnce(
        mockReg2,
      );

      registry.register(
        makeTool({ name: "tool-a", category: "vault", alwaysEnabled: true }),
      );
      registry.register(makeTool({ name: "tool-b", category: "vault" }));

      const categories = registry.listCategories();

      expect(categories).toHaveLength(1);
      expect(categories[0]!.toolCount).toBe(2);
      expect(categories[0]!.enabledCount).toBe(1);
      expect(categories[0]!.tools).toEqual(["tool-a", "tool-b"]);
    });

    it("should allow tools matching gateway meta category (unlike searchTools)", () => {
      const mockRegistered = {
        enabled: true,
        enable: vi.fn(),
        disable: vi.fn(),
      };
      mcpServer.registerTool.mockReturnValueOnce(mockRegistered);
      registry.register(
        makeTool({
          name: "tool-c",
          category: "gateway-meta",
          alwaysEnabled: true,
        }),
      );
      const categories = registry.listCategories();
      expect(categories).toHaveLength(1);
    });

    it("should handle tools marked disabled without explicitly returning an enabled record", () => {
      const mockRegistered = {
        enabled: false,
        enable: vi.fn(),
        disable: vi.fn(),
      };
      mcpServer.registerTool.mockReturnValueOnce(mockRegistered);
      registry.register(
        makeTool({ name: "tool-disabled-default", category: "vault" }),
      );
      const categories = registry.listCategories();
      expect(categories[0]!.enabledCount).toBe(0);
    });

    it("should return empty array when no tools registered", () => {
      const categories = registry.listCategories();
      expect(categories).toEqual([]);
    });
  });

  describe("getEnabledCategories", () => {
    it("should return categories with at least one enabled non-gateway tool", () => {
      const enabledReg = { enabled: true, enable: vi.fn(), disable: vi.fn() };
      const disabledReg = { enabled: false, enable: vi.fn(), disable: vi.fn() };
      const enabledReg2 = { enabled: true, enable: vi.fn(), disable: vi.fn() };
      mcpServer.registerTool
        .mockReturnValueOnce(enabledReg)
        .mockReturnValueOnce(disabledReg)
        .mockReturnValueOnce(enabledReg2);

      registry.register(makeTool({ name: "chat-tool", category: "chat" }));
      registry.register(makeTool({ name: "blog-tool", category: "blog" }));
      registry.register(makeTool({ name: "storage-tool", category: "storage" }));

      const categories = registry.getEnabledCategories();

      expect(categories).toContain("chat");
      expect(categories).toContain("storage");
      expect(categories).not.toContain("blog");
    });

    it("should exclude gateway-meta category", () => {
      const enabledReg = { enabled: true, enable: vi.fn(), disable: vi.fn() };
      mcpServer.registerTool.mockReturnValueOnce(enabledReg);

      registry.register(
        makeTool({ name: "search", category: "gateway-meta", alwaysEnabled: true }),
      );

      expect(registry.getEnabledCategories()).toEqual([]);
    });

    it("should exclude alwaysEnabled tools from categories", () => {
      const enabledReg = { enabled: true, enable: vi.fn(), disable: vi.fn() };
      mcpServer.registerTool.mockReturnValueOnce(enabledReg);

      registry.register(
        makeTool({ name: "always-on", category: "chat", alwaysEnabled: true }),
      );

      expect(registry.getEnabledCategories()).toEqual([]);
    });

    it("should return empty array when no tools are enabled", () => {
      const disabledReg = { enabled: false, enable: vi.fn(), disable: vi.fn() };
      mcpServer.registerTool.mockReturnValueOnce(disabledReg);

      registry.register(makeTool({ name: "off", category: "chat" }));

      expect(registry.getEnabledCategories()).toEqual([]);
    });

    it("should deduplicate categories with multiple enabled tools", () => {
      const reg1 = { enabled: true, enable: vi.fn(), disable: vi.fn() };
      const reg2 = { enabled: true, enable: vi.fn(), disable: vi.fn() };
      mcpServer.registerTool.mockReturnValueOnce(reg1).mockReturnValueOnce(reg2);

      registry.register(makeTool({ name: "chat-1", category: "chat" }));
      registry.register(makeTool({ name: "chat-2", category: "chat" }));

      const categories = registry.getEnabledCategories();
      expect(categories.filter(c => c === "chat")).toHaveLength(1);
    });
  });

  describe("restoreCategories", () => {
    it("should enable all tools in each listed category", () => {
      const reg1 = { enabled: false, enable: vi.fn(), disable: vi.fn() };
      const reg2 = { enabled: false, enable: vi.fn(), disable: vi.fn() };
      const reg3 = { enabled: false, enable: vi.fn(), disable: vi.fn() };
      mcpServer.registerTool
        .mockReturnValueOnce(reg1)
        .mockReturnValueOnce(reg2)
        .mockReturnValueOnce(reg3);

      registry.register(makeTool({ name: "chat-tool", category: "chat" }));
      registry.register(makeTool({ name: "blog-tool", category: "blog" }));
      registry.register(makeTool({ name: "storage-tool", category: "storage" }));

      registry.restoreCategories(["chat", "storage"]);

      expect(reg1.enable).toHaveBeenCalled();
      expect(reg2.enable).not.toHaveBeenCalled();
      expect(reg3.enable).toHaveBeenCalled();
    });

    it("should handle empty categories list", () => {
      const reg1 = { enabled: false, enable: vi.fn(), disable: vi.fn() };
      mcpServer.registerTool.mockReturnValueOnce(reg1);

      registry.register(makeTool({ name: "chat-tool", category: "chat" }));

      registry.restoreCategories([]);

      expect(reg1.enable).not.toHaveBeenCalled();
    });

    it("should skip nonexistent categories without error", () => {
      const reg1 = { enabled: false, enable: vi.fn(), disable: vi.fn() };
      mcpServer.registerTool.mockReturnValueOnce(reg1);

      registry.register(makeTool({ name: "chat-tool", category: "chat" }));

      // Should not throw
      registry.restoreCategories(["nonexistent", "also-missing"]);

      expect(reg1.enable).not.toHaveBeenCalled();
    });
  });

  describe("enableAll", () => {
    it("should enable all disabled tools", () => {
      const reg1 = { enabled: false, enable: vi.fn(), disable: vi.fn() };
      const reg2 = { enabled: false, enable: vi.fn(), disable: vi.fn() };
      mcpServer.registerTool.mockReturnValueOnce(reg1).mockReturnValueOnce(reg2);

      registry.register(makeTool({ name: "t1" }));
      registry.register(makeTool({ name: "t2" }));

      const count = registry.enableAll();
      expect(count).toBe(2);
      expect(reg1.enable).toHaveBeenCalled();
      expect(reg2.enable).toHaveBeenCalled();
    });

    it("should skip already-enabled tools", () => {
      const enabledReg = { enabled: true, enable: vi.fn(), disable: vi.fn() };
      const disabledReg = { enabled: false, enable: vi.fn(), disable: vi.fn() };
      mcpServer.registerTool.mockReturnValueOnce(enabledReg).mockReturnValueOnce(disabledReg);

      registry.register(makeTool({ name: "already-on", alwaysEnabled: true }));
      registry.register(makeTool({ name: "off" }));

      const count = registry.enableAll();
      expect(count).toBe(1);
      expect(enabledReg.enable).not.toHaveBeenCalled();
      expect(disabledReg.enable).toHaveBeenCalled();
    });

    it("should return 0 when no tools registered", () => {
      expect(registry.enableAll()).toBe(0);
    });
  });
});
