/**
 * POST /api/connect/challenges/[id]/submit - Submit a prompt
 */

import { auth } from "@/lib/auth";
import { arenaGenerateFromPrompt } from "@/lib/arena/arena-generator";
import prisma from "@/lib/prisma";
import { tryCatch } from "@/lib/try-catch";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/logger";

const SubmitPromptSchema = z.object({
  prompt: z.string().min(10).max(10000),
  systemPrompt: z.string().max(5000).optional(),
});

export async function POST(
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

  // Verify challenge exists and is open
  const { data: challenge, error: challengeError } = await tryCatch(
    prisma.arenaChallenge.findUnique({
      where: { id: params.id },
      select: { id: true, status: true, closesAt: true },
    }),
  );

  if (challengeError) {
    return NextResponse.json({ error: "Internal server error" }, {
      status: 500,
    });
  }

  if (!challenge) {
    return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
  }

  if (challenge.status !== "OPEN") {
    return NextResponse.json({ error: "Challenge is not open" }, {
      status: 400,
    });
  }

  if (challenge.closesAt && new Date(challenge.closesAt) < new Date()) {
    return NextResponse.json({ error: "Challenge has closed" }, {
      status: 400,
    });
  }

  const { data: body, error: parseError } = await tryCatch(request.json());
  if (parseError) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const validated = SubmitPromptSchema.safeParse(body);
  if (!validated.success) {
    return NextResponse.json(
      { error: "Validation failed", details: validated.error.flatten() },
      { status: 400 },
    );
  }

  // Create submission
  const { data: submission, error: createError } = await tryCatch(
    prisma.arenaSubmission.create({
      data: {
        challengeId: params.id,
        userId: session.user.id,
        prompt: validated.data.prompt,
        systemPrompt: validated.data.systemPrompt,
        status: "PROMPTED",
      },
    }),
  );

  if (createError) {
    return NextResponse.json({ error: "Failed to create submission" }, {
      status: 500,
    });
  }

  // Kick off generation async (fire-and-forget)
  arenaGenerateFromPrompt(submission.id).catch(err => {
    logger.error(`Arena generation failed for ${submission.id}:`, err);
  });

  return NextResponse.json({ submissionId: submission.id }, { status: 201 });
}
