import { auth } from "@/lib/auth";
import { analyzeImage } from "@/lib/ai/gemini-client";
import { tryCatch } from "@/lib/try-catch";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  const { data: session, error: authError } = await tryCatch(auth());
  if (authError || !session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: body, error: jsonError } = await tryCatch(request.json());
  if (jsonError) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { imageData, mimeType } = body;

  if (!imageData || !mimeType) {
    return NextResponse.json(
      { error: "Missing imageData or mimeType" },
      { status: 400 },
    );
  }

  // Analyze the image with Gemini
  const { data: analysis, error: analyzeError } = await tryCatch(
    analyzeImage(imageData, mimeType),
  );

  if (analyzeError) {
    logger.error("Error in test-gemini API:", analyzeError);
    return NextResponse.json(
      {
        error: analyzeError instanceof Error
          ? analyzeError.message
          : "Unknown error",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    analysis,
    userId: session.user.id,
  });
}
