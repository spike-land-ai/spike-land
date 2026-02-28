import { auth } from "@/lib/auth";
import { logger } from "@/lib/errors/structured-logger";
import prisma from "@/lib/prisma";
import { tryCatch } from "@/lib/try-catch";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

type RouteParams = { params: Promise<{ id: string; }>; };

// POST /api/albums/[id]/images - Add images to album
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id: albumId } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check album ownership
  const { data: album, error: albumError } = await tryCatch(
    prisma.album.findUnique({
      where: { id: albumId },
      select: { userId: true },
    }),
  );

  if (albumError) {
    logger.error(
      "Failed to add images to album",
      albumError instanceof Error ? albumError : undefined,
      { route: "/api/albums/images" },
    );
    return NextResponse.json(
      { error: "Failed to add images to album" },
      { status: 500 },
    );
  }

  if (!album) {
    return NextResponse.json({ error: "Album not found" }, { status: 404 });
  }

  if (album.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: body, error: bodyError } = await tryCatch(request.json());

  if (bodyError) {
    logger.error(
      "Failed to add images to album",
      bodyError instanceof Error ? bodyError : undefined,
      { route: "/api/albums/images" },
    );
    return NextResponse.json(
      { error: "Failed to add images to album" },
      { status: 500 },
    );
  }

  const { imageIds } = body;

  if (!Array.isArray(imageIds) || imageIds.length === 0) {
    return NextResponse.json(
      { error: "Image IDs are required" },
      { status: 400 },
    );
  }

  // Verify all images belong to the user
  const { data: images, error: imagesError } = await tryCatch(
    prisma.enhancedImage.findMany({
      where: {
        id: { in: imageIds },
        userId: session.user.id,
      },
      select: { id: true },
    }),
  );

  if (imagesError) {
    logger.error(
      "Failed to add images to album",
      imagesError instanceof Error ? imagesError : undefined,
      { route: "/api/albums/images" },
    );
    return NextResponse.json(
      { error: "Failed to add images to album" },
      { status: 500 },
    );
  }

  if (images.length !== imageIds.length) {
    return NextResponse.json(
      { error: "Some images were not found or do not belong to you" },
      { status: 400 },
    );
  }

  // Get current max sort order in album
  const { data: maxSortOrder, error: maxSortOrderError } = await tryCatch(
    prisma.albumImage.aggregate({
      where: { albumId },
      _max: { sortOrder: true },
    }),
  );

  if (maxSortOrderError) {
    logger.error(
      "Failed to add images to album",
      maxSortOrderError instanceof Error ? maxSortOrderError : undefined,
      { route: "/api/albums/images" },
    );
    return NextResponse.json(
      { error: "Failed to add images to album" },
      { status: 500 },
    );
  }

  // Pre-calculate sort orders to avoid race condition in Promise.all
  const baseSortOrder = (maxSortOrder._max.sortOrder ?? -1) + 1;
  const sortOrders = Object.fromEntries(
    imageIds.map((id, idx) => [id, baseSortOrder + idx]),
  );

  // Batch-add images to album, skipping duplicates in a single query
  const { data: createResult, error: resultsError } = await tryCatch(
    prisma.albumImage.createMany({
      data: imageIds.map((imageId: string) => ({
        albumId,
        imageId,
        sortOrder: sortOrders[imageId],
      })),
      skipDuplicates: true,
    }),
  );

  if (resultsError) {
    logger.error(
      "Failed to add images to album",
      resultsError instanceof Error ? resultsError : undefined,
      { route: "/api/albums/images" },
    );
    return NextResponse.json(
      { error: "Failed to add images to album" },
      { status: 500 },
    );
  }

  const added = createResult.count;
  const results = imageIds.map((imageId: string) => ({
    imageId,
    success: true,
  }));

  return NextResponse.json({
    success: true,
    added,
    results,
  });
}

