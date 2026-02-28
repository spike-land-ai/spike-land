import { auth } from "@/lib/auth";
import { requireWorkspacePermission } from "@/lib/permissions/workspace-middleware";
import prisma from "@/lib/prisma";
import { tryCatch } from "@/lib/try-catch";
import {
  brandProfileSchema,
  updateBrandProfileSchema,
} from "@/lib/validations/brand-brain";
import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { logger } from "@/lib/logger";

interface RouteParams {
  params: Promise<{ workspaceId: string; }>;
}

// GET /api/workspaces/[workspaceId]/brand-profile
// Fetch the brand profile for a workspace
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  const { workspaceId } = await params;

  // Check permission (brand:read)
  const { error: permError } = await tryCatch(
    requireWorkspacePermission(session, workspaceId, "brand:read"),
  );

  if (permError) {
    const status = permError.message.includes("Unauthorized") ? 401 : 403;
    return NextResponse.json({ error: permError.message }, { status });
  }

  // Fetch brand profile with guardrails and vocabulary
  const { data: brandProfile, error: fetchError } = await tryCatch(
    prisma.brandProfile.findUnique({
      where: { workspaceId },
      include: {
        guardrails: {
          where: { isActive: true },
          orderBy: { createdAt: "asc" },
        },
        vocabulary: {
          where: { isActive: true },
          orderBy: { createdAt: "asc" },
        },
      },
    }),
  );

  if (fetchError) {
    logger.error("Failed to fetch brand profile:", fetchError);
    return NextResponse.json(
      { error: "Failed to fetch brand profile" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    brandProfile,
    guardrails: brandProfile?.guardrails ?? [],
    vocabulary: brandProfile?.vocabulary ?? [],
  });
}

// POST /api/workspaces/[workspaceId]/brand-profile
// Create a new brand profile for a workspace
export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  const { workspaceId } = await params;

  // Check permission (brand:write)
  const { error: permError } = await tryCatch(
    requireWorkspacePermission(session, workspaceId, "brand:write"),
  );

  if (permError) {
    const status = permError.message.includes("Unauthorized") ? 401 : 403;
    return NextResponse.json({ error: permError.message }, { status });
  }

  // Parse and validate request body
  const { data: body, error: parseError } = await tryCatch(request.json());

  if (parseError) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const validationResult = brandProfileSchema.safeParse(body);

  if (!validationResult.success) {
    return NextResponse.json(
      { error: "Validation failed", details: validationResult.error.flatten() },
      { status: 400 },
    );
  }

  const {
    name,
    mission,
    values,
    toneDescriptors,
    logoUrl,
    logoR2Key,
    colorPalette,
    guardrails,
    vocabulary,
  } = validationResult.data;

  // Check if a brand profile already exists
  const { data: existing } = await tryCatch(
    prisma.brandProfile.findUnique({
      where: { workspaceId },
      select: { id: true },
    }),
  );

  if (existing) {
    return NextResponse.json(
      {
        error: "Brand profile already exists for this workspace. Use PATCH to update.",
      },
      { status: 409 },
    );
  }

  // Create brand profile with guardrails and vocabulary in a transaction
  const { data: brandProfile, error: createError } = await tryCatch(
    prisma.$transaction(async tx => {
      // Create the brand profile
      const profile = await tx.brandProfile.create({
        data: {
          workspaceId,
          name,
          mission: mission || null,
          values: values || [],
          toneDescriptors: toneDescriptors || null,
          logoUrl: logoUrl || null,
          logoR2Key: logoR2Key || null,
          colorPalette: colorPalette || [],
          createdById: session!.user!.id!,
        },
      });

      // Create guardrails if provided
      if (guardrails && guardrails.length > 0) {
        await tx.brandGuardrail.createMany({
          data: guardrails.map(g => ({
            brandProfileId: profile.id,
            type: g.type,
            name: g.name,
            description: g.description || null,
            severity: g.severity,
            ruleConfig: g.ruleConfig as Prisma.InputJsonValue | undefined,
            isActive: g.isActive ?? true,
          })),
        });
      }

      // Create vocabulary if provided
      if (vocabulary && vocabulary.length > 0) {
        await tx.brandVocabulary.createMany({
          data: vocabulary.map(v => ({
            brandProfileId: profile.id,
            type: v.type,
            term: v.term,
            replacement: v.replacement || null,
            context: v.context || null,
            isActive: v.isActive ?? true,
          })),
        });
      }

      // Return profile with relations
      return tx.brandProfile.findUnique({
        where: { id: profile.id },
        include: {
          guardrails: { where: { isActive: true } },
          vocabulary: { where: { isActive: true } },
        },
      });
    }),
  );

  if (createError) {
    logger.error("Failed to create brand profile:", createError);
    logger.error("Create error details:", {
      message: createError.message,
      name: createError.name,
      stack: createError.stack,
    });
    return NextResponse.json(
      {
        error: "Failed to create brand profile",
        details: createError.message,
      },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      success: true,
      brandProfile,
      guardrails: brandProfile?.guardrails ?? [],
      vocabulary: brandProfile?.vocabulary ?? [],
    },
    { status: 201 },
  );
}

