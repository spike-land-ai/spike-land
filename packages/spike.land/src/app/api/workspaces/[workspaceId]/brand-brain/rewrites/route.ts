import { auth } from "@/lib/auth";
import { requireWorkspacePermission } from "@/lib/permissions/workspace-middleware";
import prisma from "@/lib/prisma";
import { tryCatch } from "@/lib/try-catch";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/logger";

interface RouteParams {
  params: Promise<{ workspaceId: string; }>;
}

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["PENDING", "PROCESSING", "COMPLETED", "FAILED"]).optional(),
  platform: z.enum(["TWITTER", "LINKEDIN", "INSTAGRAM", "FACEBOOK", "GENERAL"])
    .optional(),
});

// GET /api/workspaces/[workspaceId]/brand-brain/rewrites
// List rewrite history for the workspace
export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  const { workspaceId } = await params;

  // Check permission (brand:read - viewing history is a read operation)
  const { error: permError } = await tryCatch(
    requireWorkspacePermission(session, workspaceId, "brand:read"),
  );

  if (permError) {
    const status = permError.message.includes("Unauthorized") ? 401 : 403;
    return NextResponse.json({ error: permError.message }, { status });
  }

  // Parse query parameters
  const searchParams = request.nextUrl.searchParams;
  const queryResult = listQuerySchema.safeParse({
    page: searchParams.get("page") ?? 1,
    pageSize: searchParams.get("pageSize") ?? 20,
    status: searchParams.get("status") ?? undefined,
    platform: searchParams.get("platform") ?? undefined,
  });

  if (!queryResult.success) {
    return NextResponse.json(
      {
        error: "Invalid query parameters",
        details: queryResult.error.flatten(),
      },
      { status: 400 },
    );
  }

  const { page, pageSize, status, platform } = queryResult.data;

  // Build where clause
  const where = {
    workspaceId,
    ...(status && { status }),
    ...(platform && { platform }),
  };

  // Fetch rewrites with pagination
  const { data: result, error: fetchError } = await tryCatch(
    Promise.all([
      prisma.contentRewrite.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          originalContent: true,
          rewrittenContent: true,
          platform: true,
          status: true,
          characterLimit: true,
          createdAt: true,
        },
      }),
      prisma.contentRewrite.count({ where }),
    ]),
  );

  if (fetchError) {
    logger.error("Failed to fetch rewrite history:", fetchError);
    return NextResponse.json(
      { error: "Failed to fetch rewrite history" },
      { status: 500 },
    );
  }

  const [items, total] = result;

  return NextResponse.json({
    items: items.map(item => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
    })),
    total,
    page,
    pageSize,
  });
}
