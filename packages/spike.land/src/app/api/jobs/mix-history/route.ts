import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { tryCatch } from "@/lib/try-catch";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

// GET /api/jobs/mix-history - Fetch user's mix/blend history
export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 50);

  const { data: mixJobs, error } = await tryCatch(
    prisma.imageEnhancementJob.findMany({
      where: {
        userId: session.user.id,
        sourceImageId: { not: null }, // Only jobs with blend source
        status: { not: "CANCELLED" },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        tier: true,
        status: true,
        currentStage: true,
        enhancedUrl: true,
        enhancedWidth: true,
        enhancedHeight: true,
        createdAt: true,
        // Target image (the base image)
        image: {
          select: {
            id: true,
            name: true,
            originalUrl: true,
            originalWidth: true,
            originalHeight: true,
          },
        },
        // Source image (the blend source)
        sourceImage: {
          select: {
            id: true,
            name: true,
            originalUrl: true,
            originalWidth: true,
            originalHeight: true,
          },
        },
      },
    }),
  );

  if (error) {
    logger.error("Failed to fetch mix history:", error);
    return NextResponse.json(
      { error: "Failed to fetch mix history" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    mixes: mixJobs.map(job => ({
      id: job.id,
      tier: job.tier,
      status: job.status,
      currentStage: job.currentStage,
      resultUrl: job.enhancedUrl,
      resultWidth: job.enhancedWidth,
      resultHeight: job.enhancedHeight,
      createdAt: job.createdAt,
      targetImage: job.image
        ? {
          id: job.image.id,
          name: job.image.name,
          url: job.image.originalUrl,
          width: job.image.originalWidth,
          height: job.image.originalHeight,
        }
        : null,
      sourceImage: job.sourceImage
        ? {
          id: job.sourceImage.id,
          name: job.sourceImage.name,
          url: job.sourceImage.originalUrl,
          width: job.sourceImage.originalWidth,
          height: job.sourceImage.originalHeight,
        }
        : null,
    })),
  });
}
