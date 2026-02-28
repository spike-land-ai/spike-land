import logger from "@/lib/logger";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { tryCatch } from "@/lib/try-catch";
import type { EnhancementTier } from "@prisma/client";
import { nanoid } from "nanoid";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

type RouteParams = { params: Promise<{ id: string; }>; };

// GET /api/albums/[id] - Get album details with images
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const session = await auth();

  const { data: album, error } = await tryCatch(
    prisma.album.findUnique({
      where: { id },
      include: {
        albumImages: {
          orderBy: { sortOrder: "asc" },
          include: {
            image: {
              select: {
                id: true,
                name: true,
                description: true,
                originalUrl: true,
                originalWidth: true,
                originalHeight: true,
                createdAt: true,
                enhancementJobs: {
                  where: { status: "COMPLETED" },
                  orderBy: { createdAt: "desc" },
                  take: 1,
                  select: {
                    enhancedUrl: true,
                    tier: true,
                  },
                },
              },
            },
          },
        },
        pipeline: {
          select: {
            id: true,
            name: true,
            tier: true,
          },
        },
        _count: {
          select: { albumImages: true },
        },
      },
    }),
  );

  if (error) {
    logger.error("Failed to fetch album:", error);
    return NextResponse.json(
      { error: "Failed to fetch album" },
      { status: 500 },
    );
  }

  if (!album) {
    return NextResponse.json({ error: "Album not found" }, { status: 404 });
  }

  // Check access permission
  const isOwner = session?.user?.id === album.userId;
  const isAccessible = isOwner || album.privacy === "PUBLIC"
    || album.privacy === "UNLISTED";

  if (!isAccessible) {
    return NextResponse.json({ error: "Album not found" }, { status: 404 });
  }

  return NextResponse.json({
    album: {
      id: album.id,
      name: album.name,
      description: album.description,
      privacy: album.privacy,
      coverImageId: album.coverImageId,
      shareToken: isOwner ? album.shareToken : undefined,
      pipelineId: album.pipelineId,
      defaultTier: album.defaultTier,
      pipeline: album.pipeline,
      imageCount: album._count.albumImages,
      isOwner,
      images: album.albumImages.map((ai: {
        image: {
          id: string;
          name: string;
          description: string | null;
          originalUrl: string;
          enhancementJobs: {
            enhancedUrl: string | null;
            tier: EnhancementTier;
          }[];
          originalWidth: number;
          originalHeight: number;
          createdAt: Date;
        };
        sortOrder: number;
      }) => ({
        id: ai.image.id,
        name: ai.image.name,
        description: ai.image.description,
        originalUrl: ai.image.originalUrl,
        enhancedUrl: ai.image.enhancementJobs[0]?.enhancedUrl,
        enhancementTier: ai.image.enhancementJobs[0]?.tier,
        width: ai.image.originalWidth,
        height: ai.image.originalHeight,
        sortOrder: ai.sortOrder,
        createdAt: ai.image.createdAt,
      })),
      createdAt: album.createdAt,
      updatedAt: album.updatedAt,
    },
  });
}

