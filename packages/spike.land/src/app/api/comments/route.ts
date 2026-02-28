import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limiter";
import { getClientIp } from "@/lib/security/ip";
import { tryCatch } from "@/lib/try-catch";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const VALID_CONTENT_TYPES = ["blog", "app", "docs"] as const;

const createCommentSchema = z.object({
  contentType: z.enum(VALID_CONTENT_TYPES),
  contentSlug: z.string().min(1).max(256),
  body: z.string().min(1).max(5000),
  parentId: z.string().optional(),
});

/**
 * GET /api/comments?contentType=blog&slug=my-slug
 *
 * Lists comments for a given content item, with user info and replies.
 */
export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const { isLimited } = await checkRateLimit(
    `comments-get:${ip}`,
    { maxRequests: 60, windowMs: 60_000 },
  );
  if (isLimited) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 },
    );
  }

  const contentType = request.nextUrl.searchParams.get("contentType");
  const slug = request.nextUrl.searchParams.get("slug");
  const rawPage = parseInt(request.nextUrl.searchParams.get("page") ?? "1", 10);
  const rawLimit = parseInt(request.nextUrl.searchParams.get("limit") ?? "20", 10);
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : 1;
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 50) : 20;

  if (!contentType || !slug) {
    return NextResponse.json(
      { error: "Missing contentType or slug" },
      { status: 400 },
    );
  }

  if (!VALID_CONTENT_TYPES.includes(contentType as typeof VALID_CONTENT_TYPES[number])) {
    return NextResponse.json(
      { error: "Invalid contentType" },
      { status: 400 },
    );
  }

  const offset = (page - 1) * limit;

  const { data: comments, error } = await tryCatch(
    prisma.comment.findMany({
      where: {
        contentType,
        contentSlug: slug,
        parentId: null, // Only top-level comments
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
        replies: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
    }),
  );

  if (error) {
    // Gracefully handle missing table (e.g. migration not yet applied)
    return NextResponse.json({
      comments: [],
      total: 0,
      page,
      limit,
    });
  }

  const { data: total } = await tryCatch(
    prisma.comment.count({
      where: { contentType, contentSlug: slug, parentId: null },
    }),
  );

  return NextResponse.json({
    comments: comments ?? [],
    total: total ?? 0,
    page,
    limit,
  });
}

/**
 * POST /api/comments
 *
 * Create a new comment. Requires authentication.
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, {
      status: 401,
    });
  }

  const { isLimited } = await checkRateLimit(
    `comments-post:${session.user.id}`,
    { maxRequests: 10, windowMs: 60_000 },
  );
  if (isLimited) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 },
    );
  }

  const { data: body, error: parseError } = await tryCatch(request.json());
  if (parseError) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = createCommentSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { contentType, contentSlug, body: commentBody, parentId } = result.data;

  // If replying, verify parent exists and belongs to same content
  if (parentId) {
    const { data: parent } = await tryCatch(
      prisma.comment.findUnique({ where: { id: parentId } }),
    );
    if (
      !parent || parent.contentType !== contentType
      || parent.contentSlug !== contentSlug
    ) {
      return NextResponse.json(
        { error: "Parent comment not found" },
        { status: 404 },
      );
    }
  }

  const { data: comment, error } = await tryCatch(
    prisma.comment.create({
      data: {
        contentType,
        contentSlug,
        userId: session.user.id,
        body: commentBody,
        parentId: parentId ?? null,
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
        replies: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
        },
      },
    }),
  );

  if (error) {
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 },
    );
  }

  return NextResponse.json({ comment }, { status: 201 });
}
