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
 * PATCH /api/clean/reminders/[reminderId]
 * Update a reminder. Verifies ownership.
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ reminderId: string; }>; },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: params, error: paramsError } = await tryCatch(context.params);
  if (paramsError) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  const prisma = (await import("@/lib/prisma")).default;

  // Verify ownership
  const { data: existing, error: fetchError } = await tryCatch(
    prisma.cleaningReminder.findFirst({
      where: { id: params.reminderId, userId: session.user.id },
    }),
  );

  if (fetchError) {
    logger.error("Error fetching reminder:", fetchError);
    return NextResponse.json({ error: "Internal server error" }, {
      status: 500,
    });
  }

  if (!existing) {
    return NextResponse.json({ error: "Reminder not found" }, { status: 404 });
  }

  const { data: body, error: jsonError } = await tryCatch(request.json());
  if (jsonError) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { time, days, enabled, message } = body ?? {};

  const updateData: {
    time?: string;
    days?: CleaningReminderDay[];
    enabled?: boolean;
    message?: string | null;
  } = {};

  if (time !== undefined) {
    if (typeof time !== "string" || !TIME_REGEX.test(time)) {
      return NextResponse.json({ error: "time must be in HH:mm format" }, {
        status: 400,
      });
    }
    updateData.time = time;
  }

  if (days !== undefined) {
    if (!Array.isArray(days) || days.length === 0) {
      return NextResponse.json({ error: "days must be a non-empty array" }, {
        status: 400,
      });
    }
    for (const day of days) {
      if (!VALID_DAYS.includes(day as CleaningReminderDay)) {
        return NextResponse.json({ error: `Invalid day: ${day}` }, {
          status: 400,
        });
      }
    }
    updateData.days = days as CleaningReminderDay[];
  }

  if (enabled !== undefined) {
    if (typeof enabled !== "boolean") {
      return NextResponse.json({ error: "enabled must be a boolean" }, {
        status: 400,
      });
    }
    updateData.enabled = enabled;
  }

  if (message !== undefined) {
    updateData.message = typeof message === "string" ? message.trim() : null;
  }

  const { data: updated, error: updateError } = await tryCatch(
    prisma.cleaningReminder.update({
      where: { id: params.reminderId },
      data: updateData,
    }),
  );

  if (updateError) {
    logger.error("Error updating reminder:", updateError);
    return NextResponse.json({ error: "Internal server error" }, {
      status: 500,
    });
  }

  return NextResponse.json(updated);
}

/**
 * DELETE /api/clean/reminders/[reminderId]
 * Delete a reminder. Verifies ownership.
 */
export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ reminderId: string; }>; },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: params, error: paramsError } = await tryCatch(context.params);
  if (paramsError) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  const prisma = (await import("@/lib/prisma")).default;

  // Verify ownership
  const { data: existing, error: fetchError } = await tryCatch(
    prisma.cleaningReminder.findFirst({
      where: { id: params.reminderId, userId: session.user.id },
      select: { id: true },
    }),
  );

  if (fetchError) {
    logger.error("Error fetching reminder:", fetchError);
    return NextResponse.json({ error: "Internal server error" }, {
      status: 500,
    });
  }

  if (!existing) {
    return NextResponse.json({ error: "Reminder not found" }, { status: 404 });
  }

  const { error: deleteError } = await tryCatch(
    prisma.cleaningReminder.delete({
      where: { id: params.reminderId },
    }),
  );

  if (deleteError) {
    logger.error("Error deleting reminder:", deleteError);
    return NextResponse.json({ error: "Internal server error" }, {
      status: 500,
    });
  }

  return NextResponse.json({ success: true });
}
