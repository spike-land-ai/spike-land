import type { Message } from "@spike-land-ai/code";
import type { CoreMessage } from "ai";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Code } from "../../../src/spike-land-backend/chatRoom";
import type Env from "../../../src/spike-land-backend/env";
import { StorageService } from "../../../src/spike-land-backend/services/storageService";
import { PostHandler } from "../../../src/spike-land-backend/handlers/postHandler";
import {
  createMockCode,
  createMockEnv,
  createMockStorageService,
  setupCrypto,
  setupStorageServiceMock,
} from "../../../src/spike-land-backend/handlers/postHandler.test-utils";

// Mock all external dependencies
vi.mock("@ai-sdk/anthropic");
vi.mock("ai");
vi.mock("../../../src/spike-land-backend/services/storageService");

// Setup crypto mock
setupCrypto();

describe("PostHandler - Messages", () => {
  let postHandler: PostHandler;
  let mockCode: Code;
  let mockEnv: Env;
  let mockStorageService: StorageService;

  beforeEach(() => {
    vi.clearAllMocks();

    mockCode = createMockCode();
    mockEnv = createMockEnv();
    mockStorageService = createMockStorageService();
    setupStorageServiceMock(StorageService, mockStorageService);

    postHandler = new PostHandler(mockCode, mockEnv);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("convertMessages", () => {
    const callConvertMessages = (messages: unknown[]) => {
      return (
        postHandler as unknown as {
          convertMessages: (messages: unknown[]) => CoreMessage[];
        }
      ).convertMessages(messages);
    };

    it("should convert string content messages", () => {
      const messages: Message[] = [
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi there" },
      ];

      const result = callConvertMessages(messages);

      expect(result).toEqual([
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi there" },
      ]);
    });

    it("should convert array content messages", () => {
      const messages: Message[] = [
        {
          role: "user",
          content: [
            { type: "text", text: "Hello" },
            {
              type: "image_url",
              image_url: { url: "https://example.com/img.jpg" },
            },
          ],
        },
      ];

      const result = callConvertMessages(messages);

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
      const messages: Message[] = [
        {
          role: "user",
          content: [
            { type: "text", text: "Valid" },
            "invalid" as unknown as { type: string; text?: string },
            { type: "unknown" } as unknown as { type: string; text?: string },
          ],
        },
      ];

      const result = callConvertMessages(messages);

      // Both "notexist" and "unknown" types fail the isMessageContentPart type guard
      // so they return "[invalid content]" (not "[unsupported content]")
      expect(result[0]?.content).toEqual([
        { type: "text", text: "Valid" },
        { type: "text", text: "[invalid content]" },
        { type: "text", text: "[invalid content]" },
      ]);
    });

    it("should handle missing text in text parts", () => {
      // { type: "text" } without a text property fails the isTextContentPart type guard
      // because the guard requires: "text" in part && typeof part.text === "string"
      const messages: Message[] = [
        {
          role: "user",
          content: [{ type: "text" } as { type: string; text?: string }],
        },
      ];

      const result = callConvertMessages(messages);

      // Since it fails the type guard, it returns "[invalid content]"
      expect(result[0]?.content).toEqual([
        {
          type: "text",
          text: "[invalid content]",
        },
      ]);
    });

    it("should handle invalid content format", () => {
      const messages: Message[] = [
        {
          role: "user",
          content: 123 as unknown as Message["content"],
        },
      ];

      const result = callConvertMessages(messages);

      expect(result).toEqual([
        {
          role: "user",
          content: "[invalid content format]",
        },
      ]);
    });

    it("should throw on invalid role", () => {
      const messages: Message[] = [
        {
          role: "invalid" as unknown as Message["role"],
          content: "test",
        },
      ];

      expect(() => callConvertMessages(messages)).toThrow("Invalid role: invalid");
    });

    it("should convert messages with parts field", () => {
      const messages = [
        {
          role: "user",
          parts: [{ type: "text", text: "Hello world" }],
        },
      ];

      const result = callConvertMessages(messages);

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

      const result = callConvertMessages(messages);

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
          parts: [
            {
              type: "image_url",
              image_url: { url: "https://example.com/img.jpg" },
            },
          ],
        },
      ];

      const result = callConvertMessages(messages);

      expect(result[0]?.content).toEqual([
        {
          type: "image",
          image: "https://example.com/img.jpg",
        },
      ]);
    });

    it("should handle unsupported part types", () => {
      const messages = [
        {
          role: "user",
          parts: [{ type: "video", url: "video.mp4" }],
        },
      ];

      const result = callConvertMessages(messages);

      // Single text part gets simplified to just string
      expect(result[0]?.content).toEqual("[unsupported content]");
    });

    it("should handle parts with missing text", () => {
      const messages = [
        {
          role: "user",
          parts: [{ type: "text" }],
        },
      ];

      const result = callConvertMessages(messages);

      expect(result).toEqual([{ role: "user", content: "" }]);
    });
  });

  describe("isMessageContentPart", () => {
    // Note: isMessageContentPart is imported from aiRoutes.ts, not a method on PostHandler
    // It's tested indirectly through convertMessages behavior above
    // Direct testing should be done in aiRoutes.spec.ts
    it("should be tested via convertMessages behavior", () => {
      // The type guard behavior is already tested through:
      // - "should handle invalid content parts" test
      // - "should handle missing text in text parts" test
      // These verify that invalid parts return "[invalid content]"
      expect(true).toBe(true);
    });
  });
});

