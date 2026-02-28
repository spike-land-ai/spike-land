/**
 * GET /api/connect/challenges/[id] - Challenge detail with top submissions
 */

import prisma from "@/lib/prisma";
import { tryCatch } from "@/lib/try-catch";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string; }>; },
) {
  const { data: params, error: paramsError } = await tryCatch(context.params);
  if (paramsError) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  const { data: challenge, error } = await tryCatch(
    prisma.arenaChallenge.findUnique({
      where: { id: params.id },
      include: {
        createdBy: { select: { name: true, image: true } },
        _count: { select: { submissions: true } },
        submissions: {
          orderBy: { reviewScore: "desc" },
          take: 20,
          select: {
            id: true,
            status: true,
            codespaceUrl: true,
            transpileSuccess: true,
            iterations: true,
            model: true,
            inputTokens: true,
            outputTokens: true,
            reviewScore: true,
            eloChange: true,
            totalDurationMs: true,
            errors: true,
            createdAt: true,
            user: { select: { id: true, name: true, image: true } },
            _count: { select: { reviews: true } },
          },
        },
      },
    }),
  );

  if (error) {
    return NextResponse.json({ error: "Internal server error" }, {
      status: 500,
    });
  }

  if (!challenge) {
    return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
  }

  return NextResponse.json(challenge);
}
