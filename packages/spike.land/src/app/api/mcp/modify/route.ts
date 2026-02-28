import { authenticateMcpOrSession } from "@/lib/mcp/auth";
import { createModificationJob } from "@/lib/mcp/generation-service";
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
const VALID_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/**
 * Maximum image upload size in MB
 * Rationale:
 * - Gemini API accepts up to 20MB inline data
 * - 20MB allows high-res images (4K+) while preventing abuse
 * - Memory: 10 concurrent uploads × 20MB = 200MB worst case, acceptable
 */
const MAX_IMAGE_SIZE_MB = 20;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

/**
 * Maximum prompt length in characters
 * Rationale:
 * - Gemini API accepts much longer prompts, but 4000 chars is ample for modification instructions
 * - Prevents abuse (very long prompts could cause processing delays)
 * - Keeps modification instructions focused and effective
 */
const MAX_PROMPT_LENGTH = 4000;

/**
 * Detect MIME type from image URL or response headers
 */
function detectMimeType(url: string, contentType: string | null): string {
  // Try content-type header first
  if (contentType && VALID_MIME_TYPES.includes(contentType)) {
    return contentType;
  }

  // Fall back to URL extension
  const ext = (url.split("?")[0] ?? "").split(".").pop()?.toLowerCase();
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    default:
      return "image/jpeg"; // Default assumption
  }
}

/**
 * POST /api/mcp/modify
 *
 * Modify an existing image with a text prompt
 *
 * Headers:
 *   Authorization: Bearer <api_key>
 *
 * Body (JSON):
 *   {
 *     prompt: string (required) - Modification instructions
 *     tier: "TIER_1K" | "TIER_2K" | "TIER_4K" (required) - Output resolution
 *     image: string (optional) - Base64 encoded image data
 *     imageUrl: string (optional) - URL of image to fetch and modify
 *     mimeType: string (optional) - MIME type of the image (required if using base64 image)
 *   }
 *   Note: Either `image` or `imageUrl` must be provided
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
    `mcp:modify:${userId}`,
    rateLimitConfigs.mcpModify,
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
  const { data: body, error: parseError } = await tryCatch<{
    prompt?: string;
    tier?: string;
    image?: string;
    imageUrl?: string;
    mimeType?: string;
  }>(request.json());

  if (parseError) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { prompt, tier, image, imageUrl, mimeType } = body;

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

  // Validate that either image or imageUrl is provided
  if (
    (!image || typeof image !== "string")
    && (!imageUrl || typeof imageUrl !== "string")
  ) {
    return NextResponse.json(
      { error: "Either image (base64) or imageUrl must be provided" },
      { status: 400 },
    );
  }

  // Variables to hold final image data and mime type
  let finalImageData: string;
  let finalMimeType: string;

  // If imageUrl is provided, fetch the image
  if (imageUrl && typeof imageUrl === "string") {
    // Validate URL to prevent SSRF: only allow HTTPS and known safe domains
    const allowedImageDomains = [
      "pub-cf0adddb5752426a96ef090997e0da95.r2.dev",
      "spike.land",
    ];

    try {
      const parsedImageUrl = new URL(imageUrl);

      if (parsedImageUrl.protocol !== "https:") {
        return NextResponse.json(
          { error: "Only HTTPS image URLs are allowed" },
          { status: 400 },
        );
      }

      const domainAllowed = allowedImageDomains.some(
        domain =>
          parsedImageUrl.hostname === domain
          || parsedImageUrl.hostname.endsWith("." + domain),
      );

      if (!domainAllowed) {
        return NextResponse.json(
          { error: "Image URL domain not allowed" },
          { status: 400 },
        );
      }
    } catch {
      return NextResponse.json(
        { error: "Invalid image URL format" },
        { status: 400 },
      );
    }

    try {
      const imageResponse = await fetch(imageUrl, {
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      if (!imageResponse.ok) {
        return NextResponse.json(
          { error: `Failed to fetch image from URL: ${imageResponse.status}` },
          { status: 400 },
        );
      }

      const contentType = imageResponse.headers.get("content-type");
      finalMimeType = detectMimeType(imageUrl, contentType);

      if (!VALID_MIME_TYPES.includes(finalMimeType)) {
        return NextResponse.json(
          {
            error: `Invalid image type from URL. Must be one of: ${VALID_MIME_TYPES.join(", ")}`,
          },
          { status: 400 },
        );
      }

      const arrayBuffer = await imageResponse.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (buffer.length > MAX_IMAGE_SIZE_BYTES) {
        return NextResponse.json(
          {
            error: `Image from URL too large. Maximum size is ${MAX_IMAGE_SIZE_MB}MB`,
          },
          { status: 400 },
        );
      }

      finalImageData = buffer.toString("base64");
    } catch (fetchErr) {
      logger.error("Failed to fetch image from URL:", fetchErr);
      return NextResponse.json(
        { error: "Failed to fetch image from URL" },
        { status: 400 },
      );
    }
  } else {
    // Use provided base64 image
    // Validate mimeType is provided for base64 images
    if (!mimeType || !VALID_MIME_TYPES.includes(mimeType)) {
      return NextResponse.json(
        {
          error: `Invalid mimeType. Must be one of: ${VALID_MIME_TYPES.join(", ")}`,
        },
        { status: 400 },
      );
    }

    // Validate image size
    const imageSizeBytes = Buffer.from(image!, "base64").length;
    if (imageSizeBytes > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: `Image too large. Maximum size is ${MAX_IMAGE_SIZE_MB}MB`,
        },
        { status: 400 },
      );
    }

    finalImageData = image!;
    finalMimeType = mimeType;
  }

  const { data: result, error: jobError } = await tryCatch(
    createModificationJob({
      userId: userId!,
      apiKeyId,
      prompt: prompt.trim(),
      tier: tier as EnhancementTier,
      imageData: finalImageData,
      mimeType: finalMimeType,
    }),
  );

  if (jobError) {
    logger.error("Failed to create modification job:", jobError);
    return NextResponse.json(
      { error: "Failed to start image modification" },
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
    message: "Modification started. Poll /api/mcp/jobs/{jobId} for status.",
  });
}
