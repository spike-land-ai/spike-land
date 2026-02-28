import logger from "@/lib/logger";

import { auth } from "@/lib/auth";
import { validatePipelineConfigs } from "@/lib/ai/pipeline-validation";
import prisma from "@/lib/prisma";
import { tryCatch } from "@/lib/try-catch";
import type { EnhancementTier } from "@prisma/client";
import { PipelineVisibility } from "@prisma/client";
import { NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string; }>;
}

/**
 * GET /api/pipelines/[id]
 * Get a specific pipeline
 */
export async function GET(_request: Request, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const { data: pipeline, error } = await tryCatch(
    prisma.enhancementPipeline.findUnique({
      where: { id },
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
        _count: {
          select: {
            albums: true,
            jobs: true,
          },
        },
      },
    }),
  );

  if (error) {
    logger.error("Error fetching pipeline:", error);
    return NextResponse.json(
      { error: "Failed to fetch pipeline" },
      { status: 500 },
    );
  }

  if (!pipeline) {
    return NextResponse.json({ error: "Pipeline not found" }, {
      status: 404,
    });
  }

  // Check access
  const isOwner = pipeline.userId === session.user.id;
  const isSystemDefault = pipeline.userId === null;
  const isPublic = pipeline.visibility === PipelineVisibility.PUBLIC;

  // Check for share token in query string for LINK visibility
  const url = new URL(_request.url);
  const providedToken = url.searchParams.get("token");
  const hasValidToken = pipeline.visibility === PipelineVisibility.LINK
    && pipeline.shareToken
    && providedToken === pipeline.shareToken;

  if (!isOwner && !isSystemDefault && !isPublic && !hasValidToken) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  return NextResponse.json({
    pipeline: {
      ...pipeline,
      isOwner,
      isSystemDefault,
      albumCount: pipeline._count.albums,
      jobCount: pipeline._count.jobs,
    },
  });
}

/**
 * PATCH /api/pipelines/[id]
 * Update a pipeline
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Check ownership
  const { data: existing, error: findError } = await tryCatch(
    prisma.enhancementPipeline.findUnique({
      where: { id },
      select: { userId: true },
    }),
  );

  if (findError) {
    logger.error("Error updating pipeline:", findError);
    return NextResponse.json(
      { error: "Failed to update pipeline" },
      { status: 500 },
    );
  }

  if (!existing) {
    return NextResponse.json({ error: "Pipeline not found" }, {
      status: 404,
    });
  }

  if (existing.userId !== session.user.id) {
    return NextResponse.json(
      { error: "Only the owner can update this pipeline" },
      { status: 403 },
    );
  }

  const { data: body, error: parseError } = await tryCatch(request.json());

  if (parseError) {
    logger.error("Error updating pipeline:", parseError);
    return NextResponse.json(
      { error: "Failed to update pipeline" },
      { status: 500 },
    );
  }

  const name = body.name;
  const description = body.description;
  const tier = body.tier;
  const visibility = body.visibility;
  const analysisConfig = body.analysisConfig;
  const autoCropConfig = body.autoCropConfig;
  const promptConfig = body.promptConfig;
  const generationConfig = body.generationConfig;

  // Validate name if provided
  if (name !== undefined) {
    if (typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Pipeline name cannot be empty" },
        { status: 400 },
      );
    }
    if (name.length > 100) {
      return NextResponse.json(
        { error: "Pipeline name must be 100 characters or less" },
        { status: 400 },
      );
    }
  }

  // Validate tier if provided
  if (tier !== undefined) {
    const validTiers: EnhancementTier[] = ["TIER_1K", "TIER_2K", "TIER_4K"];
    if (!validTiers.includes(tier)) {
      return NextResponse.json(
        { error: `Invalid tier. Must be one of: ${validTiers.join(", ")}` },
        { status: 400 },
      );
    }
  }

  // Validate visibility if provided
  if (visibility !== undefined) {
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

  // Build update data
  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name.trim();
  if (description !== undefined) {
    updateData.description = description?.trim() || null;
  }
  if (tier !== undefined) updateData.tier = tier;
  if (visibility !== undefined) {
    updateData.visibility = visibility;
    // Generate share token when switching to LINK visibility
    if (visibility === "LINK") {
      const { data: current, error: currentError } = await tryCatch(
        prisma.enhancementPipeline.findUnique({
          where: { id },
          select: { shareToken: true },
        }),
      );
      if (currentError) {
        logger.error("Error updating pipeline:", currentError);
        return NextResponse.json(
          { error: "Failed to update pipeline" },
          { status: 500 },
        );
      }
      if (!current?.shareToken) {
        updateData.shareToken = crypto.randomUUID();
      }
    }
  }
  if (analysisConfig !== undefined) {
    updateData.analysisConfig = analysisConfig;
  }
  if (autoCropConfig !== undefined) {
    updateData.autoCropConfig = autoCropConfig;
  }
  if (promptConfig !== undefined) updateData.promptConfig = promptConfig;
  if (generationConfig !== undefined) {
    updateData.generationConfig = generationConfig;
  }

  const { data: pipeline, error: updateError } = await tryCatch(
    prisma.enhancementPipeline.update({
      where: { id },
      data: updateData,
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

  if (updateError) {
    logger.error("Error updating pipeline:", updateError);
    return NextResponse.json(
      { error: "Failed to update pipeline" },
      { status: 500 },
    );
  }

  return NextResponse.json({ pipeline });
}

/**
 * DELETE /api/pipelines/[id]
 * Delete a pipeline
 */
export async function DELETE(_request: Request, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Check ownership and usage
  const { data: existing, error: findError } = await tryCatch(
    prisma.enhancementPipeline.findUnique({
      where: { id },
      select: {
        userId: true,
        _count: {
          select: {
            albums: true,
          },
        },
      },
    }),
  );

  if (findError) {
    logger.error("Error deleting pipeline:", findError);
    return NextResponse.json(
      { error: "Failed to delete pipeline" },
      { status: 500 },
    );
  }

  if (!existing) {
    return NextResponse.json({ error: "Pipeline not found" }, {
      status: 404,
    });
  }

  if (existing.userId !== session.user.id) {
    return NextResponse.json(
      { error: "Only the owner can delete this pipeline" },
      { status: 403 },
    );
  }

  // Check if pipeline is in use by albums
  if (existing._count.albums > 0) {
    return NextResponse.json(
      {
        error:
          `Cannot delete pipeline: it is being used by ${existing._count.albums} album(s). Remove pipeline from albums first.`,
      },
      { status: 400 },
    );
  }

  const { error: deleteError } = await tryCatch(
    prisma.enhancementPipeline.delete({
      where: { id },
    }),
  );

  if (deleteError) {
    logger.error("Error deleting pipeline:", deleteError);
    return NextResponse.json(
      { error: "Failed to delete pipeline" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
