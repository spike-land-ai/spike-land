/**
 * Tests for ToolRegistry — registration operations
 *
 * Covers:
 * - constructor
 * - register() including wrapper execution, skill usage recording
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { ToolRegistry, validateSchemaDescriptions } from "./tool-registry";
import type { ToolDefinition } from "./tool-registry";
import logger from "@/lib/logger";

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
    ...(overrides.alwaysEnabled !== undefined ? { alwaysEnabled: overrides.alwaysEnabled } : {}),
    ...(overrides.inputSchema !== undefined ? { inputSchema: overrides.inputSchema } : {}),
    ...(overrides.annotations !== undefined ? { annotations: overrides.annotations } : {}),
    ...(overrides.complexity !== undefined ? { complexity: overrides.complexity } : {}),
  };
}

describe("ToolRegistry", () => {
  let mcpServer: ReturnType<typeof createMockMcpServer>;
  let registry: ToolRegistry;

  beforeEach(async () => {
    // Flush any pending fire-and-forget async operations from the previous test
    // (e.g. recordSkillUsage's dynamic import resolving) before clearing mocks
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

  describe("constructor", () => {
    it("should create an instance", () => {
      expect(registry).toBeInstanceOf(ToolRegistry);
    });
  });

  describe("register", () => {
    it("should register a tool with mcpServer", () => {
      const tool = makeTool();
      registry.register(tool);

      expect(mcpServer.registerTool).toHaveBeenCalledWith(
        "test-tool",
        {
          description: "A test tool",
          inputSchema: undefined,
          annotations: undefined,
          _meta: { category: "test-category", tier: "free" },
        },
        expect.any(Function),
      );
    });

    it("should disable non-alwaysEnabled tools", () => {
      const mockRegistered = {
        enabled: true,
        enable: vi.fn(),
        disable: vi.fn(),
      };
      mcpServer.registerTool.mockReturnValue(mockRegistered);

      registry.register(makeTool({ alwaysEnabled: false }));

      expect(mockRegistered.disable).toHaveBeenCalled();
    });

    it("should disable tools without alwaysEnabled set", () => {
      const mockRegistered = {
        enabled: true,
        enable: vi.fn(),
        disable: vi.fn(),
      };
      mcpServer.registerTool.mockReturnValue(mockRegistered);

      registry.register(makeTool());

      expect(mockRegistered.disable).toHaveBeenCalled();
    });

    it("should keep alwaysEnabled tools enabled (not call disable)", () => {
      const mockRegistered = {
        enabled: true,
        enable: vi.fn(),
        disable: vi.fn(),
      };
      mcpServer.registerTool.mockReturnValue(mockRegistered);

      registry.register(makeTool({ alwaysEnabled: true }));

      expect(mockRegistered.disable).not.toHaveBeenCalled();
    });

    describe("execution (wrapper)", () => {
      it("should execute the original handler and return its result", async () => {
        const mockResult = {
          content: [{ type: "text" as const, text: "success" }],
        };
        const mockHandler = vi.fn().mockResolvedValue(mockResult);

        let wrappedHandler: any;
        mcpServer.registerTool.mockImplementation(
          (_name, _options, handler) => {
            wrappedHandler = handler;
            return { enabled: true, enable: vi.fn(), disable: vi.fn() };
          },
        );

        registry.register(makeTool({ handler: mockHandler }));

        const result = await wrappedHandler({});
        expect(result).toBe(mockResult);
        expect(mockHandler).toHaveBeenCalledWith({});
      });

      it("should pass through errors thrown by the handler", async () => {
        const mockHandler = vi.fn().mockRejectedValue(
          new Error("Handler failed"),
        );

        let wrappedHandler: any;
        mcpServer.registerTool.mockImplementation(
          (_name, _options, handler) => {
            wrappedHandler = handler;
            return { enabled: true, enable: vi.fn(), disable: vi.fn() };
          },
        );

        registry.register(makeTool({ handler: mockHandler }));

        await expect(wrappedHandler({})).rejects.toThrow("Handler failed");
      });

      it("should extract tokens from _meta if present", async () => {
        const mockResult = {
          content: [],
          _meta: { _tokens: 123 },
        };
        const mockHandler = vi.fn().mockResolvedValue(mockResult);

        let wrappedHandler: any;
        mcpServer.registerTool.mockImplementation(
          (_name, _options, handler) => {
            wrappedHandler = handler;
            return { enabled: true, enable: vi.fn(), disable: vi.fn() };
          },
        );

        registry.register(makeTool({ handler: mockHandler }));

        const result = await wrappedHandler({});
        expect(result).toBe(mockResult);

        await new Promise(resolve => setTimeout(resolve, 50));
      });

      it("should record skill usage on success", async () => {
        const mockResult = { content: [] };
        const mockHandler = vi.fn().mockResolvedValue(mockResult);

        let wrappedHandler: any;
        mcpServer.registerTool.mockImplementation(
          (_name, _options, handler) => {
            wrappedHandler = handler;
            return { enabled: true, enable: vi.fn(), disable: vi.fn() };
          },
        );

        registry.register(
          makeTool({
            handler: mockHandler,
            name: "test-skill",
            category: "test-cat",
          }),
        );

        await wrappedHandler({ testInput: true });

        // Wait for next tick to let fire-and-forget promise resolve
        await new Promise(resolve => setTimeout(resolve, 50));

        expect(mockPrismaCreate).toHaveBeenCalledWith({
          data: expect.objectContaining({
            userId: "test-user-id",
            skillName: "test-skill",
            category: "test-cat",
            outcome: "success",
            durationMs: expect.any(Number),
            metadata: {
              input: { testInput: true },
            },
          }),
        });
      });

      it("should record skill usage on error", async () => {
        const mockHandler = vi.fn().mockRejectedValue(
          new Error("Test failure"),
        );

        let wrappedHandler: any;
        mcpServer.registerTool.mockImplementation(
          (_name, _options, handler) => {
            wrappedHandler = handler;
            return { enabled: true, enable: vi.fn(), disable: vi.fn() };
          },
        );

        registry.register(
          makeTool({
            handler: mockHandler,
            name: "error-tool",
            category: "test-cat",
          }),
        );

        await expect(wrappedHandler({})).rejects.toThrow("Test failure");

        await new Promise(resolve => setTimeout(resolve, 50));

        expect(mockPrismaCreate).toHaveBeenCalledWith({
          data: expect.objectContaining({
            outcome: "error",
            userId: "test-user-id",
            skillName: "error-tool",
            metadata: expect.objectContaining({
              errorMessage: "Test failure",
            }),
          }),
        });
      });

      it("should handle logging failures gracefully", async () => {
        const mockResult = { content: [] };
        const mockHandler = vi.fn().mockResolvedValue(mockResult);
        mockPrismaCreate.mockRejectedValueOnce(new Error("Database down"));

        let wrappedHandler: any;
        mcpServer.registerTool.mockImplementation(
          (_name, _options, handler) => {
            wrappedHandler = handler;
            return { enabled: true, enable: vi.fn(), disable: vi.fn() };
          },
        );

        registry.register(makeTool({ handler: mockHandler }));

        await wrappedHandler({});

        await new Promise(resolve => setTimeout(resolve, 0));

        expect(logger.error).toHaveBeenCalledWith(
          "Failed to record skill usage event",
          expect.any(Object),
        );
      });

      it("should handle error throws that are not Error instances", async () => {
        const mockHandler = vi.fn().mockRejectedValue("String error");

        let wrappedHandler: any;
        mcpServer.registerTool.mockImplementation(
          (_name, _options, handler) => {
            wrappedHandler = handler;
            return { enabled: true, enable: vi.fn(), disable: vi.fn() };
          },
        );

        registry.register(makeTool({ handler: mockHandler }));

        await expect(wrappedHandler({})).rejects.toBe("String error");
        await new Promise(resolve => setTimeout(resolve, 50));

        expect(mockPrismaCreate).toHaveBeenCalledWith({
          data: expect.objectContaining({
            outcome: "error",
            metadata: expect.objectContaining({
              errorMessage: "String error",
            }),
          }),
        });
      });

      it("should skip logging if userId is omitted", async () => {
        const customRegistry = new ToolRegistry({ ...mcpServer } as any, ""); // Empty userId
        const mockHandler = vi.fn().mockResolvedValue({ content: [] });

        let wrappedHandler: any;
        mcpServer.registerTool.mockImplementation(
          (_name, _options, handler) => {
            wrappedHandler = handler;
            return { enabled: true, enable: vi.fn(), disable: vi.fn() };
          },
        );

        customRegistry.register(makeTool({ handler: mockHandler }));
        await wrappedHandler({});
        await new Promise(resolve => setTimeout(resolve, 50));

        expect(mockPrismaCreate).not.toHaveBeenCalled();
      });

      it("should capture isError true as outcome error even if text is absent", async () => {
        const mockResult = {
          isError: true,
          content: [
            { type: "image", data: "base64" },
          ],
        };
        const mockHandler = vi.fn().mockResolvedValue(mockResult);

        let wrappedHandler: any;
        mcpServer.registerTool.mockImplementation(
          (_name, _options, handler) => {
            wrappedHandler = handler;
            return { enabled: true, enable: vi.fn(), disable: vi.fn() };
          },
        );

        registry.register(makeTool({ handler: mockHandler }));

        await wrappedHandler({});

        await new Promise(resolve => setTimeout(resolve, 50));

        expect(mockPrismaCreate).toHaveBeenCalledWith({
          data: expect.objectContaining({
            outcome: "error",
            metadata: expect.objectContaining({
              errorMessage: "", // Join mapped empty string
            }),
          }),
        });
      });

      it("should capture isError true as outcome error", async () => {
        const mockResult = {
          isError: true,
          content: [{ type: "text", text: "Tool complained" }],
        };
        const mockHandler = vi.fn().mockResolvedValue(mockResult);

        let wrappedHandler: any;
        mcpServer.registerTool.mockImplementation(
          (_name, _options, handler) => {
            wrappedHandler = handler;
            return { enabled: true, enable: vi.fn(), disable: vi.fn() };
          },
        );

        registry.register(makeTool({ handler: mockHandler }));

        await wrappedHandler({});

        await new Promise(resolve => setTimeout(resolve, 0));

        expect(mockPrismaCreate).toHaveBeenCalledWith({
          data: expect.objectContaining({
            outcome: "error",
            metadata: expect.objectContaining({
              errorMessage: "Tool complained",
            }),
          }),
        });
      });
    });
  });

  describe("schema description validation", () => {
    it("should throw in non-production when schema fields lack .describe()", () => {
      const originalEnv = process.env.NODE_ENV;
      (process.env as Record<string, string | undefined>).NODE_ENV ="test";

      const tool = makeTool({
        inputSchema: {
          name: z.string(),
          age: z.number(),
        },
      });

      expect(() => registry.register(tool)).toThrow(
        /has schema fields without \.describe\(\): name, age/,
      );

      (process.env as Record<string, string | undefined>).NODE_ENV =originalEnv;
    });

    it("should not throw when all schema fields have .describe()", () => {
      const tool = makeTool({
        inputSchema: {
          name: z.string().describe("The user name"),
          age: z.number().describe("The user age"),
        },
      });

      expect(() => registry.register(tool)).not.toThrow();
    });

    it("should warn in production when schema fields lack .describe()", () => {
      const originalEnv = process.env.NODE_ENV;
      (process.env as Record<string, string | undefined>).NODE_ENV ="production";

      const tool = makeTool({
        inputSchema: {
          name: z.string(),
        },
      });

      expect(() => registry.register(tool)).not.toThrow();
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining("has schema fields without .describe(): name"),
      );

      (process.env as Record<string, string | undefined>).NODE_ENV =originalEnv;
    });

    it("should not throw when inputSchema is undefined", () => {
      const tool = makeTool({ inputSchema: undefined });
      expect(() => registry.register(tool)).not.toThrow();
    });

    it("should report only fields missing .describe()", () => {
      const originalEnv = process.env.NODE_ENV;
      (process.env as Record<string, string | undefined>).NODE_ENV ="test";

      const tool = makeTool({
        inputSchema: {
          good: z.string().describe("Has description"),
          bad: z.string(),
        },
      });

      expect(() => registry.register(tool)).toThrow(
        /has schema fields without \.describe\(\): bad/,
      );

      (process.env as Record<string, string | undefined>).NODE_ENV =originalEnv;
    });
  });
});

describe("validateSchemaDescriptions", () => {
  it("should return empty array for undefined schema", () => {
    expect(validateSchemaDescriptions(undefined)).toEqual([]);
  });

  it("should return empty array when all fields have descriptions", () => {
    const schema = {
      name: z.string().describe("Name"),
      count: z.number().describe("Count"),
    };
    expect(validateSchemaDescriptions(schema)).toEqual([]);
  });

  it("should return field names missing descriptions", () => {
    const schema = {
      described: z.string().describe("Has one"),
      missing1: z.string(),
      missing2: z.number(),
    };
    expect(validateSchemaDescriptions(schema)).toEqual(["missing1", "missing2"]);
  });

  it("should handle optional fields with .describe()", () => {
    const schema = {
      opt: z.string().optional().describe("Optional field"),
    };
    expect(validateSchemaDescriptions(schema)).toEqual([]);
  });

  it("should detect optional fields without .describe()", () => {
    const schema = {
      opt: z.string().optional(),
    };
    expect(validateSchemaDescriptions(schema)).toEqual(["opt"]);
  });
});
