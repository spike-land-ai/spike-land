/**
 * POST /api/connect/challenges/[id]/review - Submit a review
 */

import { auth } from "@/lib/auth";
import { submitReview } from "@/lib/arena/review";
import prisma from "@/lib/prisma";
import { tryCatch } from "@/lib/try-catch";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const BugSchema = z.object({
  description: z.string().min(1).max(500),
  severity: z.enum(["low", "medium", "high", "critical"]),
  line: z.number().int().positive().optional(),
});

const ReviewSchema = z.object({
  submission_id: z.string().min(1),
  bugs: z.array(BugSchema).max(20).default([]),
  score: z.number().min(0).max(1),
  approved: z.boolean(),
  comment: z.string().max(2000).optional(),
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

  const { data: body, error: parseError } = await tryCatch(request.json());
  if (parseError) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const validated = ReviewSchema.safeParse(body);
  if (!validated.success) {
    return NextResponse.json(
      { error: "Validation failed", details: validated.error.flatten() },
      { status: 400 },
    );
  }

  // Verify submission belongs to this challenge
  const { data: submission, error: subError } = await tryCatch(
    prisma.arenaSubmission.findFirst({
      where: { id: validated.data.submission_id, challengeId: params.id },
      select: { id: true },
    }),
  );

  if (subError || !submission) {
    return NextResponse.json({
      error: "Submission not found in this challenge",
    }, { status: 404 });
  }

  const { data: result, error: reviewError } = await tryCatch(
    submitReview({
      submissionId: validated.data.submission_id,
      reviewerId: session.user.id,
      bugs: validated.data.bugs,
      score: validated.data.score,
      approved: validated.data.approved,
      comment: validated.data.comment,
    }),
  );

  if (reviewError) {
    const message = reviewError instanceof Error
      ? reviewError.message
      : "Failed to submit review";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json(result, { status: 201 });
}
