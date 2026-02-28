import { checkRateLimit, rateLimitConfigs } from "@/lib/rate-limiter";
import { completeQRAuth } from "@/lib/auth/qr-auth-service";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  const rateLimit = await checkRateLimit(`qr_complete:${ip}`, rateLimitConfigs.qrAuth);
  if (rateLimit.isLimited) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await request.json() as { hash?: string; oneTimeCode?: string; };
  if (!body.hash || !body.oneTimeCode) {
    return NextResponse.json({ error: "Missing hash or oneTimeCode" }, { status: 400 });
  }

  const userId = await completeQRAuth(body.hash, body.oneTimeCode);
  if (!userId) {
    return NextResponse.json({ error: "Invalid or expired session" }, { status: 400 });
  }

  return NextResponse.json({ userId });
}
