import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";
import { CreatedAppStatus } from "@prisma/client";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query || query.length < 2) {
    return NextResponse.json({ error: "Query must be at least 2 characters" }, {
      status: 400,
    });
  }

  if (query.length > 200) {
    return NextResponse.json({ error: "Query too long" }, { status: 400 });
  }

  try {
    const results = await prisma.createdApp.findMany({
      where: {
        status: CreatedAppStatus.PUBLISHED,
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { slug: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        slug: true,
        title: true,
        description: true,
      },
      orderBy: { viewCount: "desc" },
      take: 8,
    });

    return NextResponse.json(results);
  } catch (error) {
    logger.error("[create/search] Database error:", error);
    return NextResponse.json(
      { error: "Failed to search apps" },
      { status: 500 },
    );
  }
}
