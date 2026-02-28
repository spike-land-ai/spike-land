import { auth } from "@/lib/auth";
import { getCreatedApp } from "@/lib/create/content-service";
import { runAutoReview } from "@/lib/create/auto-reviewer";
import { runAiReview } from "@/lib/create/ai-reviewer";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

/**
 * GET /api/create/review?slug=...
 * View review history for a created app.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    return NextResponse.json({ error: "slug parameter required" }, {
      status: 400,
    });
  }

  const app = await getCreatedApp(slug);
  if (!app) {
    return NextResponse.json({ error: "App not found" }, { status: 404 });
  }

  const reviews = await prisma.appReview.findMany({
    where: { appId: app.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    slug: app.slug,
    status: app.status,
    reviewScore: app.reviewScore,
    lastReviewedAt: app.lastReviewedAt,
    lastError: app.lastError,
    attempts: app.attempts,
    reviews,
  });
}

const TriggerReviewSchema = z.object({
  slug: z.string(),
  phase: z.enum(["AUTO_REVIEW", "AI_REVIEW"]),
});

/**
 * POST /api/create/review
 * Trigger a manual review for a created app.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = TriggerReviewSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { slug, phase } = parsed.data;

  const app = await getCreatedApp(slug);
  if (!app) {
    return NextResponse.json({ error: "App not found" }, { status: 404 });
  }

  // Only the app creator or an admin can trigger a review
  const isOwner = app.generatedById === session.user.id;
  if (!isOwner) {
    const { requireAdminByUserId } = await import(
      "@/lib/auth/admin-middleware"
    );
    const { error: adminError } = await (async () => {
      try {
        await requireAdminByUserId(session.user.id);
        return { error: null };
      } catch (e) {
        return { error: e };
      }
    })();
    if (adminError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  if (!app.codespaceId) {
    return NextResponse.json({ error: "App has no codespace" }, {
      status: 400,
    });
  }

  if (phase === "AUTO_REVIEW") {
    const result = await runAutoReview(app.codespaceId);
    return NextResponse.json({
      phase: "AUTO_REVIEW",
      ...result,
    });
  }

  const result = await runAiReview(app.id, app.codespaceId);
  return NextResponse.json({
    phase: "AI_REVIEW",
    ...result,
  });
}
