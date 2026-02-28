import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { tryCatch } from "@/lib/try-catch";

interface VoteRequestBody {
  articleSlug: string;
  personaSlug: string;
  questionVariant: string;
  answer: "yes" | "no";
}

function isValidVoteBody(body: unknown): body is VoteRequestBody {
  if (typeof body !== "object" || body === null) return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.articleSlug === "string"
    && b.articleSlug.length > 0
    && typeof b.personaSlug === "string"
    && b.personaSlug.length > 0
    && typeof b.questionVariant === "string"
    && b.questionVariant.length > 0
    && (b.answer === "yes" || b.answer === "no")
  );
}

/**
 * POST /api/blog/poll — submit or update a vote
 */
export async function POST(request: Request) {
  const { data: result, error } = await tryCatch((async () => {
    const body: unknown = await request.json();

    if (!isValidVoteBody(body)) {
      return { status: 400 as const, body: { error: "Invalid request body" } };
    }

    const cookieStore = await cookies();
    let visitorId = cookieStore.get("spike-visitor-id")?.value;

    if (!visitorId) {
      visitorId = crypto.randomUUID();
    }

    const prisma = (await import("@/lib/prisma")).default;

    await prisma.blogPollVote.upsert({
      where: {
        articleSlug_visitorId: {
          articleSlug: body.articleSlug,
          visitorId,
        },
      },
      update: {
        answer: body.answer,
        personaSlug: body.personaSlug,
        question: body.questionVariant,
      },
      create: {
        articleSlug: body.articleSlug,
        personaSlug: body.personaSlug,
        question: body.questionVariant,
        answer: body.answer,
        visitorId,
      },
    });

    return { status: 200 as const, body: { success: true, visitorId } };
  })());

  if (error) {
    return NextResponse.json(
      { error: "Failed to submit vote" },
      { status: 500 },
    );
  }

  const response = NextResponse.json(result.body, { status: result.status });

  if (result.status === 200 && result.body && "visitorId" in result.body) {
    const vid = result.body.visitorId as string;
    response.cookies.set("spike-visitor-id", vid, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
  }

  return response;
}

interface PersonaVoteAgg {
  total_readers: number;
  votes_yes: number;
  votes_no: number;
  engagement_rate: number;
}

/**
 * GET /api/blog/poll?slug=<article> — aggregated results per persona
 */
export async function GET(request: Request) {
  const { data: result, error } = await tryCatch((async () => {
    const url = new URL(request.url);
    const slug = url.searchParams.get("slug");

    if (!slug) {
      return {
        status: 400 as const,
        body: { error: "Missing slug parameter" },
      };
    }

    const prisma = (await import("@/lib/prisma")).default;

    const votes = await prisma.blogPollVote.findMany({
      where: { articleSlug: slug },
      select: { personaSlug: true, answer: true },
    });

    const grouped = new Map<string, { yes: number; no: number; }>();

    for (const vote of votes) {
      const existing = grouped.get(vote.personaSlug) ?? { yes: 0, no: 0 };
      if (vote.answer === "yes") {
        existing.yes += 1;
      } else {
        existing.no += 1;
      }
      grouped.set(vote.personaSlug, existing);
    }

    const personas: Record<string, PersonaVoteAgg> = {};
    for (const [personaSlug, counts] of grouped) {
      const total = counts.yes + counts.no;
      personas[personaSlug] = {
        total_readers: total,
        votes_yes: counts.yes,
        votes_no: counts.no,
        engagement_rate: total > 0
          ? Math.round((total / Math.max(total, 1)) * 100)
          : 0,
      };
    }

    return { status: 200 as const, body: { personas } };
  })());

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch poll results" },
      { status: 500 },
    );
  }

  return NextResponse.json(result.body, { status: result.status });
}
