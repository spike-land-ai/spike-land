/**
 * Tests for types/aiRoutes.ts type guards
 * Covers lines 96-128 (isImageContentPart, isToolUseContentPart, isToolResultContentPart)
 */
import { describe, expect, it } from "vitest";
import {
  isImageContentPart,
  isImageUrlContentPart,
  isTextContentPart,
  isToolResultContentPart,
  isToolUseContentPart,
} from "../../../src/spike-land-backend/types/aiRoutes.js";

describe("types/aiRoutes type guards", () => {
  describe("isTextContentPart", () => {
    it("returns true for valid TextContentPart", () => {
      expect(isTextContentPart({ type: "text", text: "hello" })).toBe(true);
    });

    it("returns false for null", () => {
      expect(isTextContentPart(null)).toBe(false);
    });

    it("returns false for non-object", () => {
      expect(isTextContentPart("string")).toBe(false);
    });

    it("returns false for wrong type", () => {
      expect(isTextContentPart({ type: "image", text: "hello" })).toBe(false);
    });

    it("returns false for missing text", () => {
      expect(isTextContentPart({ type: "text" })).toBe(false);
    });

    it("returns false for non-string text", () => {
      expect(isTextContentPart({ type: "text", text: 42 })).toBe(false);
    });
  });

  describe("isImageUrlContentPart", () => {
    it("returns true for valid ImageUrlContentPart", () => {
      expect(isImageUrlContentPart({
        type: "image_url",
        image_url: { url: "https://example.com/img.png" },
      })).toBe(true);
    });

    it("returns false for null image_url", () => {
      expect(isImageUrlContentPart({
        type: "image_url",
        image_url: null,
      })).toBe(false);
    });

    it("returns false for missing image_url.url", () => {
      expect(isImageUrlContentPart({
        type: "image_url",
        image_url: { url: 42 },
      })).toBe(false);
    });

    it("returns false for wrong type", () => {
      expect(isImageUrlContentPart({
        type: "image",
        image_url: { url: "https://example.com/img.png" },
      })).toBe(false);
    });
  });

  describe("isImageContentPart (lines 96-103)", () => {
    it("returns true for valid ImageContentPart", () => {
      expect(isImageContentPart({
        type: "image",
        image: "base64encodedstring",
      })).toBe(true);
    });

    it("returns false for null", () => {
      expect(isImageContentPart(null)).toBe(false);
    });

    it("returns false for non-object", () => {
      expect(isImageContentPart(42)).toBe(false);
    });

    it("returns false for missing type", () => {
      expect(isImageContentPart({ image: "data" })).toBe(false);
    });

    it("returns false for wrong type value", () => {
      expect(isImageContentPart({ type: "text", image: "data" })).toBe(false);
    });

    it("returns false for missing image field", () => {
      expect(isImageContentPart({ type: "image" })).toBe(false);
    });

    it("returns false for non-string image", () => {
      expect(isImageContentPart({ type: "image", image: 123 })).toBe(false);
    });
  });

  describe("isToolUseContentPart (lines 108-121)", () => {
    it("returns true for valid ToolUseContentPart", () => {
      expect(isToolUseContentPart({
        type: "tool_use",
        id: "tool-123",
        name: "get_weather",
        input: { location: "NYC" },
      })).toBe(true);
    });

    it("returns false for null", () => {
      expect(isToolUseContentPart(null)).toBe(false);
    });

    it("returns false for wrong type", () => {
      expect(isToolUseContentPart({
        type: "text",
        id: "tool-123",
        name: "get_weather",
        input: {},
      })).toBe(false);
    });

    it("returns false for missing id", () => {
      expect(isToolUseContentPart({
        type: "tool_use",
        name: "get_weather",
        input: {},
      })).toBe(false);
    });

    it("returns false for non-string id", () => {
      expect(isToolUseContentPart({
        type: "tool_use",
        id: 42,
        name: "get_weather",
        input: {},
      })).toBe(false);
    });

    it("returns false for missing name", () => {
      expect(isToolUseContentPart({
        type: "tool_use",
        id: "tool-123",
        input: {},
      })).toBe(false);
    });

    it("returns false for non-string name", () => {
      expect(isToolUseContentPart({
        type: "tool_use",
        id: "tool-123",
        name: 42,
        input: {},
      })).toBe(false);
    });

    it("returns false for missing input", () => {
      expect(isToolUseContentPart({
        type: "tool_use",
        id: "tool-123",
        name: "get_weather",
      })).toBe(false);
    });

    it("returns false for non-object input", () => {
      expect(isToolUseContentPart({
        type: "tool_use",
        id: "tool-123",
        name: "get_weather",
        input: "not an object",
      })).toBe(false);
    });
  });

  describe("isToolResultContentPart (lines 126-136)", () => {
    it("returns true for valid ToolResultContentPart with string content", () => {
      expect(isToolResultContentPart({
        type: "tool_result",
        tool_use_id: "tool-123",
        content: "The weather is sunny",
      })).toBe(true);
    });

    it("returns true for valid ToolResultContentPart with array content", () => {
      expect(isToolResultContentPart({
        type: "tool_result",
        tool_use_id: "tool-123",
        content: [{ type: "text", text: "sunny" }],
      })).toBe(true);
    });

    it("returns false for null", () => {
      expect(isToolResultContentPart(null)).toBe(false);
    });

    it("returns false for wrong type", () => {
      expect(isToolResultContentPart({
        type: "tool_use",
        tool_use_id: "tool-123",
        content: "result",
      })).toBe(false);
    });

    it("returns false for missing tool_use_id", () => {
      expect(isToolResultContentPart({
        type: "tool_result",
        content: "result",
      })).toBe(false);
    });

    it("returns false for non-string tool_use_id", () => {
      expect(isToolResultContentPart({
        type: "tool_result",
        tool_use_id: 42,
        content: "result",
      })).toBe(false);
    });

    it("returns false for missing content", () => {
      expect(isToolResultContentPart({
        type: "tool_result",
        tool_use_id: "tool-123",
      })).toBe(false);
    });
  });
});
