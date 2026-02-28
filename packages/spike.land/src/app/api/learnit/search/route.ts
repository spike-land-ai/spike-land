import { searchLearnItContent } from "@/lib/learnit/content-service";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");

  if (!query || query.length < 2) {
    return NextResponse.json([]);
  }

  try {
    const results = await searchLearnItContent(query);
    return NextResponse.json(results);
  } catch (error) {
    logger.error("Search Error:", error);
    return NextResponse.json([]);
  }
}
