/**
 * Public Albums Gallery API Route
 *
 * Returns before/after image pairs from PUBLIC albums owned by super admin.
 * Used for showcase galleries on public pages (no authentication required).
 */

import prisma from "@/lib/prisma";
import { tryCatch } from "@/lib/try-catch";
import type { EnhancementTier } from "@prisma/client";
import { AlbumPrivacy, JobStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

const SUPER_ADMIN_EMAIL = "zolika84@gmail.com";
const DEFAULT_LIMIT = 12;

// Cache for 5 minutes, stale-while-revalidate for 10 minutes
export const revalidate = 300;

interface PublicAlbumPhoto {
  id: string;
  title: string;
  originalUrl: string;
  enhancedUrl: string;
  width: number;
  height: number;
  albumName: string;
  tier: EnhancementTier;
}

export async function GET() {
  // 1. Find super admin user
  const { data: superAdmin, error: superAdminError } = await tryCatch(
    prisma.user.findFirst({
      where: {
        email: SUPER_ADMIN_EMAIL,
      },
      select: {
        id: true,
      },
    }),
  );

  if (superAdminError) {
    logger.error("Failed to fetch public album photos:", superAdminError);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }

  if (!superAdmin) {
    return NextResponse.json(
      { error: "Super admin user not found" },
      { status: 404 },
    );
  }

  // 2. Get PUBLIC albums with enhanced images
  const { data: albums, error: albumsError } = await tryCatch(
    prisma.album.findMany({
      where: {
        userId: superAdmin.id,
        privacy: AlbumPrivacy.PUBLIC,
      },
      select: {
        name: true,
        albumImages: {
          select: {
            image: {
              select: {
                id: true,
                name: true,
                originalUrl: true,
                enhancementJobs: {
                  where: {
                    status: JobStatus.COMPLETED,
                  },
                  orderBy: {
                    createdAt: "desc",
                  },
                  take: 1,
                  select: {
                    enhancedUrl: true,
                    enhancedWidth: true,
                    enhancedHeight: true,
                    tier: true,
                  },
                },
              },
            },
          },
          orderBy: {
            sortOrder: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
  );

  if (albumsError) {
    logger.error("Failed to fetch public album photos:", albumsError);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }

  // 3. Transform data to response format
  const items: PublicAlbumPhoto[] = [];

  for (const album of albums) {
    for (const albumImage of album.albumImages) {
      const { image } = albumImage;

      // Only include images with completed enhancement jobs
      const latestJob = image.enhancementJobs[0];

      if (!latestJob) {
        continue;
      }

      // Skip if no enhanced URL available
      if (
        !latestJob.enhancedUrl || !latestJob.enhancedWidth
        || !latestJob.enhancedHeight
      ) {
        continue;
      }

      items.push({
        id: image.id,
        title: image.name,
        originalUrl: image.originalUrl,
        enhancedUrl: latestJob.enhancedUrl,
        width: latestJob.enhancedWidth,
        height: latestJob.enhancedHeight,
        albumName: album.name,
        tier: latestJob.tier,
      });

      // Stop if we've reached the limit
      if (items.length >= DEFAULT_LIMIT) {
        break;
      }
    }

    // Stop if we've reached the limit
    if (items.length >= DEFAULT_LIMIT) {
      break;
    }
  }

  return NextResponse.json(
    {
      items,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    },
  );
}
