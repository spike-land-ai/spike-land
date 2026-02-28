import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const tags = searchParams.get("tags")?.split(",").filter(Boolean) || [];
  const sort = searchParams.get("sort") || "date_desc";

  const orderBy = (() => {
    switch (sort) {
      case "date_asc":
        return { createdAt: "asc" as const };
      case "name_asc":
        return { name: "asc" as const };
      case "name_desc":
        return { name: "desc" as const };
      case "date_desc":
      default:
        return { createdAt: "desc" as const };
    }
  })();

  const images = await prisma.enhancedImage.findMany({
    where: {
      userId: session.user.id,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(tags.length > 0 && { tags: { hasSome: tags } }),
    },
    include: {
      enhancementJobs: {
        orderBy: { createdAt: "desc" },
      },
      albumImages: {
        include: { album: { select: { name: true } } },
      },
    },
    orderBy,
  });

  return NextResponse.json({ items: images });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { ids } = await request.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "No IDs provided" }, { status: 400 });
    }

    // Verify ownership and delete
    const result = await prisma.enhancedImage.deleteMany({
      where: {
        id: { in: ids },
        userId: session.user.id,
      },
    });

    return NextResponse.json({ success: true, count: result.count });
  } catch (error) {
    logger.error("Bulk delete failed:", error);
    return NextResponse.json({ error: "Failed to delete images" }, {
      status: 500,
    });
  }
}
