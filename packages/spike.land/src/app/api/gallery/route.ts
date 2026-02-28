/**
 * Public Gallery API Route
 *
 * Returns active featured gallery items for the landing page (no auth required).
 */

import prisma from "@/lib/prisma";
import { tryCatch } from "@/lib/try-catch";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

// Cache for 5 minutes, stale-while-revalidate for 10 minutes
export const revalidate = 300;

export async function GET() {
  const { data: items, error } = await tryCatch(
    prisma.featuredGalleryItem.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        originalUrl: true,
        enhancedUrl: true,
        width: true,
        height: true,
        sortOrder: true,
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    }),
  );

  if (error) {
    logger.error("Failed to fetch gallery items:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      items: items.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        category: item.category,
        originalUrl: item.originalUrl,
        enhancedUrl: item.enhancedUrl,
        width: item.width,
        height: item.height,
        sortOrder: item.sortOrder,
      })),
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    },
  );
}
