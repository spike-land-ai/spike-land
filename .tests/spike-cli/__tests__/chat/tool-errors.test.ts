import { describe, expect, it } from "vitest";
import {
  buildNotFoundError,
  buildUpstreamError,
  formatToolError,
  type StructuredToolError,
} from "../../../../src/cli/spike-cli/core-logic/chat/tool-errors.js";
import type { NamespacedTool } from "../../../../src/cli/spike-cli/core-logic/multiplexer/server-manager.js";

const sampleTools: NamespacedTool[] = [
  {
    namespacedName: "chess__create_game",
    originalName: "create_game",
    serverName: "chess",
    description: "Create a chess game",
    inputSchema: { type: "object" },
  },
  {
    namespacedName: "chess__list_games",
    originalName: "list_games",
    serverName: "chess",
    description: "List chess games",
    inputSchema: { type: "object" },
  },
  {
    namespacedName: "image__generate",
    originalName: "generate",
    serverName: "image",
    description: "Generate an image",
    inputSchema: { type: "object" },
  },
];

describe("buildNotFoundError", () => {
  it("returns suggestions for similar tool names", () => {
    const error = buildNotFoundError("chess__create", sampleTools);
    expect(error.code).toBe("TOOL_NOT_FOUND");
    expect(error.retryable).toBe(false);
    expect(error.suggestions.length).toBeGreaterThan(0);
    expect(error.suggestions).toContain("chess__create_game");
    expect(error.hint).toContain("Did you mean");
  });

  it("returns fallback hint when no suggestions match", () => {
    const error = buildNotFoundError("zzzzzzz_nonexistent", sampleTools);
    expect(error.code).toBe("TOOL_NOT_FOUND");
    expect(error.suggestions).toHaveLength(0);
    expect(error.hint).toContain("tool_search");
  });

  it("limits suggestions to 3", () => {
    const manyTools = Array.from({ length: 20 }, (_, i) => ({
      namespacedName: `server__tool_${i}`,
      originalName: `tool_${i}`,
      serverName: "server",
      description: `Tool ${i}`,
      inputSchema: { type: "object" },
    }));
    const error = buildNotFoundError("tool", manyTools);
    expect(error.suggestions.length).toBeLessThanOrEqual(3);
  });
});

describe("buildUpstreamError", () => {
  it("classifies timeout errors", () => {
    const error = buildUpstreamError("my_tool", new Error("Request timed out after 30s"));
    expect(error.code).toBe("TIMEOUT");
    expect(error.retryable).toBe(true);
  });

  it("classifies disconnection errors", () => {
    const error = buildUpstreamError("my_tool", new Error("Server disconnected"));
    expect(error.code).toBe("SERVER_DISCONNECTED");
    expect(error.retryable).toBe(true);
  });

  it("classifies rate limiting", () => {
    const error = buildUpstreamError("my_tool", new Error("429 Too Many Requests"));
    expect(error.code).toBe("RATE_LIMITED");
    expect(error.retryable).toBe(true);
  });

  it("classifies validation errors", () => {
    const error = buildUpstreamError("my_tool", new Error("Validation failed: missing field"));
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.retryable).toBe(false);
  });

  it("classifies auth errors", () => {
    const error = buildUpstreamError("my_tool", new Error("401 Unauthorized"));
    expect(error.code).toBe("AUTH_ERROR");
    expect(error.retryable).toBe(false);
  });

  it("classifies server errors", () => {
    const error = buildUpstreamError("my_tool", new Error("500 Internal Server Error"));
    expect(error.code).toBe("SERVER_ERROR");
    expect(error.retryable).toBe(true);
  });

  it("handles unknown errors", () => {
    const error = buildUpstreamError("my_tool", new Error("Something weird happened"));
    expect(error.code).toBe("UNKNOWN_ERROR");
    expect(error.retryable).toBe(false);
  });

  it("handles non-Error values", () => {
    const error = buildUpstreamError("my_tool", "string error");
    expect(error.code).toBe("UNKNOWN_ERROR");
    expect(error.message).toContain("string error");
  });

  it("classifies ECONNREFUSED", () => {
    const error = buildUpstreamError("my_tool", new Error("connect ECONNREFUSED 127.0.0.1:3000"));
    expect(error.code).toBe("SERVER_DISCONNECTED");
    expect(error.retryable).toBe(true);
  });
});

describe("formatToolError", () => {
  it("formats error as JSON string", () => {
    const error: StructuredToolError = {
      code: "TIMEOUT",
      message: 'Tool "test" timed out',
      suggestions: ["retry"],
      retryable: true,
      hint: "Try again",
    };
    const formatted = formatToolError(error);
    const parsed = JSON.parse(formatted);
    expect(parsed.code).toBe("TIMEOUT");
    expect(parsed.retryable).toBe(true);
    expect(parsed.hint).toBe("Try again");
  });

  it("omits hint when not provided", () => {
    const error: StructuredToolError = {
      code: "UNKNOWN_ERROR",
      message: "failed",
      suggestions: [],
      retryable: false,
    };
    const formatted = formatToolError(error);
    const parsed = JSON.parse(formatted);
    expect(parsed.hint).toBeUndefined();
  });
});
