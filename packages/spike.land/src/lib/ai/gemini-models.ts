/**
 * Gemini model configuration: allowlists, tier mapping, and capability checks.
 */

/**
 * Known valid Gemini models for image generation.
 * This allowlist prevents runtime errors from invalid model names.
 */
export const VALID_GEMINI_MODELS = [
  "gemini-3.1-flash-image-preview",
] as const;

/**
 * Model mapping by enhancement tier.
 * All tiers use gemini-3.1-flash-image-preview (only available image model).
 */
const TIER_MODELS = {
  FREE: "gemini-3.1-flash-image-preview",
  TIER_1K: "gemini-3.1-flash-image-preview",
  TIER_2K: "gemini-3.1-flash-image-preview",
  TIER_4K: "gemini-3.1-flash-image-preview",
} as const;

type TierModelKey = keyof typeof TIER_MODELS;

/**
 * Get the appropriate model for a given enhancement tier.
 * @param tier - The enhancement tier
 * @returns The Gemini model name to use
 */
export function getModelForTier(tier: TierModelKey): string {
  return TIER_MODELS[tier];
}

/**
 * Default model for image generation.
 */
export const DEFAULT_MODEL = "gemini-3.1-flash-image-preview";
export const DEFAULT_TEMPERATURE: number | null = null; // Uses Gemini API defaults

/**
 * Check if a model supports the imageSize parameter.
 */
export function supportsImageSize(model: string): boolean {
  return model === "gemini-3.1-flash-image-preview";
}

// Timeout for Gemini API requests (configurable via env, default 10 minutes)
// 4K images can take up to 3-5 minutes or more depending on queue/complexity,
// so 10 minutes provides a safe buffer while preventing indefinite hangs
export const GEMINI_TIMEOUT_MS = parseInt(
  process.env.GEMINI_TIMEOUT_MS || String(10 * 60 * 1000),
  10,
);

// Timeout for vision analysis stage (configurable via env, default 30 seconds)
// Analysis should be fast - if it times out, we fall back to default prompt
export const ANALYSIS_TIMEOUT_MS = parseInt(
  process.env.ANALYSIS_TIMEOUT_MS || String(30 * 1000),
  10,
);
