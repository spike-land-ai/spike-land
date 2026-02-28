import { checkRateLimit } from "@/lib/rate-limiter";
import { getClientIp } from "@/lib/rate-limit-presets";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const { isLimited } = await checkRateLimit(`career:geo:${ip}`, {
    maxRequests: 10,
    windowMs: 60000,
  });

  if (isLimited) {
    return NextResponse.json(
      { error: "Too many requests." },
      { status: 429 },
    );
  }

  const { detectLocation } = await import(
    "@/lib/career/services/geolocation-client"
  );
  const { tryCatch } = await import("@/lib/try-catch");

  const { data: location, error } = await tryCatch(
    detectLocation(ip !== "unknown" ? ip : undefined),
  );

  if (error) {
    return NextResponse.json(
      { error: "Could not detect location" },
      { status: 502 },
    );
  }

  return NextResponse.json({ location });
}
