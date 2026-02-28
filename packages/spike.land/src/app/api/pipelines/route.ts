import { auth } from "@/lib/auth";
import { SYSTEM_DEFAULT_PIPELINE } from "@/lib/ai/pipeline-types";
import { validatePipelineConfigs } from "@/lib/ai/pipeline-validation";
import prisma from "@/lib/prisma";
import { tryCatch } from "@/lib/try-catch";
import type { EnhancementTier } from "@prisma/client";
import { PipelineVisibility } from "@prisma/client";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

// Maximum number of pipelines a user can create
const MAX_PIPELINES_PER_USER = 50;

// Default pagination settings
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

/**
 * GET /api/pipelines
 * List pipelines accessible to the current user:
 * - User's own pipelines
 * - Public pipelines from other users
 *
 * Query parameters:
 * - page: Page number (default: 0)
 * - limit: Number of items per page (default: 50, max: 100)
 */
export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse pagination parameters from URL
  const { searchParams } = new URL(request.url);
  const page = Math.max(0, parseInt(searchParams.get("page") || "0", 10));
  const limit = Math.min(
    MAX_PAGE_SIZE,
    Math.max(
      1,
      parseInt(searchParams.get("limit") || String(DEFAULT_PAGE_SIZE), 10),
    ),
  );
  const skip = page * limit;

  // Get total count for pagination metadata
  const { data: totalCount, error: countError } = await tryCatch(
    prisma.enhancementPipeline.count({
      where: {
        OR: [
          { userId: session.user.id },
          { visibility: PipelineVisibility.PUBLIC },
          { userId: null },
        ],
      },
    }),
  );

  if (countError) {
    logger.error("Error listing pipelines:", countError);
    return NextResponse.json(
      { error: "Failed to list pipelines" },
      { status: 500 },
    );
  }

  const { data: pipelines, error: pipelinesError } = await tryCatch(
    prisma.enhancementPipeline.findMany({
      where: {
        OR: [
          { userId: session.user.id }, // User's own pipelines
          { visibility: PipelineVisibility.PUBLIC }, // Public pipelines
          { userId: null }, // System defaults
        ],
      },
      orderBy: [
        { userId: "asc" }, // System defaults first (null)
        { usageCount: "desc" }, // Then by popularity
        { createdAt: "desc" },
      ],
      select: {
        id: true,
        name: true,
        description: true,
        userId: true,
        visibility: true,
        tier: true,
        usageCount: true,
        createdAt: true,
        updatedAt: true,
        analysisConfig: true,
        autoCropConfig: true,
        promptConfig: true,
        generationConfig: true,
      },
      skip,
      take: limit,
    }),
  );

  if (pipelinesError) {
    logger.error("Error listing pipelines:", pipelinesError);
    return NextResponse.json(
      { error: "Failed to list pipelines" },
      { status: 500 },
    );
  }

  // Add isOwner and isSystemDefault flags
  const pipelinesWithFlags = pipelines.map(p => ({
    ...p,
    isOwner: p.userId === session.user.id,
    isSystemDefault: p.userId === null,
  }));

  return NextResponse.json({
    pipelines: pipelinesWithFlags,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      hasMore: skip + pipelines.length < totalCount,
    },
  });
}

/**
 * POST /api/pipelines
 * Create a new pipeline
 */
export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limiting: Check user's pipeline count
  const { data: userPipelineCount, error: countError } = await tryCatch(
    prisma.enhancementPipeline.count({
      where: { userId: session.user.id },
    }),
  );

  if (countError) {
    logger.error("Error creating pipeline:", countError);
    return NextResponse.json(
      { error: "Failed to create pipeline" },
      { status: 500 },
    );
  }

  if (userPipelineCount >= MAX_PIPELINES_PER_USER) {
    return NextResponse.json(
      {
        error:
          `Pipeline limit exceeded. Maximum ${MAX_PIPELINES_PER_USER} pipelines allowed per user.`,
      },
      { status: 429 },
    );
  }

  const { data: body, error: bodyError } = await tryCatch(request.json());

  if (bodyError) {
    logger.error("Error creating pipeline:", bodyError);
    return NextResponse.json(
      { error: "Failed to create pipeline" },
      { status: 500 },
    );
  }

  const {
    name,
    description,
    tier = "TIER_1K",
    visibility = "PRIVATE",
    analysisConfig,
    autoCropConfig,
    promptConfig,
    generationConfig,
  } = body;

  // Validate required fields
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json(
      { error: "Pipeline name is required" },
      { status: 400 },
    );
  }

  if (name.length > 100) {
    return NextResponse.json(
      { error: "Pipeline name must be 100 characters or less" },
      { status: 400 },
    );
  }

  // Validate tier
  const validTiers: EnhancementTier[] = ["TIER_1K", "TIER_2K", "TIER_4K"];
  if (!validTiers.includes(tier)) {
    return NextResponse.json(
      { error: `Invalid tier. Must be one of: ${validTiers.join(", ")}` },
      { status: 400 },
    );
  }

  // Validate visibility
  const validVisibilities: PipelineVisibility[] = [
    "PRIVATE",
    "PUBLIC",
    "LINK",
  ];
  if (!validVisibilities.includes(visibility)) {
    return NextResponse.json(
      {
        error: `Invalid visibility. Must be one of: ${validVisibilities.join(", ")}`,
      },
      { status: 400 },
    );
  }

  // Validate config objects if provided
  const configValidation = validatePipelineConfigs({
    analysisConfig,
    autoCropConfig,
    promptConfig,
    generationConfig,
  });

  if (!configValidation.valid) {
    return NextResponse.json(
      {
        error: "Invalid configuration",
        details: configValidation.errors,
      },
      { status: 400 },
    );
  }

  // Create pipeline with defaults merged
  const { data: pipeline, error: createError } = await tryCatch(
    prisma.enhancementPipeline.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        userId: session.user.id,
        tier,
        visibility,
        analysisConfig: analysisConfig ?? SYSTEM_DEFAULT_PIPELINE.analysis,
        autoCropConfig: autoCropConfig ?? SYSTEM_DEFAULT_PIPELINE.autoCrop,
        promptConfig: promptConfig ?? SYSTEM_DEFAULT_PIPELINE.prompt,
        generationConfig: generationConfig
          ?? SYSTEM_DEFAULT_PIPELINE.generation,
        // Generate share token for LINK visibility
        shareToken: visibility === "LINK" ? crypto.randomUUID() : null,
      },
      select: {
        id: true,
        name: true,
        description: true,
        userId: true,
        visibility: true,
        shareToken: true,
        tier: true,
        analysisConfig: true,
        autoCropConfig: true,
        promptConfig: true,
        generationConfig: true,
        usageCount: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
  );

  if (createError) {
    logger.error("Error creating pipeline:", createError);
    return NextResponse.json(
      { error: "Failed to create pipeline" },
      { status: 500 },
    );
  }

  return NextResponse.json({ pipeline }, { status: 201 });
}