describe("PostHandler - Messages extra branch coverage", () => {
  let postHandler: PostHandler;
  let mockCode: Code;
  let mockEnv: Env;
  let mockStorageService: StorageService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCode = createMockCode();
    mockEnv = createMockEnv();
    mockStorageService = createMockStorageService();
    setupStorageServiceMock(StorageService, mockStorageService);
    postHandler = new PostHandler(mockCode, mockEnv);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const callConvertMessages = (messages: unknown[]) => {
    return (
      postHandler as unknown as {
        convertMessages: (messages: unknown[]) => CoreMessage[];
      }
    ).convertMessages(messages);
  };

  describe("content array branches (lines 403, 405)", () => {
    it("should use empty string when text part has empty text (line 403 branch 1)", () => {
      // { type: "text", text: "" } passes isTextContentPart (empty string IS a string)
      // Then part.text || "" hits the || "" branch since "" is falsy
      const messages: Message[] = [
        {
          role: "user",
          content: [{ type: "text", text: "" }],
        },
      ];

      const result = callConvertMessages(messages);

      // In content array path, empty text part stays as array with empty text
      expect(result[0]?.content).toEqual([{ type: "text", text: "" }]);
    });

    it("should fall through to unsupported when image_url part has no image_url property (line 405 branch 1)", () => {
      // A part that passes isMessageContentPart but is image_url without the image_url property
      // can't normally happen, but we can pass a part that is image type (not image_url)
      // that doesn't match any condition after the type guard passes
      // Pass a tool_result part (passes type guard, but not text/image_url) → "[unsupported content]"
      const messages: Message[] = [
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

      const result = callConvertMessages(messages);

      expect(result[0]?.content).toEqual([{ type: "text", text: "[unsupported content]" }]);
    });
  });

  describe("parts array branches (lines 372-373)", () => {
    it("should use part.image as url fallback (line 372 branch 2)", () => {
      // part.image_url?.url is undefined, part.url is undefined, part.image is set
      const messages = [
        {
          role: "user",
          parts: [
            {
              type: "image",
              image: "https://example.com/direct-image.jpg",
              // no url, no image_url
            },
          ],
        },
      ];

      const result = callConvertMessages(messages);

      expect(result[0]?.content).toEqual([
        { type: "image", image: "https://example.com/direct-image.jpg" },
      ]);
    });

    it("should fall through to unsupported when image part has no url anywhere (line 373 branch 1)", () => {
      // type: "image" but no image_url.url, no url, no image → url is undefined → if(url) is false
      const messages = [
        {
          role: "user",
          parts: [
            {
              type: "image",
              // no url properties at all
            },
          ],
        },
      ];

      const result = callConvertMessages(messages);

      // Falls through to "[unsupported content]"
      expect(result[0]?.content).toEqual("[unsupported content]");
    });
  });
});
