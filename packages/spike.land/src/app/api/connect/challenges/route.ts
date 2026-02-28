/**
 * GET /api/connect/challenges - List open challenges
 * POST /api/connect/challenges - Create challenge (admin only)
 */

import { auth } from "@/lib/auth";
import { verifyAdminAccess } from "@/lib/auth/admin-middleware";
import { cacheChallengeList, getCachedChallengeList } from "@/lib/arena/redis";
import prisma from "@/lib/prisma";
import { tryCatch } from "@/lib/try-catch";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/logger";

const CreateChallengeSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  category: z.string().min(1).max(50),
  difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"])
    .optional(),
  closesAt: z.string().datetime().optional(),
});

export async function GET() {
  // Try cache first
  const cached = await getCachedChallengeList<unknown[]>();
  if (cached) {
    return NextResponse.json(cached);
  }

  const { data: challenges, error } = await tryCatch(
    prisma.arenaChallenge.findMany({
      where: { status: "OPEN" },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { submissions: true } },
        createdBy: { select: { name: true, image: true } },
      },
    }),
  );

  if (error) {
    return NextResponse.json({ error: "Internal server error" }, {
      status: 500,
    });
  }

  await cacheChallengeList(challenges).catch(err =>
    logger.error("[challenges] Failed to cache challenge list:", err)
  );

  return NextResponse.json(challenges);
}

export async function POST(request: NextRequest) {
  const { data: session, error: authError } = await tryCatch(auth());

  if (authError || !session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = await verifyAdminAccess(session);
  if (!isAdmin) {
    return NextResponse.json({ error: "Admin access required" }, {
      status: 403,
    });
  }

  const { data: body, error: parseError } = await tryCatch(request.json());
  if (parseError) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const validated = CreateChallengeSchema.safeParse(body);
  if (!validated.success) {
    return NextResponse.json(
      { error: "Validation failed", details: validated.error.flatten() },
      { status: 400 },
    );
  }

  const { data: challenge, error: createError } = await tryCatch(
    prisma.arenaChallenge.create({
      data: {
        title: validated.data.title,
        description: validated.data.description,
        category: validated.data.category,
        difficulty: validated.data.difficulty || "INTERMEDIATE",
        closesAt: validated.data.closesAt
          ? new Date(validated.data.closesAt)
          : null,
        createdById: session.user.id,
      },
    }),
  );

  if (createError) {
    return NextResponse.json({ error: "Failed to create challenge" }, {
      status: 500,
    });
  }

  return NextResponse.json(challenge, { status: 201 });
}
