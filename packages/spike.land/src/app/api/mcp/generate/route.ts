import {
  type AspectRatio,
  isValidAspectRatio,
  SUPPORTED_ASPECT_RATIOS,
} from "@/lib/ai/aspect-ratio";
import { authenticateMcpOrSession } from "@/lib/mcp/auth";
import { createGenerationJob } from "@/lib/mcp/generation-service";
import { checkRateLimit, rateLimitConfigs } from "@/lib/rate-limiter";
import type { EnhancementTier } from "@/lib/credits/costs";
import { MCP_GENERATION_COSTS } from "@/lib/credits/costs";
import { tryCatch } from "@/lib/try-catch";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

// Force dynamic rendering - skip static page data collection
export const dynamic = "force-dynamic";

const VALID_TIERS: EnhancementTier[] = ["TIER_1K", "TIER_2K", "TIER_4K"];

/**
 * Maximum prompt length in characters
 * Rationale:
 * - Gemini API accepts much longer prompts, but 4000 chars is ample for image descriptions
 * - Prevents abuse (very long prompts could cause processing delays)
 * - Encourages concise, effective prompts for better generation results
 */
const MAX_PROMPT_LENGTH = 4000;

/**
 * POST /api/mcp/generate
 *
 * Generate a new image from a text prompt
 *
 * Headers:
 *   Authorization: Bearer <api_key>
 *
 * Body:
 *   {
 *     prompt: string (required) - Text description of the image to generate
 *     tier: "TIER_1K" | "TIER_2K" | "TIER_4K" (required) - Output resolution
 *     negativePrompt?: string - Things to avoid in the generation
 *     aspectRatio?: string - Output aspect ratio (default: "1:1")
 *       Supported: 1:1, 3:2, 2:3, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9
 *   }
 *
 * Response:
 *   {
 *     success: true,
 *     jobId: string,
 *     creditsCost: number
 *   }
 */
export async function POST(request: NextRequest) {
  // Authenticate via API key or session
  const authResult = await authenticateMcpOrSession(request);
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  const { userId, apiKeyId } = authResult;

  // Rate limiting
  const rateLimitResult = await checkRateLimit(
    `mcp:generate:${userId}`,
    rateLimitConfigs.mcpGenerate,
  );

  if (rateLimitResult.isLimited) {
    const retryAfter = Math.ceil(
      (rateLimitResult.resetAt - Date.now()) / 1000,
    );
    return NextResponse.json(
      {
        error: "Rate limit exceeded",
        retryAfter,
      },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfter) },
      },
    );
  }

  // Parse and validate request body
  const { data: body, error: jsonError } = await tryCatch<{
    prompt?: string;
    tier?: string;
    negativePrompt?: string;
    aspectRatio?: string;
  }>(request.json());

  if (jsonError) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { prompt, tier, negativePrompt, aspectRatio } = body;

  // Validate prompt
  if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
    return NextResponse.json(
      { error: "Prompt is required" },
      { status: 400 },
    );
  }

  if (prompt.length > MAX_PROMPT_LENGTH) {
    return NextResponse.json(
      { error: `Prompt must be ${MAX_PROMPT_LENGTH} characters or less` },
      { status: 400 },
    );
  }

  // Validate tier
  if (!tier || !VALID_TIERS.includes(tier as EnhancementTier)) {
    return NextResponse.json(
      {
        error: `Invalid tier. Must be one of: ${VALID_TIERS.join(", ")}`,
        pricing: Object.entries(MCP_GENERATION_COSTS).map(([t, cost]) => ({
          tier: t,
          cost,
        })),
      },
      { status: 400 },
    );
  }

  // Validate aspectRatio if provided
  if (aspectRatio && !isValidAspectRatio(aspectRatio)) {
    return NextResponse.json(
      {
        error: `Invalid aspectRatio. Must be one of: ${SUPPORTED_ASPECT_RATIOS.join(", ")}`,
      },
      { status: 400 },
    );
  }

  const { data: result, error: jobError } = await tryCatch(
    createGenerationJob({
      userId: userId!,
      apiKeyId,
      prompt: prompt.trim(),
      tier: tier as EnhancementTier,
      negativePrompt: negativePrompt?.trim(),
      aspectRatio: aspectRatio as AspectRatio | undefined,
    }),
  );

  if (jobError) {
    logger.error("Failed to create generation job:", jobError);
    return NextResponse.json(
      { error: "Failed to start image generation" },
      { status: 500 },
    );
  }

  if (!result.success) {
    // Determine appropriate status code
    const status = result.error?.includes("Insufficient") ? 402 : 500;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({
    success: true,
    jobId: result.jobId,
    creditsCost: result.creditsCost,
    message: "Generation started. Poll /api/mcp/jobs/{jobId} for status.",
  });
}
