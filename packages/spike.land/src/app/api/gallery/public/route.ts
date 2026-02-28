import prisma from "@/lib/prisma";
import type { EnhancementTier } from "@prisma/client";
import { JobStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
  const tags = searchParams.get("tags")?.split(",").filter(Boolean) || [];
  const tier = searchParams.get("tier") as EnhancementTier | undefined;

  const where = {
    isPublic: true,
    ...(tags.length > 0 && { tags: { hasSome: tags } }),
    ...(tier && {
      enhancementJobs: {
        some: {
          tier,
          status: JobStatus.COMPLETED,
        },
      },
    }),
  };

  try {
    const [images, total] = await Promise.all([
      prisma.enhancedImage.findMany({
        where,
        include: {
          enhancementJobs: {
            where: { status: JobStatus.COMPLETED },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              id: true,
              tier: true,
              status: true,
              enhancedUrl: true,
              enhancedWidth: true,
              enhancedHeight: true,
              createdAt: true,
            },
          },
          user: {
            select: { name: true, image: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.enhancedImage.count({ where }),
    ]);

    return NextResponse.json(
      {
        items: images,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      },
    );
  } catch (error) {
    logger.error("Database error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
