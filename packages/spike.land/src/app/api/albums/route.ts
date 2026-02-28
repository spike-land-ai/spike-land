import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { tryCatch } from "@/lib/try-catch";
import type { AlbumPrivacy } from "@prisma/client";
import { nanoid } from "nanoid";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

// GET /api/albums - List user's albums
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: albums, error } = await tryCatch(
    prisma.album.findMany({
      where: { userId: session.user.id },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: {
        albumImages: {
          orderBy: { sortOrder: "asc" },
          take: 4,
          include: {
            image: {
              select: {
                id: true,
                originalUrl: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: { albumImages: true },
        },
      },
    }),
  );

  if (error) {
    logger.error("Failed to fetch albums:", error);
    return NextResponse.json(
      { error: "Failed to fetch albums" },
      { status: 500 },
    );
  }

  type AlbumItem = {
    id: string;
    name: string;
    description: string | null;
    privacy: AlbumPrivacy;
    coverImageId: string | null;
    _count: { albumImages: number; };
    albumImages: {
      image: { id: string; originalUrl: string; name: string; };
    }[];
    createdAt: Date;
    updatedAt: Date;
  };
  return NextResponse.json({
    albums: albums.map((album: AlbumItem) => ({
      id: album.id,
      name: album.name,
      description: album.description,
      privacy: album.privacy,
      coverImageId: album.coverImageId,
      imageCount: album._count.albumImages,
      previewImages: album.albumImages.map(
        (ai: { image: { id: string; originalUrl: string; name: string; }; }) => ({
          id: ai.image.id,
          url: ai.image.originalUrl,
          name: ai.image.name,
        }),
      ),
      createdAt: album.createdAt,
      updatedAt: album.updatedAt,
    })),
  });
}

// POST /api/albums - Create a new album
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: body, error: bodyError } = await tryCatch(request.json());

  if (bodyError) {
    logger.error("Failed to create album:", bodyError);
    return NextResponse.json(
      { error: "Failed to create album" },
      { status: 500 },
    );
  }

  const { name, description, privacy = "PRIVATE", defaultTier = "TIER_1K" } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
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

  const validPrivacy = ["PRIVATE", "UNLISTED", "PUBLIC"];
  if (!validPrivacy.includes(privacy)) {
    return NextResponse.json(
      { error: "Invalid privacy setting" },
      { status: 400 },
    );
  }

  const validTiers = ["TIER_1K", "TIER_2K", "TIER_4K"];
  if (!validTiers.includes(defaultTier)) {
    return NextResponse.json(
      { error: "Invalid default tier" },
      { status: 400 },
    );
  }

  // Get current max sort order
  const { data: maxSortOrder, error: aggregateError } = await tryCatch(
    prisma.album.aggregate({
      where: { userId: session.user.id },
      _max: { sortOrder: true },
    }),
  );

  if (aggregateError) {
    logger.error("Failed to create album:", aggregateError);
    return NextResponse.json(
      { error: "Failed to create album" },
      { status: 500 },
    );
  }

  const { data: album, error: createError } = await tryCatch(
    prisma.album.create({
      data: {
        userId: session.user.id,
        name: name.trim(),
        description: description?.trim() || null,
        privacy,
        defaultTier: defaultTier as "TIER_1K" | "TIER_2K" | "TIER_4K",
        sortOrder: (maxSortOrder._max.sortOrder ?? -1) + 1,
        shareToken: privacy !== "PRIVATE" ? nanoid(12) : null,
      },
    }),
  );

  if (createError) {
    logger.error("Failed to create album:", createError);
    return NextResponse.json(
      { error: "Failed to create album" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    album: {
      id: album.id,
      name: album.name,
      description: album.description,
      privacy: album.privacy,
      shareToken: album.shareToken,
      createdAt: album.createdAt,
    },
  });
}
