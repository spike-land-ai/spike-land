import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkCredits } from "@/lib/generate/credit-service";
import { getOrCreateRoute } from "@/lib/generate/route-cache";
import { generateRoute } from "@/lib/generate/pipeline";
import { GeneratedRouteStatus } from "@prisma/client";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const slug = body?.slug;
  if (!slug || typeof slug !== "string") {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  const { hasCredits } = await checkCredits(session.user.id);
  if (!hasCredits) {
    return NextResponse.json({ error: "Insufficient credits" }, {
      status: 402,
    });
  }

  const route = await getOrCreateRoute(slug, `/${slug}`, session.user.id);

  if (route.status === GeneratedRouteStatus.PUBLISHED) {
    return NextResponse.json({
      generationId: route.id,
      status: "PUBLISHED",
      codespaceUrl: route.codespaceUrl,
    });
  }

  // Check if already generating
  if (
    route.status !== GeneratedRouteStatus.NEW
    && route.status !== GeneratedRouteStatus.FAILED
  ) {
    return NextResponse.json({
      generationId: route.id,
      status: route.status,
      streamUrl: `/api/g/stream/${route.id}`,
    }, { status: 202 });
  }

  // Start pipeline in background (fire-and-forget)
  // The stream endpoint will pick up events
  const pipeline = generateRoute(slug, `/${slug}`, session.user.id);

  // Consume the pipeline in the background
  (async () => {
    try {
      for await (const _event of pipeline) {
        // Events are consumed; status is persisted to DB by the pipeline
      }
    } catch {
      // Pipeline handles its own errors
    }
  })();

  return NextResponse.json({
    generationId: route.id,
    streamUrl: `/api/g/stream/${route.id}`,
  });
}