// DELETE /api/albums/[id]/images - Remove images from album
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id: albumId } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check album ownership
  const { data: album, error: albumError } = await tryCatch(
    prisma.album.findUnique({
      where: { id: albumId },
      select: { userId: true, coverImageId: true },
    }),
  );

  if (albumError) {
    logger.error(
      "Failed to remove images from album",
      albumError instanceof Error ? albumError : undefined,
      { route: "/api/albums/images" },
    );
    return NextResponse.json(
      { error: "Failed to remove images from album" },
      { status: 500 },
    );
  }

  if (!album) {
    return NextResponse.json({ error: "Album not found" }, { status: 404 });
  }

  if (album.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: body, error: bodyError } = await tryCatch(request.json());

  if (bodyError) {
    logger.error(
      "Failed to remove images from album",
      bodyError instanceof Error ? bodyError : undefined,
      { route: "/api/albums/images" },
    );
    return NextResponse.json(
      { error: "Failed to remove images from album" },
      { status: 500 },
    );
  }

  const { imageIds } = body;

  if (!Array.isArray(imageIds) || imageIds.length === 0) {
    return NextResponse.json(
      { error: "Image IDs are required" },
      { status: 400 },
    );
  }

  // Remove images from album
  const { data: result, error: deleteError } = await tryCatch(
    prisma.albumImage.deleteMany({
      where: {
        albumId,
        imageId: { in: imageIds },
      },
    }),
  );

  if (deleteError) {
    logger.error(
      "Failed to remove images from album",
      deleteError instanceof Error ? deleteError : undefined,
      { route: "/api/albums/images" },
    );
    return NextResponse.json(
      { error: "Failed to remove images from album" },
      { status: 500 },
    );
  }

  // If cover image was removed, clear the cover
  if (album.coverImageId && imageIds.includes(album.coverImageId)) {
    const { error: updateError } = await tryCatch(
      prisma.album.update({
        where: { id: albumId },
        data: { coverImageId: null },
      }),
    );

    if (updateError) {
      logger.error(
        "Failed to remove images from album",
        updateError instanceof Error ? updateError : undefined,
        { route: "/api/albums/images" },
      );
      return NextResponse.json(
        { error: "Failed to remove images from album" },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({
    success: true,
    removed: result.count,
  });
}

// PATCH /api/albums/[id]/images - Reorder images in album
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id: albumId } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check album ownership
  const { data: album, error: albumError } = await tryCatch(
    prisma.album.findUnique({
      where: { id: albumId },
      select: { userId: true },
    }),
  );

  if (albumError) {
    logger.error(
      "Failed to reorder images",
      albumError instanceof Error ? albumError : undefined,
      { route: "/api/albums/images" },
    );
    return NextResponse.json(
      { error: "Failed to reorder images" },
      { status: 500 },
    );
  }

  if (!album) {
    return NextResponse.json({ error: "Album not found" }, { status: 404 });
  }

  if (album.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: body, error: bodyError } = await tryCatch(request.json());

  if (bodyError) {
    logger.error(
      "Failed to reorder images",
      bodyError instanceof Error ? bodyError : undefined,
      { route: "/api/albums/images" },
    );
    return NextResponse.json(
      { error: "Failed to reorder images" },
      { status: 500 },
    );
  }

  const { imageOrder } = body;

  if (!Array.isArray(imageOrder)) {
    return NextResponse.json(
      { error: "Image order array is required" },
      { status: 400 },
    );
  }

  // Update sort order for each image
  const { error: transactionError } = await tryCatch(
    prisma.$transaction(
      imageOrder.map((imageId: string, index: number) =>
        prisma.albumImage.updateMany({
          where: { albumId, imageId },
          data: { sortOrder: index },
        })
      ),
    ),
  );

  if (transactionError) {
    logger.error(
      "Failed to reorder images",
      transactionError instanceof Error ? transactionError : undefined,
      { route: "/api/albums/images" },
    );
    return NextResponse.json(
      { error: "Failed to reorder images" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