// PATCH /api/albums/[id] - Update album
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check ownership
  const { data: album, error: findError } = await tryCatch(
    prisma.album.findUnique({
      where: { id },
      select: { userId: true, shareToken: true },
    }),
  );

  if (findError) {
    logger.error("Failed to update album:", findError);
    return NextResponse.json(
      { error: "Failed to update album" },
      { status: 500 },
    );
  }

  if (!album) {
    return NextResponse.json({ error: "Album not found" }, { status: 404 });
  }

  if (album.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: body, error: parseError } = await tryCatch(request.json());

  if (parseError) {
    logger.error("Failed to update album:", parseError);
    return NextResponse.json(
      { error: "Failed to update album" },
      { status: 500 },
    );
  }

  const {
    name,
    description,
    privacy,
    coverImageId,
    pipelineId,
    defaultTier,
  } = body;

  const updateData: Record<string, unknown> = {};

  if (name !== undefined) {
    if (typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Album name is required" },
        { status: 400 },
      );
    }
    if (name.length > 100) {
      return NextResponse.json(
        { error: "Album name must be 100 characters or less" },
        { status: 400 },
      );
    }
    updateData.name = name.trim();
  }

  if (description !== undefined) {
    updateData.description = description?.trim() || null;
  }

  if (privacy !== undefined) {
    const validPrivacy = ["PRIVATE", "UNLISTED", "PUBLIC"];
    if (!validPrivacy.includes(privacy)) {
      return NextResponse.json(
        { error: "Invalid privacy setting" },
        { status: 400 },
      );
    }
    updateData.privacy = privacy;

    // Generate share token if changing from private to public/unlisted
    if (privacy !== "PRIVATE" && !album.shareToken) {
      updateData.shareToken = nanoid(12);
    }
    // Remove share token if changing to private
    if (privacy === "PRIVATE") {
      updateData.shareToken = null;
    }
  }

  if (coverImageId !== undefined) {
    if (coverImageId !== null) {
      // Verify the image exists in the album
      const { data: albumImage, error: albumImageError } = await tryCatch(
        prisma.albumImage.findFirst({
          where: { albumId: id, imageId: coverImageId },
        }),
      );
      if (albumImageError) {
        logger.error("Failed to update album:", albumImageError);
        return NextResponse.json(
          { error: "Failed to update album" },
          { status: 500 },
        );
      }
      if (!albumImage) {
        return NextResponse.json(
          { error: "Cover image must be in the album" },
          { status: 400 },
        );
      }
    }
    updateData.coverImageId = coverImageId;
  }

  // Handle pipelineId - validate access to the pipeline
  if (pipelineId !== undefined) {
    if (pipelineId !== null) {
      const { data: pipeline, error: pipelineError } = await tryCatch(
        prisma.enhancementPipeline.findUnique({
          where: { id: pipelineId },
          select: { userId: true, visibility: true },
        }),
      );

      if (pipelineError) {
        logger.error("Failed to update album:", pipelineError);
        return NextResponse.json(
          { error: "Failed to update album" },
          { status: 500 },
        );
      }

      if (!pipeline) {
        return NextResponse.json(
          { error: "Pipeline not found" },
          { status: 400 },
        );
      }

      // Verify access to the pipeline
      const isOwner = pipeline.userId === session.user.id;
      const isSystemDefault = pipeline.userId === null;
      const isPublic = pipeline.visibility === "PUBLIC";

      if (!isOwner && !isSystemDefault && !isPublic) {
        return NextResponse.json(
          { error: "You don't have access to this pipeline" },
          { status: 403 },
        );
      }
    }
    updateData.pipelineId = pipelineId;
  }

  // Handle defaultTier update
  if (defaultTier !== undefined) {
    const validTiers = ["TIER_1K", "TIER_2K", "TIER_4K"];
    if (!validTiers.includes(defaultTier)) {
      return NextResponse.json(
        { error: "Invalid tier" },
        { status: 400 },
      );
    }
    updateData.defaultTier = defaultTier;
  }

  const { data: updatedAlbum, error: updateError } = await tryCatch(
    prisma.album.update({
      where: { id },
      data: updateData,
    }),
  );

  if (updateError) {
    logger.error("Failed to update album:", updateError);
    return NextResponse.json(
      { error: "Failed to update album" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    album: {
      id: updatedAlbum.id,
      name: updatedAlbum.name,
      description: updatedAlbum.description,
      privacy: updatedAlbum.privacy,
      coverImageId: updatedAlbum.coverImageId,
      shareToken: updatedAlbum.shareToken,
      pipelineId: updatedAlbum.pipelineId,
      defaultTier: updatedAlbum.defaultTier,
      updatedAt: updatedAlbum.updatedAt,
    },
  });
}

// DELETE /api/albums/[id] - Delete album
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check ownership
  const { data: album, error: findError } = await tryCatch(
    prisma.album.findUnique({
      where: { id },
      select: { userId: true },
    }),
  );

  if (findError) {
    logger.error("Failed to delete album:", findError);
    return NextResponse.json(
      { error: "Failed to delete album" },
      { status: 500 },
    );
  }

  if (!album) {
    return NextResponse.json({ error: "Album not found" }, { status: 404 });
  }

  if (album.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error: deleteError } = await tryCatch(
    prisma.album.delete({ where: { id } }),
  );

  if (deleteError) {
    logger.error("Failed to delete album:", deleteError);
    return NextResponse.json(
      { error: "Failed to delete album" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
