import { getClientIp } from "@/lib/rate-limit-presets";
import { checkRateLimit } from "@/lib/rate-limiter";
import { tryCatch } from "@/lib/try-catch";
import { assignVariant } from "@/lib/ab-test/variant-assignment";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/** GET: get variant assignment for a visitor */
export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const { isLimited } = await checkRateLimit(`ab-test:assign:${ip}`, {
    maxRequests: 30,
    windowMs: 60000,
  });
  if (isLimited) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429 },
    );
  }

  const testId = request.nextUrl.searchParams.get("testId");
  const visitorId = request.nextUrl.searchParams.get("visitorId");

  if (!testId || !visitorId) {
    return NextResponse.json(
      { error: "testId and visitorId are required" },
      { status: 400 },
    );
  }

  const prisma = (await import("@/lib/prisma")).default;

  const { data: test, error } = await tryCatch(
    prisma.abTest.findUnique({
      where: { id: testId },
      include: { variants: true },
    }),
  );

  if (error || !test) {
    return NextResponse.json({ error: "Test not found" }, { status: 404 });
  }

  if (test.status !== "RUNNING") {
    return NextResponse.json(
      { error: "Test is not running" },
      { status: 400 },
    );
  }

  const variant = assignVariant(
    visitorId,
    testId,
    test.variants.map(v => ({
      id: v.id,
      name: v.name,
      splitPercentage: v.splitPercentage,
    })),
  );

  if (!variant) {
    return NextResponse.json({ error: "No variants available" }, {
      status: 404,
    });
  }

  return NextResponse.json({
    testId,
    variantId: variant.id,
    variantName: variant.name,
  });
}

/** POST: record a conversion */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const { isLimited } = await checkRateLimit(`ab-test:convert:${ip}`, {
    maxRequests: 10,
    windowMs: 60000,
  });
  if (isLimited) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429 },
    );
  }

  const { data: body, error: jsonError } = await tryCatch(request.json());
  if (jsonError) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { variantId, visitorSessionId } = body as {
    variantId?: string;
    visitorSessionId?: string;
  };

  if (!variantId || !visitorSessionId) {
    return NextResponse.json(
      { error: "variantId and visitorSessionId are required" },
      { status: 400 },
    );
  }

  const prisma = (await import("@/lib/prisma")).default;

  const { error } = await tryCatch(
    prisma.abTestResult.updateMany({
      where: { abTestVariantId: variantId, visitorSessionId },
      data: { converted: true },
    }),
  );

  if (error) {
    return NextResponse.json({ error: "Failed to record conversion" }, {
      status: 500,
    });
  }

  return NextResponse.json({ success: true });
}
