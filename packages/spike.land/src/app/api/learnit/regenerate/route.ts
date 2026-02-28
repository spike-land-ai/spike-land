export const maxDuration = 60;

import { auth } from "@/lib/auth";
import { generateLearnItTopic } from "@/lib/learnit/content-generator";
import {
  createOrUpdateContent,
  getLearnItContent,
  markAsFailed,
  markAsGenerating,
} from "@/lib/learnit/content-service";
import { generateMdxFromResponse } from "@/lib/learnit/mdx-generator";
import { NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/logger";

const regenerateSchema = z.object({
  slug: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const json = await req.json();
    const result = regenerateSchema.safeParse(json);
    if (!result.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const { slug } = result.data;

    // Verify content exists
    const existing = await getLearnItContent(slug);
    if (!existing) {
      return new NextResponse("Content not found", { status: 404 });
    }

    // Check if already generating
    if (existing.status === "GENERATING") {
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
      if (existing.generatedAt > twoMinutesAgo) {
        return NextResponse.json({ status: "GENERATING" }, { status: 202 });
      }
    }

    // Get path from existing content
    const path = existing.path;

    // Mark as generating
    await markAsGenerating(slug, path, session.user.id);

    // Trigger fresh AI generation
    const generated = await generateLearnItTopic(path);

    if (!generated) {
      await markAsFailed(slug);
      return new NextResponse("Regeneration failed", { status: 500 });
    }

    // Save regenerated content
    const saved = await createOrUpdateContent({
      slug,
      path,
      parentSlug: path.length > 1 ? path.slice(0, -1).join("/") : null,
      title: generated.title,
      description: generated.description,
      content: generateMdxFromResponse(generated),
      generatedById: session.user.id,
      aiModel: generated.aiModel,
    });

    return NextResponse.json(saved);
  } catch (error) {
    logger.error("LearnIt Regenerate Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
