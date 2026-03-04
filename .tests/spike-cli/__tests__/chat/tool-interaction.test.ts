import { describe, expect, it, vi } from "vitest";
import type { Interface as ReadlineInterface } from "node:readline";
import {
  coerceValue,
  extractIdsFromResult,
  promptForParam,
} from "../../../../src/spike-cli/chat/tool-interaction.js";

describe("coerceValue", () => {
  it("converts to number", () => {
    expect(coerceValue("42", "number")).toBe(42);
    expect(coerceValue("3.14", "number")).toBe(3.14);
  });

  it("converts to integer", () => {
    expect(coerceValue("7", "integer")).toBe(7);
  });

  it("converts to boolean", () => {
    expect(coerceValue("true", "boolean")).toBe(true);
    expect(coerceValue("1", "boolean")).toBe(true);
    expect(coerceValue("false", "boolean")).toBe(false);
    expect(coerceValue("no", "boolean")).toBe(false);
  });

  it("parses array from JSON", () => {
    expect(coerceValue("[1,2,3]", "array")).toEqual([1, 2, 3]);
  });

  it("returns raw string for invalid array JSON", () => {
    expect(coerceValue("not-json", "array")).toBe("not-json");
  });

  it("parses object from JSON", () => {
    expect(coerceValue('{"key":"val"}', "object")).toEqual({ key: "val" });
  });

  it("returns raw string for invalid object JSON", () => {
    expect(coerceValue("not-json", "object")).toBe("not-json");
  });

  it("returns string for default/unknown type", () => {
    expect(coerceValue("hello", "string")).toBe("hello");
    expect(coerceValue("world", "unknown")).toBe("world");
  });
});

describe("extractIdsFromResult", () => {
  it("extracts id from JSON result", () => {
    const ids = extractIdsFromResult(JSON.stringify({ id: "abc123" }));
    expect(ids).toContain("abc123");
  });

  it("extracts multiple IDs from JSON result", () => {
    const ids = extractIdsFromResult(
      JSON.stringify({ id: "a1", game_id: "g2", player_id: "p3" }),
    );
    expect(ids).toContain("a1");
    expect(ids).toContain("g2");
    expect(ids).toContain("p3");
  });

  it("skips non-string ID values", () => {
    const ids = extractIdsFromResult(JSON.stringify({ id: 42 }));
    expect(ids).toHaveLength(0);
  });

  it("returns empty array for non-JSON input", () => {
    const ids = extractIdsFromResult("not valid json");
    expect(ids).toEqual([]);
  });

  it("returns empty array for empty JSON object", () => {
    const ids = extractIdsFromResult("{}");
    expect(ids).toEqual([]);
  });
});

describe("promptForParam", () => {
  it("prompts and returns trimmed answer", async () => {
    const mockRl = {
      question: vi.fn((_, cb: (answer: string) => void) => {
        cb("  my-answer  ");
      }),
    } as unknown as ReadlineInterface;

    const result = await promptForParam(mockRl, {
      name: "testParam",
      description: "A test parameter",
      type: "string",
    });
    expect(result).toBe("my-answer");
  });

  it("includes type hint for non-string types", async () => {
    const mockRl = {
      question: vi.fn((prompt: string, cb: (answer: string) => void) => {
        expect(prompt).toContain("[number]");
        cb("42");
      }),
    } as unknown as ReadlineInterface;

    await promptForParam(mockRl, {
      name: "count",
      description: "",
      type: "number",
    });
  });

  it("excludes type hint for string type", async () => {
    const mockRl = {
      question: vi.fn((prompt: string, cb: (answer: string) => void) => {
        expect(prompt).not.toContain("[string]");
        cb("value");
      }),
    } as unknown as ReadlineInterface;

    await promptForParam(mockRl, {
      name: "name",
      description: "Your name",
      type: "string",
    });
  });
});
