import prisma from "@/lib/prisma";
import { tryCatch } from "@/lib/try-catch";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/logger";

const heartbeatSchema = z.object({
  boxId: z.string(),
  status: z.string().optional(), // e.g. "IDLE", "BUSY"
  load: z.number().optional(), // CPU load or similar metric
});

export async function POST(req: NextRequest) {
  const { data: body, error: jsonError } = await tryCatch(req.json());
  if (jsonError) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parseResult = heartbeatSchema.safeParse(body);

  if (!parseResult.success) {
    return NextResponse.json({
      error: "Invalid request body",
      details: parseResult.error.flatten(),
    }, {
      status: 400,
    });
  }

  const { boxId } = parseResult.data;

  const { data: box, error: dbError } = await tryCatch(
    prisma.box.findUnique({
      where: { id: boxId },
    }),
  );

  if (dbError) {
    logger.error("Database error:", dbError);
    return NextResponse.json({ error: "Internal Server Error" }, {
      status: 500,
    });
  }

  if (!box) {
    return NextResponse.json({ error: "Box not found" }, { status: 404 });
  }

  if (box.status !== "RUNNING") {
    const { error: updateError } = await tryCatch(
      prisma.box.update({
        where: { id: boxId },
        data: { status: "RUNNING" },
      }),
    );

    if (updateError) {
      logger.error("Failed to update box status:", updateError);
      return NextResponse.json({ error: "Internal Server Error" }, {
        status: 500,
      });
    }
  }

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
  });
}
