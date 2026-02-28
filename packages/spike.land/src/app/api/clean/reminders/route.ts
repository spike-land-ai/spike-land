import { auth } from "@/lib/auth";
import { tryCatch } from "@/lib/try-catch";
import type { CleaningReminderDay } from "@prisma/client";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

const VALID_DAYS: CleaningReminderDay[] = [
  "MON",
  "TUE",
  "WED",
  "THU",
  "FRI",
  "SAT",
  "SUN",
];
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * GET /api/clean/reminders
 * List reminders for the authenticated user.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prisma = (await import("@/lib/prisma")).default;

  const { data: reminders, error } = await tryCatch(
    prisma.cleaningReminder.findMany({
      where: { userId: session.user.id },
      orderBy: { time: "asc" },
    }),
  );

  if (error) {
    logger.error("Error fetching reminders:", error);
    return NextResponse.json({ error: "Internal server error" }, {
      status: 500,
    });
  }

  return NextResponse.json({ reminders });
}

/**
 * POST /api/clean/reminders
 * Create a new reminder.
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: body, error: jsonError } = await tryCatch(request.json());
  if (jsonError) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { time, days, message } = body ?? {};

  if (!time || typeof time !== "string" || !TIME_REGEX.test(time)) {
    return NextResponse.json({ error: "time must be in HH:mm format" }, {
      status: 400,
    });
  }

  if (!Array.isArray(days) || days.length === 0) {
    return NextResponse.json({
      error: "days array is required and must not be empty",
    }, { status: 400 });
  }

  for (const day of days) {
    if (!VALID_DAYS.includes(day as CleaningReminderDay)) {
      return NextResponse.json({ error: `Invalid day: ${day}. Use MON-SUN.` }, {
        status: 400,
      });
    }
  }

  const prisma = (await import("@/lib/prisma")).default;

  const { data: reminder, error } = await tryCatch(
    prisma.cleaningReminder.create({
      data: {
        userId: session.user.id,
        time,
        days: days as CleaningReminderDay[],
        message: typeof message === "string" ? message.trim() : null,
        enabled: true,
      },
    }),
  );

  if (error) {
    logger.error("Error creating reminder:", error);
    return NextResponse.json({ error: "Internal server error" }, {
      status: 500,
    });
  }

  return NextResponse.json(reminder, { status: 201 });
}
