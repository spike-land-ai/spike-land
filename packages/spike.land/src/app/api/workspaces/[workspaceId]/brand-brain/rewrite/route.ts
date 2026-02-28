import { auth } from "@/lib/auth";
import { getCacheRaw, setCacheRaw } from "@/lib/cache";
import {
  rewriteContent,
  transformRewriteResult,
} from "@/lib/brand-brain/rewrite-content";
import { requireWorkspacePermission } from "@/lib/permissions/workspace-middleware";
import prisma from "@/lib/prisma";
import { checkRateLimit, rateLimitConfigs } from "@/lib/rate-limiter";
import { tryCatch } from "@/lib/try-catch";
import type { ColorUsage } from "@/lib/validations/brand-brain";
import {
  type ContentPlatform,
  contentRewriteRequestSchema,
  getPlatformLimit,
} from "@/lib/validations/brand-rewrite";
import crypto from "crypto";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { logger } from "@/lib/logger";

function buildRewriteCacheKey(
  workspaceId: string,
  profileVersion: number,
  content: string,
  platform: ContentPlatform,
): string {
  const contentHash = crypto
    .createHash("sha256")
    .update(content)
    .digest("hex")
    .slice(0, 16);
  return `brand-rewrite:${workspaceId}:v${profileVersion}:${platform}:${contentHash}`;
}

interface RouteParams {
  params: Promise<{ workspaceId: string; }>;
}

// POST /api/workspaces/[workspaceId]/brand-brain/rewrite
// Rewrite content to align with brand guidelines
export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  const { workspaceId } = await params;

  // Check permission (brand:write - rewriting modifies content)
  const { error: permError } = await tryCatch(
    requireWorkspacePermission(session, workspaceId, "brand:write"),
  );

  if (permError) {
    const status = permError.message.includes("Unauthorized") ? 401 : 403;
    return NextResponse.json({ error: permError.message }, { status });
  }

  const userId = session!.user!.id!;

  // Rate limiting (use brandRewriting config, or fallback to brandScoring)
  const rateLimitResult = await checkRateLimit(
    `brand-rewriting:${userId}`,
    rateLimitConfigs.brandRewriting ?? rateLimitConfigs.brandScoring,
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

  const validationResult = contentRewriteRequestSchema.safeParse(body);

  if (!validationResult.success) {
    return NextResponse.json(
      { error: "Validation failed", details: validationResult.error.flatten() },
      { status: 400 },
    );
  }

  const { content, platform } = validationResult.data;

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
  const cacheKey = buildRewriteCacheKey(
    workspaceId,
    brandProfile.version,
    content,
    platform,
  );

  const cachedRewrite = await getCacheRaw<Record<string, unknown>>(cacheKey);

  if (cachedRewrite) {
    // Return cached rewrite with cache metadata
    return NextResponse.json({
      ...cachedRewrite,
      cached: true,
      cachedAt: cachedRewrite.cachedAt,
    });
  }

  // Rewrite content using Gemini AI
  const { data: rewriteResult, error: rewriteError } = await tryCatch(
    rewriteContent({
      content,
      platform,
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

  if (rewriteError) {
    logger.error("Failed to rewrite content:", rewriteError);
    return NextResponse.json(
      { error: "Failed to rewrite content. Please try again later." },
      { status: 500 },
    );
  }

  // Store in database for history
  const { data: contentRewrite, error: dbError } = await tryCatch(
    prisma.contentRewrite.create({
      data: {
        workspaceId,
        brandProfileId: brandProfile.id,
        originalContent: content,
        rewrittenContent: rewriteResult.rewrittenContent,
        platform: platform as ContentPlatform,
        status: "COMPLETED",
        characterLimit: getPlatformLimit(platform),
        changes: rewriteResult.changes as unknown as undefined,
        toneAnalysis: rewriteResult.toneAnalysis as unknown as undefined,
        processedAt: new Date(),
        createdById: userId,
      },
    }),
  );

  if (dbError) {
    logger.warn("Failed to store rewrite history", { error: dbError });
    // Continue anyway - the rewrite was successful
  }

  // Transform to response format
  const rewriteResponse = transformRewriteResult(
    contentRewrite?.id ?? crypto.randomUUID(),
    content,
    rewriteResult,
    platform,
    false,
    new Date(),
  );

  // Cache the result
  await setCacheRaw(cacheKey, {
    ...rewriteResponse,
    cached: true,
    cachedAt: new Date().toISOString(),
  }, 3600);

  return NextResponse.json(rewriteResponse);
}
