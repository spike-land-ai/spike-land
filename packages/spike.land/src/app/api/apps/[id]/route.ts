import { auth } from "@/lib/auth";
import {
  findAppByIdentifier,
  findAppByIdentifierSimple,
} from "@/lib/app-lookup";
import prisma from "@/lib/prisma";
import { tryCatch } from "@/lib/try-catch";
import { isAgentWorking } from "@/lib/upstash";
import {
  appCodespaceLinkSchema,
  appSettingsUpdateSchema,
} from "@/lib/validations/app";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

/**
 * GET /api/apps/[id]
 * Get a single app with full details
 * Supports lookup by: codespaceId, slug, or database id (for backward compatibility)
 */
export async function GET(
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

  // Use flexible lookup that supports codespaceId, slug, or id
  const { data: app, error: fetchError } = await tryCatch(
    findAppByIdentifier(id, session.user.id),
  );

  if (fetchError) {
    logger.error("Error fetching app:", fetchError);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }

  if (!app) {
    return NextResponse.json({ error: "App not found" }, { status: 404 });
  }

  // Check if agent is currently working on this app
  const { data: agentWorking } = await tryCatch(isAgentWorking(app.id));

  return NextResponse.json({
    ...app,
    agentWorking: agentWorking || false,
  });
}

/**
 * PATCH /api/apps/[id]
 * Update app settings
 * Supports lookup by: codespaceId, slug, or database id (for backward compatibility)
 */
export async function PATCH(
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

  // Use flexible lookup
  const { data: existingApp, error: fetchError } = await tryCatch(
    findAppByIdentifierSimple(id, session.user.id),
  );

  if (fetchError) {
    logger.error("Error fetching app for update:", fetchError);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }

  if (!existingApp) {
    return NextResponse.json({ error: "App not found" }, { status: 404 });
  }

  const { data: body, error: jsonError } = await tryCatch(request.json());
  if (jsonError) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Check if this is a codespace link request
  const codespaceResult = appCodespaceLinkSchema.safeParse(body);
  const settingsResult = appSettingsUpdateSchema.safeParse(body);

  // Validate with either schema
  if (!codespaceResult.success && !settingsResult.success) {
    return NextResponse.json(
      { error: "Validation error", details: settingsResult.error?.issues },
      { status: 400 },
    );
  }

  const validatedData = settingsResult.success ? settingsResult.data : {};
  const codespaceData = codespaceResult.success ? codespaceResult.data : null;

  const updateData: {
    name?: string;
    description?: string;
    isPublic?: boolean;
    codespaceId?: string;
    codespaceUrl?: string;
    slug?: string;
  } = {};

  if (validatedData.name !== undefined) {
    updateData.name = validatedData.name;
  }
  if (validatedData.description !== undefined) {
    updateData.description = validatedData.description;
  }
  if (validatedData.isPublic !== undefined) {
    updateData.isPublic = validatedData.isPublic;
  }

  // Handle codespace linking
  if (codespaceData?.codespaceId || validatedData.codespaceId) {
    const codespaceId = codespaceData?.codespaceId || validatedData.codespaceId;
    updateData.codespaceId = codespaceId;
    updateData.codespaceUrl = `/api/codespace/${codespaceId}/embed`;
    // Also update slug if not already set
    if (!existingApp.slug) {
      updateData.slug = codespaceId;
    }
  }

  const { data: app, error: updateError } = await tryCatch(
    prisma.app.update({
      where: { id: existingApp.id },
      data: updateData,
      include: {
        requirements: {
          orderBy: { createdAt: "asc" },
        },
        monetizationModels: {
          orderBy: { createdAt: "asc" },
        },
        statusHistory: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        _count: {
          select: { messages: true, images: true },
        },
      },
    }),
  );

  if (updateError) {
    logger.error("Error updating app:", updateError);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }

  return NextResponse.json(app);
}

/**
 * DELETE /api/apps/[id]
 * Archive an app (soft delete)
 * Supports lookup by: codespaceId, slug, or database id (for backward compatibility)
 */
export async function DELETE(
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

  // Use flexible lookup
  const { data: existingApp, error: fetchError } = await tryCatch(
    findAppByIdentifierSimple(id, session.user.id),
  );

  if (fetchError) {
    logger.error("Error fetching app for deletion:", fetchError);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }

  if (!existingApp) {
    return NextResponse.json({ error: "App not found" }, { status: 404 });
  }

  const { error: deleteError } = await tryCatch(
    prisma.$transaction([
      prisma.app.update({
        where: { id: existingApp.id },
        data: { status: "ARCHIVED" },
      }),
      prisma.appStatusHistory.create({
        data: {
          appId: existingApp.id,
          status: "ARCHIVED",
          message: "App archived by user",
        },
      }),
    ]),
  );

  if (deleteError) {
    logger.error("Error deleting app:", deleteError);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
