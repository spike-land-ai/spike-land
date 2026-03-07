import { describe, it, expect, vi, beforeEach } from "vitest";
import { StudioEngine } from "../studio-engine";
import { callTool, parseToolResult } from "../../api/client";

vi.mock("../../api/client", () => ({
  callTool: vi.fn(),
  parseToolResult: vi.fn(),
}));

describe("StudioEngine", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("generateAsset", () => {
    it("should call callTool with img_generate and prompt, and parse the result", async () => {
      const mockResult = { content: [{ type: "text", text: '{"id": "123"}' }] };
      const parsedMockResult = { id: "123" };

      vi.mocked(callTool).mockResolvedValue(mockResult);
      vi.mocked(parseToolResult).mockReturnValue(parsedMockResult);

      const prompt = "a cute cat";
      const options = { width: 512, height: 512 };

      const result = await StudioEngine.generateAsset(prompt, options);

      expect(callTool).toHaveBeenCalledTimes(1);
      expect(callTool).toHaveBeenCalledWith("img_generate", {
        prompt,
        ...options,
      });

      expect(parseToolResult).toHaveBeenCalledTimes(1);
      expect(parseToolResult).toHaveBeenCalledWith(mockResult);

      expect(result).toBe(parsedMockResult);
    });

    it("should work with no options provided", async () => {
      const mockResult = { content: [{ type: "text", text: '{"id": "123"}' }] };
      const parsedMockResult = { id: "123" };

      vi.mocked(callTool).mockResolvedValue(mockResult);
      vi.mocked(parseToolResult).mockReturnValue(parsedMockResult);

      const prompt = "a cute cat";

      const result = await StudioEngine.generateAsset(prompt);

      expect(callTool).toHaveBeenCalledTimes(1);
      expect(callTool).toHaveBeenCalledWith("img_generate", {
        prompt,
      });

      expect(parseToolResult).toHaveBeenCalledTimes(1);
      expect(parseToolResult).toHaveBeenCalledWith(mockResult);

      expect(result).toBe(parsedMockResult);
    });
  });

  describe("smartEnhance", () => {
    it("should call callTool with img_enhance and TIER_2K, and parse the result", async () => {
      const mockResult = { content: [{ type: "text", text: '{"jobId": "job-123"}' }] };
      const parsedMockResult = { jobId: "job-123" };

      vi.mocked(callTool).mockResolvedValue(mockResult);
      vi.mocked(parseToolResult).mockReturnValue(parsedMockResult);

      const imageId = "img-456";

      const result = await StudioEngine.smartEnhance(imageId);

      expect(callTool).toHaveBeenCalledTimes(1);
      expect(callTool).toHaveBeenCalledWith("img_enhance", {
        image_id: imageId,
        tier: "TIER_2K",
      });

      expect(parseToolResult).toHaveBeenCalledTimes(1);
      expect(parseToolResult).toHaveBeenCalledWith(mockResult);

      expect(result).toBe(parsedMockResult);
    });
  });

  describe("brandify", () => {
    it("should call callTool with img_generate and reference images, and parse the result", async () => {
      const mockResult = { content: [{ type: "text", text: '{"id": "789"}' }] };
      const parsedMockResult = { id: "789" };

      vi.mocked(callTool).mockResolvedValue(mockResult);
      vi.mocked(parseToolResult).mockReturnValue(parsedMockResult);

      const sourceImageId = "src-img-001";
      const targetPrompt = "make it cyberpunk";

      const result = await StudioEngine.brandify(sourceImageId, targetPrompt);

      expect(callTool).toHaveBeenCalledTimes(1);
      expect(callTool).toHaveBeenCalledWith("img_generate", {
        prompt: targetPrompt,
        reference_images: [{ image_id: sourceImageId, role: "style" }],
      });

      expect(parseToolResult).toHaveBeenCalledTimes(1);
      expect(parseToolResult).toHaveBeenCalledWith(mockResult);

      expect(result).toBe(parsedMockResult);
    });
  });

  describe("createSocialPack", () => {
    it("should call callTool with img_crop for multiple platforms and return an array of parsed results", async () => {
      const mockResult1 = { content: [{ type: "text", text: '{"id": "crop-1"}' }] };
      const mockResult2 = { content: [{ type: "text", text: '{"id": "crop-2"}' }] };
      const mockResult3 = { content: [{ type: "text", text: '{"id": "crop-3"}' }] };

      const parsedMockResult1 = { id: "crop-1" };
      const parsedMockResult2 = { id: "crop-2" };
      const parsedMockResult3 = { id: "crop-3" };

      vi.mocked(callTool)
        .mockResolvedValueOnce(mockResult1)
        .mockResolvedValueOnce(mockResult2)
        .mockResolvedValueOnce(mockResult3);

      vi.mocked(parseToolResult)
        .mockReturnValueOnce(parsedMockResult1)
        .mockReturnValueOnce(parsedMockResult2)
        .mockReturnValueOnce(parsedMockResult3);

      const imageId = "base-img-123";

      const results = await StudioEngine.createSocialPack(imageId);

      expect(callTool).toHaveBeenCalledTimes(3);
      expect(callTool).toHaveBeenNthCalledWith(1, "img_crop", {
        image_id: imageId,
        preset: "instagram_square",
      });
      expect(callTool).toHaveBeenNthCalledWith(2, "img_crop", {
        image_id: imageId,
        preset: "twitter_header",
      });
      expect(callTool).toHaveBeenNthCalledWith(3, "img_crop", {
        image_id: imageId,
        preset: "linkedin_banner",
      });

      expect(parseToolResult).toHaveBeenCalledTimes(3);
      expect(parseToolResult).toHaveBeenNthCalledWith(1, mockResult1);
      expect(parseToolResult).toHaveBeenNthCalledWith(2, mockResult2);
      expect(parseToolResult).toHaveBeenNthCalledWith(3, mockResult3);

      expect(results).toEqual([parsedMockResult1, parsedMockResult2, parsedMockResult3]);
    });
  });
});
