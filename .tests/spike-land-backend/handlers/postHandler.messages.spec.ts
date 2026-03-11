import type { Message } from "@spike-land-ai/code";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { convertMessages } from "../../../src/edge-api/backend/lazy-imports/message-converter";
import type { ChatMessage } from "../../../src/edge-api/backend/ai/gemini-stream";

describe("PostHandler - Messages (convertMessages)", () => {
  describe("convertMessages", () => {
    it("should convert string content messages", () => {
      const messages = [
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi there" },
      ];

      const result = convertMessages(messages);

      expect(result).toEqual([
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi there" },
      ]);
    });

    it("should convert array content messages", () => {
      const messages = [
        {
          role: "user",
          content: [
            { type: "text", text: "Hello" },
            { type: "image_url", image_url: { url: "https://example.com/img.jpg" } },
          ],
        },
      ];

      const result = convertMessages(messages);

      expect(result).toEqual([
        {
          role: "user",
          content: [
            { type: "text", text: "Hello" },
            { type: "image", image: "https://example.com/img.jpg" },
          ],
        },
      ]);
    });

    it("should handle invalid content parts", () => {
      const messages = [
        {
          role: "user",
          content: [
            { type: "text", text: "Valid" },
            "invalid" as unknown as { type: string; text?: string },
            { type: "unknown" } as unknown as { type: string; text?: string },
          ],
        },
      ];

      const result = convertMessages(messages);

      // "invalid" (string) fails isMessageContentPart → "[invalid content]"
      // { type: "unknown" } passes isMessageContentPart but is not text/image_url → "[unsupported content]"
      expect(result[0]?.content).toEqual([
        { type: "text", text: "Valid" },
        { type: "text", text: "[invalid content]" },
        { type: "text", text: "[unsupported content]" },
      ]);
    });

    it("should handle missing text in text parts", () => {
      const messages = [
        {
          role: "user",
          content: [{ type: "text" } as { type: string; text?: string }],
        },
      ];

      const result = convertMessages(messages);

      // { type: "text" } passes isMessageContentPart (has type string),
      // matches type === "text" branch, text is undefined → fallback ""
      expect(result[0]?.content).toEqual([{ type: "text", text: "" }]);
    });

    it("should handle invalid content format", () => {
      const messages = [
        {
          role: "user",
          content: 123 as unknown as string,
        },
      ];

      const result = convertMessages(messages);

      expect(result).toEqual([{ role: "user", content: "[invalid content format]" }]);
    });

    it("should throw on invalid role", () => {
      const messages = [{ role: "invalid" as unknown as string, content: "test" }];

      expect(() => convertMessages(messages)).toThrow("Invalid role: invalid");
    });

    it("should convert messages with parts field", () => {
      const messages = [{ role: "user", parts: [{ type: "text", text: "Hello world" }] }];

      const result = convertMessages(messages);

      expect(result).toEqual([{ role: "user", content: "Hello world" }]);
    });

    it("should convert messages with multiple parts", () => {
      const messages = [
        {
          role: "user",
          parts: [
            { type: "text", text: "Check this image:" },
            { type: "image", url: "https://example.com/img.jpg" },
          ],
        },
      ];

      const result = convertMessages(messages);

      expect(result).toEqual([
        {
          role: "user",
          content: [
            { type: "text", text: "Check this image:" },
            { type: "image", image: "https://example.com/img.jpg" },
          ],
        },
      ]);
    });

    it("should handle parts with image_url format", () => {
      const messages = [
        {
          role: "user",
          parts: [{ type: "image_url", image_url: { url: "https://example.com/img.jpg" } }],
        },
      ];

      const result = convertMessages(messages);

      expect(result[0]?.content).toEqual([{ type: "image", image: "https://example.com/img.jpg" }]);
    });

    it("should handle unsupported part types", () => {
      const messages = [{ role: "user", parts: [{ type: "video", url: "video.mp4" }] }];

      const result = convertMessages(messages);

      expect(result[0]?.content).toEqual("[unsupported content]");
    });

    it("should handle parts with missing text", () => {
      const messages = [{ role: "user", parts: [{ type: "text" }] }];

      const result = convertMessages(messages);

      expect(result).toEqual([{ role: "user", content: "" }]);
    });
  });

  describe("content array branches", () => {
    it("should use empty string when text part has empty text", () => {
      const messages = [{ role: "user", content: [{ type: "text", text: "" }] }];

      const result = convertMessages(messages);

      expect(result[0]?.content).toEqual([{ type: "text", text: "" }]);
    });

    it("should fall through to unsupported for non-text/image_url parts", () => {
      const messages = [
        {
          role: "user",
          content: [
            {
              type: "tool_result",
              tool_use_id: "tool-1",
              content: "result",
            } as unknown as { type: string; text?: string },
          ],
        },
      ];

      const result = convertMessages(messages);

      expect(result[0]?.content).toEqual([{ type: "text", text: "[unsupported content]" }]);
    });
  });

  describe("parts array branches", () => {
    it("should use part.image as url fallback", () => {
      const messages = [
        {
          role: "user",
          parts: [{ type: "image", image: "https://example.com/direct-image.jpg" }],
        },
      ];

      const result = convertMessages(messages);

      expect(result[0]?.content).toEqual([
        { type: "image", image: "https://example.com/direct-image.jpg" },
      ]);
    });

    it("should fall through to unsupported when image part has no url anywhere", () => {
      const messages = [{ role: "user", parts: [{ type: "image" }] }];

      const result = convertMessages(messages);

      expect(result[0]?.content).toEqual("[unsupported content]");
    });
  });
});
