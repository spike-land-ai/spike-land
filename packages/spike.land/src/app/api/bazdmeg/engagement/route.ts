import { checkRateLimit } from "@/lib/rate-limiter";
import { getClientIp } from "@/lib/rate-limit-presets";
import { tryCatch } from "@/lib/try-catch";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/logger";

const EngagementSchema = z.object({
  visitorId: z.string().min(1),
  page: z.string().min(1),
  abVariant: z.string().optional(),
  scrollDepthMax: z.number().min(0).max(100).optional(),
  timeOnPageMs: z.number().min(0).optional(),
  sectionsViewed: z.array(z.string()).optional(),
  chatOpened: z.boolean().optional(),
  ctaClicked: z.string().optional(),
  faqExpanded: z.number().min(0).optional(),
});

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const { isLimited } = await checkRateLimit(`bazdmeg:engagement:${ip}`, {
    maxRequests: 30,
    windowMs: 60000,
  });

  if (isLimited) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { data: body, error: jsonError } = await tryCatch(request.json());
  if (jsonError) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = EngagementSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const {
    visitorId,
    page,
    abVariant,
    scrollDepthMax,
    timeOnPageMs,
    sectionsViewed,
    chatOpened,
    ctaClicked,
    faqExpanded,
  } = parsed.data;

  const prisma = (await import("@/lib/prisma")).default;

  // Upsert by visitorId + page
  const { data: engagement, error } = await tryCatch(
    prisma.pageEngagement.upsert({
      where: {
        // Use a composite lookup - find first then upsert
        id: await prisma.pageEngagement
          .findFirst({
            where: { visitorId, page },
            select: { id: true },
          })
          .then(e => e?.id ?? "nonexistent"),
      },
      create: {
        visitorId,
        page,
        abVariant,
        scrollDepthMax: scrollDepthMax ?? 0,
        timeOnPageMs: timeOnPageMs ?? 0,
        sectionsViewed: sectionsViewed ?? [],
        chatOpened: chatOpened ?? false,
        ctaClicked,
        faqExpanded: faqExpanded ?? 0,
      },
      update: {
        ...(abVariant !== undefined ? { abVariant } : {}),
        ...(scrollDepthMax !== undefined ? { scrollDepthMax } : {}),
        ...(timeOnPageMs !== undefined ? { timeOnPageMs } : {}),
        ...(sectionsViewed !== undefined ? { sectionsViewed } : {}),
        ...(chatOpened !== undefined ? { chatOpened } : {}),
        ...(ctaClicked !== undefined ? { ctaClicked } : {}),
        ...(faqExpanded !== undefined ? { faqExpanded } : {}),
      },
    }),
  );

  if (error) {
    logger.error("Engagement upsert error:", error);
    return NextResponse.json({ error: "Failed to save engagement" }, {
      status: 500,
    });
  }

  return NextResponse.json({ id: engagement.id });
}
