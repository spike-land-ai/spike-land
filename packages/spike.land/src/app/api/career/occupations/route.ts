import { logger } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limiter";
import { getClientIp } from "@/lib/rate-limit-presets";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const { isLimited } = await checkRateLimit(`career:occupations:${ip}`, {
    maxRequests: 30,
    windowMs: 60000,
  });

  if (isLimited) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429 },
    );
  }

  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";
  const limit = parseInt(url.searchParams.get("limit") ?? "20", 10);
  const offset = parseInt(url.searchParams.get("offset") ?? "0", 10);

  if (!query) {
    return NextResponse.json(
      { error: "Query parameter 'q' is required" },
      { status: 400 },
    );
  }

  try {
    const { searchOccupations } = await import(
      "@/lib/career/services/esco-client"
    );
    const { results, total } = await searchOccupations(query, limit, offset);

    return NextResponse.json({ occupations: results, total });
  } catch (error) {
    logger.error("[career/occupations] Search error:", error);
    return NextResponse.json(
      { error: "Failed to search occupations" },
      { status: 500 },
    );
  }
}
