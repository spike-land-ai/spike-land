import { auth } from "@/lib/auth";
import { getCreatedApp, triggerReReview } from "@/lib/create/content-service";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const RevalidateSchema = z.object({
  slug: z.string(),
});

/**
 * POST /api/create/revalidate
 * Force re-validation of a published app.
 * Checks codespace health and marks as FAILED if unhealthy.
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

  const parsed = RevalidateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { slug } = parsed.data;

  const app = await getCreatedApp(slug);
  if (!app) {
    return NextResponse.json({ error: "App not found" }, { status: 404 });
  }

  const result = await triggerReReview(app);

  return NextResponse.json({
    slug,
    healthy: result.healthy,
    status: result.healthy ? "PUBLISHED" : "FAILED",
  });
}
