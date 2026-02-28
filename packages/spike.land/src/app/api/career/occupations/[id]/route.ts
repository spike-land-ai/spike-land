import { checkRateLimit } from "@/lib/rate-limiter";
import { getClientIp } from "@/lib/rate-limit-presets";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; }>; },
) {
  const ip = getClientIp(request);
  const { isLimited } = await checkRateLimit(`career:occupation:${ip}`, {
    maxRequests: 30,
    windowMs: 60000,
  });

  if (isLimited) {
    return NextResponse.json(
      { error: "Too many requests." },
      { status: 429 },
    );
  }

  const { id } = await params;
  // The id is URL-encoded ESCO URI
  const uri = decodeURIComponent(id);

  const { getOccupation } = await import("@/lib/career/services/esco-client");
  const { tryCatch } = await import("@/lib/try-catch");

  const { data: occupation, error } = await tryCatch(getOccupation(uri));

  if (error) {
    return NextResponse.json(
      { error: "Occupation not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ occupation });
}
