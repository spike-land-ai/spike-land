/**
 * AVL Session API
 *
 * Thin wrapper around AVL traversal functions with question rephrasing.
 */

import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    const treeName = request.nextUrl.searchParams.get("tree") ?? "default";

    if (userId) {
      // Authenticated: try continue first, falls back to start
      const { continueTraversal } = await import("@/lib/avl-profile/traversal");
      const { rephraseQuestion } = await import(
        "@/lib/avl-profile/question-phrasing"
      );
      const result = await continueTraversal(userId, treeName);

      if (result.status === "QUESTION" && result.question) {
        const rephrased = rephraseQuestion(
          result.question,
          result.questionTags ?? [],
          result.round ?? 0,
        );
        return NextResponse.json({
          ...result,
          rephrased,
        });
      }

      return NextResponse.json(result);
    }

    // Unauthenticated: start fresh anonymous traversal using a temp ID from cookie
    let tempId = request.cookies.get("spike-temp-profile")?.value;
    if (!tempId) {
      tempId = `anon-${crypto.randomUUID()}`;
    }

    const { startTraversal } = await import("@/lib/avl-profile/traversal");
    const { rephraseQuestion } = await import(
      "@/lib/avl-profile/question-phrasing"
    );
    const result = await startTraversal(tempId, treeName);

    const response = result.status === "QUESTION" && result.question
      ? NextResponse.json({
        ...result,
        rephrased: rephraseQuestion(
          result.question,
          result.questionTags ?? [],
          0,
        ),
      })
      : NextResponse.json(result);

    if (!request.cookies.get("spike-temp-profile")) {
      response.cookies.set("spike-temp-profile", tempId, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
    }

    return response;
  } catch (error) {
    logger.error("[AVL Session GET Error]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    const tempId = request.cookies.get("spike-temp-profile")?.value;
    const effectiveUserId = userId ?? tempId;

    if (!effectiveUserId) {
      return NextResponse.json({ error: "No session" }, { status: 401 });
    }

    const body = (await request.json()) as {
      sessionId: string;
      answer: boolean;
    };
    const { sessionId, answer } = body;

    if (!sessionId || typeof answer !== "boolean") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { answerQuestion } = await import("@/lib/avl-profile/traversal");
    const { rephraseQuestion } = await import(
      "@/lib/avl-profile/question-phrasing"
    );
    const result = await answerQuestion(effectiveUserId, sessionId, answer);

    if (result.status === "QUESTION" && result.question) {
      return NextResponse.json({
        ...result,
        rephrased: rephraseQuestion(
          result.question,
          result.questionTags ?? [],
          0,
        ),
      });
    }

    const response = NextResponse.json(result);

    // Set onboarded cookie when profiling completes
    if (result.status === "ASSIGNED") {
      response.cookies.set("spike-onboarded", "1", {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });

      // Set persona cookie from derived tags
      if (result.profile?.derivedTags) {
        const { derivePersonaSlugFromTags } = await import(
          "@/lib/onboarding/personas"
        );
        const slug = derivePersonaSlugFromTags(result.profile.derivedTags);
        if (slug) {
          response.cookies.set("spike-persona", slug, {
            path: "/",
            maxAge: 60 * 60 * 24 * 365,
            sameSite: "lax",
          });
        }
      }
    }

    return response;
  } catch (error) {
    logger.error("[AVL Session POST Error]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
