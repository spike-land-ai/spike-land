import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limiter";
import { tryCatch } from "@/lib/try-catch";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string; }>;
}

/**
 * DELETE /api/comments/[id]
 *
 * Delete a comment. User must be the comment owner.
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, {
      status: 401,
    });
  }

  const { isLimited } = await checkRateLimit(
    `comments-delete:${session.user.id}`,
    { maxRequests: 10, windowMs: 60_000 },
  );
  if (isLimited) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 },
    );
  }

  const { data: comment, error: findError } = await tryCatch(
    prisma.comment.findUnique({ where: { id } }),
  );

  if (findError || !comment) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  if (comment.userId !== session.user.id) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  // Delete the comment and its replies
  const { error: deleteError } = await tryCatch(
    prisma.$transaction([
      prisma.comment.deleteMany({ where: { parentId: id } }),
      prisma.comment.delete({ where: { id } }),
    ]),
  );

  if (deleteError) {
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
