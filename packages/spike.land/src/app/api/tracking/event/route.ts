import logger from "@/lib/logger";

/**
 * Analytics Event Tracking API Route
 *
 * Records custom analytics events within a session.
 * Public endpoint - no authentication required.
 * Rate limited to prevent abuse.
 *
 * Supported event names:
 * - signup_started, signup_completed
 * - enhancement_started, enhancement_completed
 * - purchase_started, purchase_completed
 * - page_scroll_25, page_scroll_50, page_scroll_75, page_scroll_100
 * - time_on_page_30s, time_on_page_60s, time_on_page_180s
 */

import { checkRateLimit } from "@/lib/rate-limiter";
import { tryCatch } from "@/lib/try-catch";
import type { Prisma } from "@prisma/client";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

// Rate limit config: 100 requests per minute per IP
const eventRateLimit = {
  maxRequests: 100,
  windowMs: 60 * 1000, // 1 minute
};

// Maximum request body size (8KB for metadata)
const MAX_BODY_SIZE = 8192;

// Allowed event names for validation
const ALLOWED_EVENT_NAMES = [
  // Conversion events
  "signup_started",
  "signup_completed",
  "enhancement_started",
  "enhancement_completed",
  "purchase_started",
  "purchase_completed",
  // Engagement events - scroll depth
  "page_scroll_25",
  "page_scroll_50",
  "page_scroll_75",
  "page_scroll_100",
  // Engagement events - time on page
  "time_on_page_30s",
  "time_on_page_60s",
  "time_on_page_180s",
] as const;

type EventName = typeof ALLOWED_EVENT_NAMES[number];

// Event categories for grouping
const EVENT_CATEGORIES: Record<EventName, string> = {
  signup_started: "conversion",
  signup_completed: "conversion",
  enhancement_started: "conversion",
  enhancement_completed: "conversion",
  purchase_started: "conversion",
  purchase_completed: "conversion",
  page_scroll_25: "engagement",
  page_scroll_50: "engagement",
  page_scroll_75: "engagement",
  page_scroll_100: "engagement",
  time_on_page_30s: "engagement",
  time_on_page_60s: "engagement",
  time_on_page_180s: "engagement",
};

// Input validation schema
const eventRequestSchema = z.object({
  sessionId: z.string().min(1).max(128),
  name: z.string().min(1).max(100),
  category: z.string().max(100).optional(),
  value: z.number().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Check if event name is in the allowed list
 */
function isAllowedEventName(name: string): name is EventName {
  return ALLOWED_EVENT_NAMES.includes(name as EventName);
}

/**
 * Get client IP address from request headers
 */
function getClientIP(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0];
    return firstIp ? firstIp.trim() : "unknown";
  }

  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  return "unknown";
}

/**
 * POST /api/tracking/event - Record an analytics event
 */
export async function POST(request: NextRequest) {
  // Check content length to prevent oversized payloads
  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_SIZE) {
    return NextResponse.json({ error: "Request too large" }, { status: 413 });
  }

  // Rate limiting by IP address
  const clientIP = getClientIP(request);
  const rateLimitResult = await checkRateLimit(
    `tracking_event:${clientIP}`,
    eventRateLimit,
  );

  if (rateLimitResult.isLimited) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(
            Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000),
          ),
          "X-RateLimit-Remaining": String(rateLimitResult.remaining),
        },
      },
    );
  }

  // Parse and validate request body
  const { data: body, error: jsonError } = await tryCatch(request.json());
  if (jsonError) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parseResult = eventRequestSchema.safeParse(body);
  if (!parseResult.success) {
    const firstError = parseResult.error.issues[0];
    return NextResponse.json(
      {
        error: `Invalid input: ${firstError?.path.join(".")} - ${firstError?.message}`,
      },
      { status: 400 },
    );
  }

  const data = parseResult.data;

  // Validate event name is in allowed list
  if (!isAllowedEventName(data.name)) {
    return NextResponse.json(
      {
        error: `Invalid event name. Allowed: ${ALLOWED_EVENT_NAMES.join(", ")}`,
      },
      { status: 400 },
    );
  }

  // Verify session exists
  const prisma = (await import("@/lib/prisma")).default;
  const { data: session, error: sessionError } = await tryCatch(
    prisma.visitorSession.findUnique({
      where: { id: data.sessionId },
    }),
  );

  if (sessionError) {
    logger.error("[Tracking] Session lookup error:", sessionError);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Determine category - use provided or default based on event name
  const category = data.category || EVENT_CATEGORIES[data.name];

  // Create the event
  const { data: event, error: createError } = await tryCatch(
    prisma.analyticsEvent.create({
      data: {
        sessionId: data.sessionId,
        name: data.name,
        category: category,
        value: data.value ?? null,
        ...(data.metadata && {
          metadata: data.metadata as Prisma.InputJsonValue,
        }),
      },
    }),
  );

  if (createError) {
    logger.error("[Tracking] Event tracking error:", createError);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }

  logger.info(
    `[Tracking] Recorded event "${data.name}" (${category}) for session ${data.sessionId}`,
  );

  return NextResponse.json(
    { success: true, eventId: event.id },
    { status: 201 },
  );
}
