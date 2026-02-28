import { getResend } from "@/lib/email/client";
import prisma from "@/lib/prisma";
import { checkRateLimit, rateLimitConfigs } from "@/lib/rate-limiter";
import { getClientIp } from "@/lib/security/ip";
import { tryCatch } from "@/lib/try-catch";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export async function POST(request: NextRequest) {
  const { data: body, error: parseError } = await tryCatch(request.json());

  if (parseError) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  const { email, source = "footer" } = body as {
    email?: string;
    source?: string;
  };

  if (!email || typeof email !== "string") {
    return NextResponse.json(
      { error: "Email is required" },
      { status: 400 },
    );
  }

  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json(
      { error: "Invalid email address" },
      { status: 400 },
    );
  }

  const clientIP = getClientIp(request);
  const rateLimitResult = await checkRateLimit(
    `newsletter-subscribe:${clientIP}`,
    rateLimitConfigs.newsletterSubscribe,
  );

  if (rateLimitResult.isLimited) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 },
    );
  }

  const { error: dbError } = await tryCatch(
    prisma.newsletterSubscriber.upsert({
      where: { email },
      create: { email, source },
      update: { unsubscribed: false, unsubscribedAt: null },
    }),
  );

  if (dbError) {
    logger.error("Newsletter subscribe error:", dbError);
    return NextResponse.json(
      { error: "Failed to subscribe. Please try again." },
      { status: 500 },
    );
  }

  // Optionally sync to Resend contacts — don't block on failure
  const { error: resendError } = await tryCatch(
    (async () => {
      const resend = getResend();
      await resend.contacts.create({
        email,
        audienceId: process.env.RESEND_AUDIENCE_ID || "",
      });
    })(),
  );

  if (resendError) {
    logger.warn("Failed to sync subscriber to Resend", { error: resendError });
  }

  return NextResponse.json({ success: true });
}
