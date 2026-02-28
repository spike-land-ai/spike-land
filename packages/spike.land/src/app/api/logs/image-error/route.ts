import { NextResponse } from "next/server";

import { tryCatch } from "@/lib/try-catch";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  const { data: body, error } = await tryCatch(request.json());

  if (error) {
    logger.error("[Image Error Logging] Failed to parse request body:", error);
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  // Log to server console - this will appear in Vercel logs
  logger.error(
    "[ENHANCED_IMAGE_LOAD_ERROR]",
    JSON.stringify(
      {
        type: body.type,
        versionId: body.versionId,
        tier: body.tier,
        url: body.url,
        timestamp: body.timestamp,
        serverTimestamp: new Date().toISOString(),
      },
      null,
      2,
    ),
  );

  return NextResponse.json({ success: true });
}
