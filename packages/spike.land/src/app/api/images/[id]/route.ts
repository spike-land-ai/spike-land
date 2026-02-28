import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { deleteFromR2 } from "@/lib/storage/r2-client";
import { tryCatch } from "@/lib/try-catch";
import type { EnhancementTier, JobStatus } from "@prisma/client";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; }>; },
) {
  const { data: session, error: authError } = await tryCatch(auth());
  if (authError) {
    logger.error("Error in GET image API:", authError);
    return NextResponse.json(
      {
        error: authError instanceof Error
          ? authError.message
          : "Failed to fetch image",
      },
      { status: 500 },
    );
  }

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Find the image
  const { data: image, error: findError } = await tryCatch(
    prisma.enhancedImage.findUnique({
      where: { id },
      include: {
        enhancementJobs: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    }),
  );

  if (findError) {
    logger.error("Error in GET image API:", findError);
    return NextResponse.json(
      {
        error: findError instanceof Error
          ? findError.message
          : "Failed to fetch image",
      },
      { status: 500 },
    );
  }

  if (!image) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  // Check if user has access (owner or public image)
  if (image.userId !== session.user.id && !image.isPublic) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    success: true,
    image: {
      id: image.id,
      name: image.name,
      description: image.description,
      originalUrl: image.originalUrl,
      originalWidth: image.originalWidth,
      originalHeight: image.originalHeight,
      originalSizeBytes: image.originalSizeBytes,
      originalFormat: image.originalFormat,
      isPublic: image.isPublic,
      viewCount: image.viewCount,
      createdAt: image.createdAt,
      updatedAt: image.updatedAt,
      jobs: image.enhancementJobs.map((job: {
        id: string;
        tier: EnhancementTier;
        status: JobStatus;
        creditsCost: number;
        enhancedUrl: string | null;
        enhancedWidth: number | null;
        enhancedHeight: number | null;
        enhancedSizeBytes: number | null;
        errorMessage: string | null;
        createdAt: Date;
        processingStartedAt: Date | null;
        processingCompletedAt: Date | null;
      }) => ({
        id: job.id,
        tier: job.tier,
        status: job.status,
        creditsCost: job.creditsCost,
        enhancedUrl: job.enhancedUrl,
        enhancedWidth: job.enhancedWidth,
        enhancedHeight: job.enhancedHeight,
        enhancedSizeBytes: job.enhancedSizeBytes,
        errorMessage: job.errorMessage,
        createdAt: job.createdAt,
        processingStartedAt: job.processingStartedAt,
        processingCompletedAt: job.processingCompletedAt,
      })),
    },
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; }>; },
) {
  const { data: session, error: authError } = await tryCatch(auth());
  if (authError) {
    logger.error("Error in delete API:", authError);
    return NextResponse.json(
      {
        error: authError instanceof Error ? authError.message : "Delete failed",
      },
      { status: 500 },
    );
  }

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Find the image and verify ownership
  const { data: image, error: findError } = await tryCatch(
    prisma.enhancedImage.findUnique({
      where: { id },
      include: {
        enhancementJobs: true,
      },
    }),
  );

  if (findError) {
    logger.error("Error in delete API:", findError);
    return NextResponse.json(
      {
        error: findError instanceof Error ? findError.message : "Delete failed",
      },
      { status: 500 },
    );
  }

  if (!image) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  if (image.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Transactional approach: Delete R2 files first, then DB
  // This ensures no orphaned database records without R2 files

  // Step 1: Collect all R2 keys to delete
  const r2KeysToDelete: string[] = [image.originalR2Key];
  for (const job of image.enhancementJobs) {
    if (job.enhancedR2Key) {
      r2KeysToDelete.push(job.enhancedR2Key);
    }
  }

  // Step 2: Delete all R2 files first
  const { data: deleteResults, error: r2Error } = await tryCatch(
    Promise.all(r2KeysToDelete.map(key => deleteFromR2(key))),
  );

  if (r2Error) {
    logger.error("Error in delete API:", r2Error);
    return NextResponse.json(
      { error: r2Error instanceof Error ? r2Error.message : "Delete failed" },
      { status: 500 },
    );
  }

  // Step 3: Check if any deletions failed
  const failedDeletions = deleteResults.filter(result => !result.success);
  if (failedDeletions.length > 0) {
    const errors = failedDeletions
      .map(result => `${result.key}: ${result.error}`)
      .join(", ");
    return NextResponse.json(
      { error: `Failed to delete R2 files: ${errors}` },
      { status: 500 },
    );
  }

  // Step 4: Only delete from database if all R2 deletions succeeded
  const { error: deleteError } = await tryCatch(
    prisma.enhancedImage.delete({
      where: { id },
    }),
  );

  if (deleteError) {
    logger.error("Error in delete API:", deleteError);
    return NextResponse.json(
      {
        error: deleteError instanceof Error
          ? deleteError.message
          : "Delete failed",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    message: "Image deleted successfully",
  });
}
