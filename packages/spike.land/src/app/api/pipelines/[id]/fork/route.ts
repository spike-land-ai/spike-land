import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { tryCatch } from "@/lib/try-catch";
import type { Prisma } from "@prisma/client";
import { PipelineVisibility } from "@prisma/client";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

interface RouteParams {
  params: Promise<{ id: string; }>;
}

/**
 * Handle the fork pipeline logic
 */
async function handleForkPipeline(
  request: Request,
  id: string,
  userId: string,
): Promise<NextResponse> {
  // Fetch the source pipeline
  const source = await prisma.enhancementPipeline.findUnique({
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
    },
  });

  if (!source) {
    return NextResponse.json({ error: "Pipeline not found" }, {
      status: 404,
    });
  }

  // Check access - can fork if:
  // - Own pipeline
  // - System default (userId = null)
  // - Public pipeline
  // - Has share token (for LINK visibility)
  const isOwner = source.userId === userId;
  const isSystemDefault = source.userId === null;
  const isPublic = source.visibility === PipelineVisibility.PUBLIC;

  // Check for share token in query string for LINK visibility
  const url = new URL(request.url);
  const providedToken = url.searchParams.get("token");
  const hasValidToken = source.visibility === PipelineVisibility.LINK
    && source.shareToken
    && providedToken === source.shareToken;

  if (!isOwner && !isSystemDefault && !isPublic && !hasValidToken) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  // Parse optional name override from request body
  let customName: string | undefined;
  const { data: body } = await tryCatch(request.json());
  if (body) {
    customName = body.name;
  }

  // Create forked pipeline
  const forkedPipeline = await prisma.enhancementPipeline.create({
    data: {
      name: customName?.trim() || `${source.name} (copy)`,
      description: source.description,
      userId: userId,
      tier: source.tier,
      visibility: PipelineVisibility.PRIVATE, // Always private initially
      analysisConfig: source.analysisConfig as
        | Prisma.InputJsonValue
        | undefined,
      autoCropConfig: source.autoCropConfig as
        | Prisma.InputJsonValue
        | undefined,
      promptConfig: source.promptConfig as Prisma.InputJsonValue | undefined,
      generationConfig: source.generationConfig as
        | Prisma.InputJsonValue
        | undefined,
    },
    select: {
      id: true,
      name: true,
      description: true,
      userId: true,
      visibility: true,
      tier: true,
      analysisConfig: true,
      autoCropConfig: true,
      promptConfig: true,
      generationConfig: true,
      usageCount: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(
    {
      pipeline: {
        ...forkedPipeline,
        isOwner: true,
        isSystemDefault: false,
      },
      forkedFrom: source.id,
    },
    { status: 201 },
  );
}

/**
 * POST /api/pipelines/[id]/fork
 * Fork (copy) a pipeline to the current user's account
 */
export async function POST(request: Request, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const { data: response, error } = await tryCatch(
    handleForkPipeline(request, id, session.user.id),
  );

  if (error) {
    logger.error("Error forking pipeline:", error);
    return NextResponse.json(
      { error: "Failed to fork pipeline" },
      { status: 500 },
    );
  }

  return response;
}
