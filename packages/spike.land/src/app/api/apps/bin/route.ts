/**
 * GET /api/apps/bin
 *
 * List all apps in the bin for the current user.
 * Returns apps with daysRemaining calculated (30-day retention).
 */

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { tryCatch } from "@/lib/try-catch";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

const RETENTION_DAYS = 30;

export async function GET() {
  const { data: session, error: authError } = await tryCatch(auth());

  if (authError || !session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: apps, error: fetchError } = await tryCatch(
    prisma.app.findMany({
      where: {
        userId: session.user.id,
        deletedAt: { not: null },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        codespaceId: true,
        codespaceUrl: true,
        status: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            messages: true,
            images: true,
          },
        },
      },
      orderBy: {
        deletedAt: "desc",
      },
    }),
  );

  if (fetchError) {
    logger.error("Error fetching bin apps:", fetchError);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }

  // Calculate days remaining for each app
  const now = new Date();
  const appsWithRetention = apps.map(app => {
    const deletedAt = app.deletedAt as Date;
    const daysSinceDeleted = Math.floor(
      (now.getTime() - deletedAt.getTime()) / (1000 * 60 * 60 * 24),
    );
    const daysRemaining = Math.max(0, RETENTION_DAYS - daysSinceDeleted);

    return {
      ...app,
      daysRemaining,
      expiresAt: new Date(
        deletedAt.getTime() + RETENTION_DAYS * 24 * 60 * 60 * 1000,
      ).toISOString(),
    };
  });

  return NextResponse.json({
    apps: appsWithRetention,
    retentionDays: RETENTION_DAYS,
  });
}
