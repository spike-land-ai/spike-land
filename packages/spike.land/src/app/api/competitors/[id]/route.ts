import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; }>; },
) {
  try {
    const { id } = await params;
    await prisma.scoutCompetitor.delete({
      where: { id },
    });
    return NextResponse.json({ message: "Competitor deleted successfully" });
  } catch (error) {
    logger.error("Failed to delete competitor:", error);
    return NextResponse.json({ message: "Failed to delete competitor" }, {
      status: 500,
    });
  }
}
