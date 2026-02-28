import { checkRateLimit, rateLimitConfigs } from "@/lib/rate-limiter";
import { initiateQRAuth } from "@/lib/auth/qr-auth-service";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function POST() {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  const rateLimit = await checkRateLimit(`qr_initiate:${ip}`, rateLimitConfigs.qrAuth);
  if (rateLimit.isLimited) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { token, hash } = await initiateQRAuth();

  return NextResponse.json({ token, hash });
}