// PATCH /api/workspaces/[workspaceId]/brand-profile
// Update an existing brand profile
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  const { workspaceId } = await params;

  // Check permission (brand:write)
  const { error: permError } = await tryCatch(
    requireWorkspacePermission(session, workspaceId, "brand:write"),
  );

  if (permError) {
    const status = permError.message.includes("Unauthorized") ? 401 : 403;
    return NextResponse.json({ error: permError.message }, { status });
  }

  // Parse and validate request body
  const { data: body, error: parseError } = await tryCatch(request.json());

  if (parseError) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const validationResult = updateBrandProfileSchema.safeParse(body);

  if (!validationResult.success) {
    return NextResponse.json(
      { error: "Validation failed", details: validationResult.error.flatten() },
      { status: 400 },
    );
  }

  const {
    name,
    mission,
    values,
    toneDescriptors,
    logoUrl,
    logoR2Key,
    colorPalette,
    guardrails,
    vocabulary,
  } = validationResult.data;

  // Check if brand profile exists
  const { data: existing, error: fetchError } = await tryCatch(
    prisma.brandProfile.findUnique({
      where: { workspaceId },
      select: { id: true },
    }),
  );

  if (fetchError) {
    logger.error("Failed to check existing brand profile:", fetchError);
    return NextResponse.json(
      { error: "Failed to check existing brand profile" },
      { status: 500 },
    );
  }

  if (!existing) {
    return NextResponse.json(
      { error: "Brand profile not found. Use POST to create." },
      { status: 404 },
    );
  }

  // Update brand profile with guardrails and vocabulary in a transaction
  const { data: brandProfile, error: updateError } = await tryCatch(
    prisma.$transaction(async tx => {
      // Build update data only for provided fields
      const updateData: Record<string, unknown> = {
        updatedById: session!.user!.id!,
        version: { increment: 1 },
      };

      if (name !== undefined) updateData.name = name;
      if (mission !== undefined) updateData.mission = mission || null;
      if (values !== undefined) updateData.values = values || [];
      if (toneDescriptors !== undefined) {
        updateData.toneDescriptors = toneDescriptors;
      }
      if (logoUrl !== undefined) updateData.logoUrl = logoUrl || null;
      if (logoR2Key !== undefined) updateData.logoR2Key = logoR2Key || null;
      if (colorPalette !== undefined) {
        updateData.colorPalette = colorPalette || [];
      }

      // Update the brand profile
      const profile = await tx.brandProfile.update({
        where: { workspaceId },
        data: updateData,
      });

      // Replace guardrails if provided (delete all, recreate)
      if (guardrails !== undefined) {
        await tx.brandGuardrail.deleteMany({
          where: { brandProfileId: profile.id },
        });

        if (guardrails.length > 0) {
          await tx.brandGuardrail.createMany({
            data: guardrails.map(g => ({
              brandProfileId: profile.id,
              type: g.type,
              name: g.name,
              description: g.description || null,
              severity: g.severity,
              ruleConfig: g.ruleConfig as Prisma.InputJsonValue | undefined,
              isActive: g.isActive ?? true,
            })),
          });
        }
      }

      // Replace vocabulary if provided (delete all, recreate)
      if (vocabulary !== undefined) {
        await tx.brandVocabulary.deleteMany({
          where: { brandProfileId: profile.id },
        });

        if (vocabulary.length > 0) {
          await tx.brandVocabulary.createMany({
            data: vocabulary.map(v => ({
              brandProfileId: profile.id,
              type: v.type,
              term: v.term,
              replacement: v.replacement || null,
              context: v.context || null,
              isActive: v.isActive ?? true,
            })),
          });
        }
      }

      // Return updated profile with relations
      return tx.brandProfile.findUnique({
        where: { id: profile.id },
        include: {
          guardrails: { where: { isActive: true } },
          vocabulary: { where: { isActive: true } },
        },
      });
    }),
  );

  if (updateError) {
    logger.error("Failed to update brand profile:", updateError);
    return NextResponse.json(
      { error: "Failed to update brand profile" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    brandProfile,
    guardrails: brandProfile?.guardrails ?? [],
    vocabulary: brandProfile?.vocabulary ?? [],
  });
}

// DELETE /api/workspaces/[workspaceId]/brand-profile
// Delete a brand profile
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  const { workspaceId } = await params;

  // Check permission (brand:delete)
  const { error: permError } = await tryCatch(
    requireWorkspacePermission(session, workspaceId, "brand:delete"),
  );

  if (permError) {
    const status = permError.message.includes("Unauthorized") ? 401 : 403;
    return NextResponse.json({ error: permError.message }, { status });
  }

  // Delete brand profile (cascades to guardrails and vocabulary)
  const { error: deleteError } = await tryCatch(
    prisma.brandProfile.delete({
      where: { workspaceId },
    }),
  );

  if (deleteError) {
    // Check if it's a not found error
    if (deleteError.message.includes("Record to delete does not exist")) {
      return NextResponse.json(
        { error: "Brand profile not found" },
        { status: 404 },
      );
    }

    logger.error("Failed to delete brand profile:", deleteError);
    return NextResponse.json(
      { error: "Failed to delete brand profile" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
