/**
 * POST /api/apps/[id]/bin/restore
 *
 * Restore an app from the bin by clearing the deletedAt timestamp.
 * Only works on apps that are currently in the bin.
 */

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { tryCatch } from "@/lib/try-catch";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string; }>; },
) {
  const { data: session, error: authError } = await tryCatch(auth());

  if (authError || !session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: params, error: paramsError } = await tryCatch(context.params);
  if (paramsError) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }
  const { id } = params;

  // Find app that is in the bin (deletedAt IS NOT NULL)
  // Try by codespaceId first, then slug, then id
  const { data: existingApp, error: fetchError } = await tryCatch(
    prisma.app.findFirst({
      where: {
        OR: [
          {
            codespaceId: id,
            userId: session.user.id,
            deletedAt: { not: null },
          },
          { slug: id, userId: session.user.id, deletedAt: { not: null } },
          ...((/^c[a-z0-9]{20,}$/i.test(id))
            ? [{ id, userId: session.user.id, deletedAt: { not: null } }]
            : []),
        ],
      },
    }),
  );

  if (fetchError) {
    logger.error("Error fetching app for restore:", fetchError);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }

  if (!existingApp) {
    return NextResponse.json(
      { error: "App not found in bin" },
      { status: 404 },
    );
  }

  const { data: restoredApp, error: updateError } = await tryCatch(
    prisma.$transaction(async tx => {
      const app = await tx.app.update({
        where: { id: existingApp.id },
        data: { deletedAt: null },
        select: {
          id: true,
          name: true,
          slug: true,
          codespaceId: true,
          codespaceUrl: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      await tx.appStatusHistory.create({
        data: {
          appId: existingApp.id,
          status: existingApp.status,
          message: "Restored from bin",
        },
      });

      return app;
    }),
  );

  if (updateError) {
    logger.error("Error restoring app from bin:", updateError);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    app: restoredApp,
  });
}
