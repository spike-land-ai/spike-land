import logger from "@/lib/logger";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { tryCatch } from "@/lib/try-catch";
import {
  getUserFavorites,
  getUserRecentWorkspaces,
} from "@/lib/workspace/aggregate-queries";
import { NextResponse } from "next/server";
import { z } from "zod";

// Validation schema for workspace creation
const createWorkspaceSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(
    50,
    "Name must be at most 50 characters",
  ),
  description: z.string().max(200, "Description must be at most 200 characters")
    .optional(),
  isPersonal: z.boolean().optional().default(false),
});

/**
 * Generate a URL-safe slug from a name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

/**
 * Ensure slug is unique by appending a suffix if needed
 */
async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let suffix = 0;

  while (true) {
    const existing = await prisma.workspace.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!existing) {
      return slug;
    }

    suffix++;
    slug = `${baseSlug}-${suffix}`;
  }
}

// GET /api/workspaces - List user's workspaces with favorites and recents
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch workspaces, favorites, and recent access in parallel
  const [membershipsResult, favoritesResult, recentsResult] = await Promise.all(
    [
      tryCatch(
        prisma.workspaceMember.findMany({
          where: {
            userId: session.user.id,
            joinedAt: { not: null }, // Only include accepted memberships
          },
          include: {
            workspace: {
              select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                avatarUrl: true,
                isPersonal: true,
              },
            },
          },
          orderBy: [
            { workspace: { isPersonal: "desc" } }, // Personal workspace first
            { workspace: { name: "asc" } },
          ],
        }),
      ),
      tryCatch(getUserFavorites(session.user.id)),
      tryCatch(getUserRecentWorkspaces(session.user.id, 10)),
    ],
  );

  if (membershipsResult.error) {
    logger.error("Failed to fetch workspaces:", membershipsResult.error);
    return NextResponse.json(
      { error: "Failed to fetch workspaces" },
      { status: 500 },
    );
  }

  // Log but don't fail if favorites/recents fail - they're optional enhancements
  if (favoritesResult.error) {
    logger.error("Failed to fetch favorites:", favoritesResult.error);
  }
  if (recentsResult.error) {
    logger.error("Failed to fetch recent workspaces:", recentsResult.error);
  }

  const favoriteIds = favoritesResult.data || [];
  const recentIds = recentsResult.data || [];
  const favoriteSet = new Set(favoriteIds);

  return NextResponse.json({
    workspaces: membershipsResult.data.map(m => ({
      ...m.workspace,
      role: m.role,
      isFavorite: favoriteSet.has(m.workspace.id),
    })),
    favorites: favoriteIds,
    recentIds: recentIds,
  });
}

// POST /api/workspaces - Create a new workspace
export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse and validate request body
  const { data: body, error: parseError } = await tryCatch(request.json());

  if (parseError) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const validation = createWorkspaceSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.issues[0]?.message || "Invalid input" },
      { status: 400 },
    );
  }

  // Verify user still exists in database (security/integrity check)
  const { data: userExists, error: userCheckError } = await tryCatch(
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true },
    }),
  );

  if (userCheckError) {
    logger.error("Failed to check user existence:", userCheckError);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }

  if (!userExists) {
    return NextResponse.json(
      { error: "User not found" },
      { status: 401 },
    );
  }

  const { name, description, isPersonal } = validation.data;

  // Generate unique slug
  const baseSlug = generateSlug(name);
  const { data: slug, error: slugError } = await tryCatch(
    ensureUniqueSlug(baseSlug),
  );

  if (slugError || !slug) {
    logger.error("Failed to generate slug:", slugError);
    return NextResponse.json(
      { error: "Failed to generate workspace URL" },
      { status: 500 },
    );
  }

  // Create workspace and add user as owner in a transaction
  const { data: result, error: createError } = await tryCatch(
    prisma.$transaction(async tx => {
      // Create the workspace
      const workspace = await tx.workspace.create({
        data: {
          name,
          slug,
          description: description || null,
          isPersonal: isPersonal || false,
        },
      });

      // Add the creator as owner
      await tx.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId: session.user!.id,
          role: "OWNER",
          joinedAt: new Date(),
        },
      });

      return workspace;
    }),
  );

  if (createError || !result) {
    logger.error("Failed to create workspace:", createError);
    return NextResponse.json(
      { error: "Failed to create workspace" },
      { status: 500 },
    );
  }

  return NextResponse.json({ workspace: result }, { status: 201 });
}
