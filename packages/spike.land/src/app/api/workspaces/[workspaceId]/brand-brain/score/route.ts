import { auth } from "@/lib/auth";
import { getCacheRaw, setCacheRaw } from "@/lib/cache";
import { scoreContent } from "@/lib/brand-brain/score-content";
import { requireWorkspacePermission } from "@/lib/permissions/workspace-middleware";
import prisma from "@/lib/prisma";
import { checkRateLimit, rateLimitConfigs } from "@/lib/rate-limiter";
import { tryCatch } from "@/lib/try-catch";
import type { ColorUsage } from "@/lib/validations/brand-brain";
import { contentScoreRequestSchema } from "@/lib/validations/brand-score";
import crypto from "crypto";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { logger } from "@/lib/logger";

function buildScoreCacheKey(
  workspaceId: string,
  profileVersion: number,
  content: string,
): string {
  const contentHash = crypto
    .createHash("sha256")
    .update(content)
    .digest("hex")
    .slice(0, 16);
  return `brand-score:${workspaceId}:v${profileVersion}:${contentHash}`;
}

interface RouteParams {
  params: Promise<{ workspaceId: string; }>;
}

// POST /api/workspaces/[workspaceId]/brand-brain/score
// Score content against brand guidelines
export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  const { workspaceId } = await params;

  // Check permission (brand:read - scoring is a read operation)
  const { error: permError } = await tryCatch(
    requireWorkspacePermission(session, workspaceId, "brand:read"),
  );

  if (permError) {
    const status = permError.message.includes("Unauthorized") ? 401 : 403;
    return NextResponse.json({ error: permError.message }, { status });
  }

  const userId = session!.user!.id!;

  // Rate limiting
  const rateLimitResult = await checkRateLimit(
    `brand-scoring:${userId}`,
    rateLimitConfigs.brandScoring,
  );

  if (rateLimitResult.isLimited) {
    const retryAfter = Math.ceil(
      (rateLimitResult.resetAt - Date.now()) / 1000,
    );
    return NextResponse.json(
      {
        error: "Rate limit exceeded",
        retryAfter,
        remaining: rateLimitResult.remaining,
      },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfter) },
      },
    );
  }

  // Parse and validate request body
  const { data: body, error: parseError } = await tryCatch(request.json());

  if (parseError) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const validationResult = contentScoreRequestSchema.safeParse(body);

  if (!validationResult.success) {
    return NextResponse.json(
      { error: "Validation failed", details: validationResult.error.flatten() },
      { status: 400 },
    );
  }

  const { content, contentType, strictMode } = validationResult.data;

  // Fetch brand profile with guardrails and vocabulary
  const { data: brandProfile, error: fetchError } = await tryCatch(
    prisma.brandProfile.findUnique({
      where: { workspaceId },
      include: {
        guardrails: {
          where: { isActive: true },
          orderBy: { createdAt: "asc" },
        },
        vocabulary: {
          where: { isActive: true },
          orderBy: { createdAt: "asc" },
        },
      },
    }),
  );

  if (fetchError) {
    logger.error("Failed to fetch brand profile:", fetchError);
    return NextResponse.json(
      { error: "Failed to fetch brand profile" },
      { status: 500 },
    );
  }

  if (!brandProfile) {
    return NextResponse.json(
      {
        error: "Brand profile not found. Please set up your brand profile first.",
      },
      { status: 404 },
    );
  }

  // Check cache
  const cacheKey = buildScoreCacheKey(
    workspaceId,
    brandProfile.version,
    content,
  );

  const cachedScore = await getCacheRaw<Record<string, unknown>>(cacheKey);

  if (cachedScore) {
    // Return cached score with cache metadata
    return NextResponse.json({
      ...cachedScore,
      cached: true,
      cachedAt: cachedScore.cachedAt,
    });
  }

  // Score content using Gemini AI
  const { data: scoreResult, error: scoreError } = await tryCatch(
    scoreContent({
      content,
      contentType,
      strictMode,
      brandProfile: {
        id: brandProfile.id,
        workspaceId: brandProfile.workspaceId,
        name: brandProfile.name,
        mission: brandProfile.mission,
        values: brandProfile.values as string[],
        toneDescriptors: brandProfile.toneDescriptors as {
          formalCasual: number;
          technicalSimple: number;
          seriousPlayful: number;
          reservedEnthusiastic: number;
        } | null,
        logoUrl: brandProfile.logoUrl,
        logoR2Key: brandProfile.logoR2Key,
        colorPalette: brandProfile.colorPalette as Array<{
          name: string;
          hex: string;
          usage?: ColorUsage;
        }>,
        version: brandProfile.version,
        isActive: brandProfile.isActive,
        createdAt: brandProfile.createdAt,
        updatedAt: brandProfile.updatedAt,
        createdById: brandProfile.createdById,
        updatedById: brandProfile.updatedById,
      },
      guardrails: brandProfile.guardrails.map(g => ({
        id: g.id,
        brandProfileId: g.brandProfileId,
        type: g.type as
          | "PROHIBITED_TOPIC"
          | "REQUIRED_DISCLOSURE"
          | "CONTENT_WARNING",
        name: g.name,
        description: g.description,
        severity: g.severity as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
        ruleConfig: g.ruleConfig as Record<string, unknown> | null,
        isActive: g.isActive,
        createdAt: g.createdAt,
        updatedAt: g.updatedAt,
      })),
      vocabulary: brandProfile.vocabulary.map(v => ({
        id: v.id,
        brandProfileId: v.brandProfileId,
        type: v.type as "PREFERRED" | "BANNED" | "REPLACEMENT",
        term: v.term,
        replacement: v.replacement,
        context: v.context,
        isActive: v.isActive,
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
      })),
    }),
  );

  if (scoreError) {
    logger.error("Failed to score content:", scoreError);
    return NextResponse.json(
      { error: "Failed to score content. Please try again later." },
      { status: 500 },
    );
  }

  // Cache the result
  const scoreWithCacheInfo = {
    ...scoreResult,
    cached: false,
    cachedAt: new Date().toISOString(),
  };

  await setCacheRaw(cacheKey, scoreWithCacheInfo, 3600);

  return NextResponse.json(scoreWithCacheInfo);
}
