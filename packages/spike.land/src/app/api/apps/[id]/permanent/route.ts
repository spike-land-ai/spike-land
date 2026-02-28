/**
 * DELETE /api/apps/[id]/permanent
 *
 * Permanently delete an app. Only works on apps that are currently in the bin.
 * Requires ?confirm=true query parameter to prevent accidental deletion.
 * Cascades to delete all related data (messages, images, attachments, etc.)
 */

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { tryCatch } from "@/lib/try-catch";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function DELETE(
  request: NextRequest,
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

  // Require confirmation parameter
  const confirm = request.nextUrl.searchParams.get("confirm");
  if (confirm !== "true") {
    return NextResponse.json(
      {
        error: "Confirmation required. Add ?confirm=true to permanently delete.",
      },
      { status: 400 },
    );
  }

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
      select: {
        id: true,
        name: true,
      },
    }),
  );

  if (fetchError) {
    logger.error("Error fetching app for permanent delete:", fetchError);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }

  if (!existingApp) {
    return NextResponse.json(
      {
        error: "App not found in bin. Only binned apps can be permanently deleted.",
      },
      { status: 404 },
    );
  }

  // Hard delete - cascades to all related records
  const { error: deleteError } = await tryCatch(
    prisma.app.delete({
      where: { id: existingApp.id },
    }),
  );

  if (deleteError) {
    logger.error("Error permanently deleting app:", deleteError);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    message: `App "${existingApp.name}" permanently deleted`,
  });
}
