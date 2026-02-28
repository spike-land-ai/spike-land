import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { tryCatch } from "@/lib/try-catch";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

// POST /api/images/move-to-album - Move images to an album
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: body, error: parseError } = await tryCatch(request.json());
  if (parseError) {
    logger.error("Failed to move images to album:", parseError);
    return NextResponse.json(
      { error: "Failed to move images to album" },
      { status: 500 },
    );
  }
  const { imageIds, targetAlbumId, removeFromSourceAlbum } = body;

  // Validate input
  if (!Array.isArray(imageIds) || imageIds.length === 0) {
    return NextResponse.json(
      { error: "Image IDs are required" },
      { status: 400 },
    );
  }

  // Validate max array length (100 items max)
  if (imageIds.length > 100) {
    return NextResponse.json(
      { error: "Cannot move more than 100 images at once" },
      { status: 400 },
    );
  }

  // Validate imageId format (CUID pattern: starts with 'c', followed by alphanumeric)
  const cuidPattern = /^c[a-z0-9]{24,}$/;
  const invalidIds = imageIds.filter(
    id => typeof id !== "string" || id.trim() === "" || !cuidPattern.test(id),
  );
  if (invalidIds.length > 0) {
    return NextResponse.json(
      {
        error: "Invalid image ID format",
        invalidIds: invalidIds.slice(0, 5), // Show first 5 invalid IDs
      },
      { status: 400 },
    );
  }

  // Deduplicate imageIds
  const uniqueImageIds = [...new Set(imageIds)];

  if (!targetAlbumId || typeof targetAlbumId !== "string") {
    return NextResponse.json(
      { error: "Target album ID is required" },
      { status: 400 },
    );
  }

  // Verify target album exists and belongs to user
  const { data: targetAlbum, error: targetAlbumError } = await tryCatch(
    prisma.album.findUnique({
      where: { id: targetAlbumId },
      select: { userId: true },
    }),
  );

  if (targetAlbumError) {
    logger.error("Failed to move images to album:", targetAlbumError);
    return NextResponse.json(
      { error: "Failed to move images to album" },
      { status: 500 },
    );
  }

  if (!targetAlbum) {
    return NextResponse.json(
      { error: "Target album not found" },
      { status: 404 },
    );
  }

  if (targetAlbum.userId !== session.user.id) {
    return NextResponse.json(
      { error: "You do not have permission to add images to this album" },
      { status: 403 },
    );
  }

  // Verify all images belong to the user
  const { data: images, error: imagesError } = await tryCatch(
    prisma.enhancedImage.findMany({
      where: {
        id: { in: uniqueImageIds },
        userId: session.user.id,
      },
      select: { id: true },
    }),
  );

  if (imagesError) {
    logger.error("Failed to move images to album:", imagesError);
    return NextResponse.json(
      { error: "Failed to move images to album" },
      { status: 500 },
    );
  }

  if (images.length !== uniqueImageIds.length) {
    return NextResponse.json(
      { error: "Some images were not found or do not belong to you" },
      { status: 400 },
    );
  }

  // If removing from source album, verify user owns that album too
  if (removeFromSourceAlbum && typeof removeFromSourceAlbum === "string") {
    const { data: sourceAlbum, error: sourceAlbumError } = await tryCatch(
      prisma.album.findUnique({
        where: { id: removeFromSourceAlbum },
        select: { userId: true },
      }),
    );

    if (sourceAlbumError) {
      logger.error("Failed to move images to album:", sourceAlbumError);
      return NextResponse.json(
        { error: "Failed to move images to album" },
        { status: 500 },
      );
    }

    if (!sourceAlbum) {
      return NextResponse.json(
        { error: "Source album not found" },
        { status: 404 },
      );
    }

    if (sourceAlbum.userId !== session.user.id) {
      return NextResponse.json(
        {
          error: "You do not have permission to remove images from the source album",
        },
        { status: 403 },
      );
    }
  }

  // Get current max sort order in target album
  const { data: maxSortOrder, error: aggregateError } = await tryCatch(
    prisma.albumImage.aggregate({
      where: { albumId: targetAlbumId },
      _max: { sortOrder: true },
    }),
  );

  if (aggregateError) {
    logger.error("Failed to move images to album:", aggregateError);
    return NextResponse.json(
      { error: "Failed to move images to album" },
      { status: 500 },
    );
  }

  // Pre-calculate sort orders to avoid race condition in Promise.all
  const baseSortOrder = (maxSortOrder._max.sortOrder ?? -1) + 1;
  const sortOrders = Object.fromEntries(
    uniqueImageIds.map((id, idx) => [id, baseSortOrder + idx]),
  );

  // Process each image
  const results = await Promise.all(
    uniqueImageIds.map(async (imageId: string) => {
      const sortOrder = sortOrders[imageId]; // Pre-calculated, immutable
      // Add to target album (use upsert to handle duplicates gracefully)
      const { data: albumImage, error: upsertError } = await tryCatch(
        prisma.albumImage.upsert({
          where: {
            albumId_imageId: {
              albumId: targetAlbumId,
              imageId,
            },
          },
          update: {
            // If already exists, just update the sort order
            sortOrder,
          },
          create: {
            albumId: targetAlbumId,
            imageId,
            sortOrder,
          },
        }),
      );

      if (upsertError) {
        logger.error(`Failed to move image ${imageId}:`, upsertError);
        return {
          imageId,
          success: false,
          error: upsertError instanceof Error
            ? upsertError.message
            : "Unknown error",
        };
      }

      // Remove from source album if requested
      if (
        removeFromSourceAlbum && typeof removeFromSourceAlbum === "string"
      ) {
        await prisma.albumImage.deleteMany({
          where: {
            albumId: removeFromSourceAlbum,
            imageId,
          },
        });
      }

      return {
        imageId,
        success: true,
        albumImageId: albumImage.id,
        alreadyInAlbum: albumImage.addedAt < new Date(Date.now() - 1000), // Check if existed before
      };
    }),
  );

  const moved = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const alreadyInAlbum = results.filter(r => r.success && r.alreadyInAlbum).length;

  return NextResponse.json({
    success: true,
    moved,
    failed,
    alreadyInAlbum,
    results,
  });
}
