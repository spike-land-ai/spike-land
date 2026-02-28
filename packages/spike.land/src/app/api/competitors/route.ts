import prisma from "@/lib/prisma";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const competitors = await prisma.scoutCompetitor.findMany();
    return NextResponse.json(competitors);
  } catch (error) {
    logger.error("Failed to retrieve competitors:", error);
    return NextResponse.json({ message: "Failed to retrieve competitors" }, {
      status: 500,
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { workspaceId, platform, handle, name } = await req.json();
    const newCompetitor = await prisma.scoutCompetitor.create({
      data: {
        workspaceId,
        platform,
        handle,
        name,
      },
    });
    return NextResponse.json(newCompetitor, { status: 201 });
  } catch (error) {
    logger.error("Failed to create competitor:", error);
    return NextResponse.json({ message: "Failed to create competitor" }, {
      status: 500,
    });
  }
}
