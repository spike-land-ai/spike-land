import { describe, expect, it } from "vitest";

import {
  ANALYSIS_TIMEOUT_MS,
  DEFAULT_MODEL,
  DEFAULT_TEMPERATURE,
  GEMINI_TIMEOUT_MS,
  getModelForTier,
  supportsImageSize,
  VALID_GEMINI_MODELS,
} from "./gemini-models";

describe("gemini-models", () => {
  describe("VALID_GEMINI_MODELS", () => {
    it("should contain only the available image model", () => {
      expect(VALID_GEMINI_MODELS).toHaveLength(1);
      expect(VALID_GEMINI_MODELS).toContain("gemini-3.1-flash-image-preview");
    });
  });

  describe("getModelForTier", () => {
    it("should return gemini-3.1-flash-image-preview for FREE tier", () => {
      expect(getModelForTier("FREE")).toBe("gemini-3.1-flash-image-preview");
    });

    it("should return gemini-3.1-flash-image-preview for TIER_1K", () => {
      expect(getModelForTier("TIER_1K")).toBe("gemini-3.1-flash-image-preview");
    });

    it("should return gemini-3.1-flash-image-preview for TIER_2K", () => {
      expect(getModelForTier("TIER_2K")).toBe("gemini-3.1-flash-image-preview");
    });

    it("should return gemini-3.1-flash-image-preview for TIER_4K", () => {
      expect(getModelForTier("TIER_4K")).toBe("gemini-3.1-flash-image-preview");
    });
  });

  describe("DEFAULT_MODEL and DEFAULT_TEMPERATURE", () => {
    it("should use gemini-3.1-flash-image-preview as default model", () => {
      expect(DEFAULT_MODEL).toBe("gemini-3.1-flash-image-preview");
    });

    it("should have null default temperature (uses API defaults)", () => {
      expect(DEFAULT_TEMPERATURE).toBeNull();
    });
  });

  describe("supportsImageSize", () => {
    it("should return true for gemini-3.1-flash-image-preview", () => {
      expect(supportsImageSize("gemini-3.1-flash-image-preview")).toBe(true);
    });

    it("should return false for unknown model names", () => {
      expect(supportsImageSize("some-other-model")).toBe(false);
    });
  });

  describe("timeout constants", () => {
    it("should have GEMINI_TIMEOUT_MS as a positive number", () => {
      expect(GEMINI_TIMEOUT_MS).toBeGreaterThan(0);
      expect(typeof GEMINI_TIMEOUT_MS).toBe("number");
    });

    it("should default to 10 minutes (600000ms) when env not set", () => {
      // The default is 10 * 60 * 1000 = 600000
      expect(GEMINI_TIMEOUT_MS).toBe(600000);
    });

    it("should have ANALYSIS_TIMEOUT_MS as a positive number", () => {
      expect(ANALYSIS_TIMEOUT_MS).toBeGreaterThan(0);
      expect(typeof ANALYSIS_TIMEOUT_MS).toBe("number");
    });

    it("should default to 30 seconds (30000ms) when env not set", () => {
      expect(ANALYSIS_TIMEOUT_MS).toBe(30000);
    });
  });
});
