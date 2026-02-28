import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { tryCatch } from "@/lib/try-catch";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

// GET /api/images - List user's images with pagination
export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
  const cursor = searchParams.get("cursor") || undefined;

  const { data: images, error } = await tryCatch(
    prisma.enhancedImage.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: limit + 1, // Take one extra to check if there are more
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1, // Skip the cursor itself
      }),
      select: {
        id: true,
        name: true,
        originalUrl: true,
        originalWidth: true,
        originalHeight: true,
        createdAt: true,
        enhancementJobs: {
          where: { status: "COMPLETED" },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            enhancedUrl: true,
            tier: true,
          },
        },
      },
    }),
  );

  if (error) {
    logger.error("Failed to fetch images:", error);
    return NextResponse.json(
      { error: "Failed to fetch images" },
      { status: 500 },
    );
  }

  // Check if there are more items
  const hasMore = images.length > limit;
  const resultImages = hasMore ? images.slice(0, limit) : images;
  const nextCursor = hasMore ? resultImages[resultImages.length - 1]?.id : null;

  return NextResponse.json({
    images: resultImages.map(image => ({
      id: image.id,
      name: image.name,
      url: image.originalUrl,
      width: image.originalWidth,
      height: image.originalHeight,
      createdAt: image.createdAt,
      hasEnhancement: image.enhancementJobs.length > 0,
      latestEnhancement: image.enhancementJobs[0] || null,
    })),
    nextCursor,
    hasMore,
  });
}
