import { checkRateLimit, rateLimitConfigs } from "@/lib/rate-limiter";
import { pollQRAuth } from "@/lib/auth/qr-auth-service";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const hash = request.nextUrl.searchParams.get("hash");
  if (!hash) {
    return NextResponse.json({ error: "Missing hash parameter" }, { status: 400 });
  }

  const rateLimit = await checkRateLimit(`qr_poll:${hash}`, rateLimitConfigs.qrPoll);
  if (rateLimit.isLimited) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const session = await pollQRAuth(hash);
  if (!session) {
    return NextResponse.json({ error: "Session expired or not found" }, { status: 404 });
  }

  // Return oneTimeCode when APPROVED so desktop can complete authentication
  // This is safe: only the desktop that initiated (knows the hash) can poll,
  // code is single-use (deleted from Redis after completion), transport is HTTPS
  return NextResponse.json({
    status: session.status,
    ...(session.status === "APPROVED" && session.oneTimeCode
      ? { oneTimeCode: session.oneTimeCode }
      : {}),
  });
}
