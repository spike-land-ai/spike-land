/**
 * POST /api/apps/[id]/bin
 *
 * Move an app to the bin by setting deletedAt timestamp.
 * The app remains recoverable for 30 days before automatic cleanup.
 */

import { auth } from "@/lib/auth";
import { findAppByIdentifierSimple } from "@/lib/app-lookup";
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

  // Use flexible lookup to find the app
  const { data: existingApp, error: fetchError } = await tryCatch(
    findAppByIdentifierSimple(id, session.user.id),
  );

  if (fetchError) {
    logger.error("Error fetching app for bin:", fetchError);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }

  if (!existingApp) {
    return NextResponse.json({ error: "App not found" }, { status: 404 });
  }

  // Check if already in bin
  if (existingApp.deletedAt) {
    return NextResponse.json(
      { error: "App is already in bin" },
      { status: 400 },
    );
  }

  const deletedAt = new Date();

  const { error: updateError } = await tryCatch(
    prisma.$transaction([
      prisma.app.update({
        where: { id: existingApp.id },
        data: { deletedAt },
      }),
      prisma.appStatusHistory.create({
        data: {
          appId: existingApp.id,
          status: existingApp.status,
          message: "Moved to bin",
        },
      }),
    ]),
  );

  if (updateError) {
    logger.error("Error moving app to bin:", updateError);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    deletedAt: deletedAt.toISOString(),
  });
}
