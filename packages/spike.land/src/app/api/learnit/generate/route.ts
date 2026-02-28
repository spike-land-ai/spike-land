export const maxDuration = 60; // Allow 60s for AI generation

import { auth } from "@/lib/auth";
import { generateLearnItTopic } from "@/lib/learnit/content-generator";
import {
  createOrUpdateContent,
  getLearnItContent,
  markAsFailed,
  markAsGenerating,
} from "@/lib/learnit/content-service";
import { generateMdxFromResponse } from "@/lib/learnit/mdx-generator";
import { generateTopicSchema } from "@/lib/learnit/validations";
import { checkGenerationRateLimit, getClientIp } from "@/lib/rate-limit-presets";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    const ip = getClientIp(req);

    const { allowed, retryAfterSeconds } = await checkGenerationRateLimit(
      ip,
      !!userId,
    );
    if (!allowed) {
      return new NextResponse(
        JSON.stringify({ error: "Rate limit exceeded", retryAfterSeconds }),
        { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
      );
    }

    const json = await req.json();
    const { path } = generateTopicSchema.parse(json);
    const slug = path.join("/").toLowerCase();

    // Check if duplicate generation is running or content exists
    const existing = await getLearnItContent(slug);
    if (existing && existing.status === "PUBLISHED") {
      return NextResponse.json(existing);
    }

    if (existing?.status === "GENERATING") {
      // Clean up stale GENERATING records older than 5 minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      if (existing.generatedAt && existing.generatedAt < fiveMinutesAgo) {
        await markAsFailed(slug);
        // Continue to re-generate below
      } else {
        // Basic safeguard: if it was generated < 2 mins ago, assume it's still running
        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
        if (existing.generatedAt > twoMinutesAgo) {
          return NextResponse.json({ status: "GENERATING" }, { status: 202 });
        }
      }
    }

    // Mark as generating immediately to prevent race conditions
    await markAsGenerating(slug, path, userId);

    // Trigger AI generation
    // We intentionally await this for Vercel functions unless we use background jobs using triggers/queues.
    // Given the `maxDuration`, we can await it.
    const generated = await generateLearnItTopic(path);

    if (!generated) {
      // Handle failure
      await markAsFailed(slug);
      return new NextResponse("Generation failed", { status: 500 });
    }

    // Save to DB
    const saved = await createOrUpdateContent({
      slug,
      path,
      parentSlug: path.length > 1 ? path.slice(0, -1).join("/") : null,
      title: generated.title,
      description: generated.description,
      content: generateMdxFromResponse(generated), // Helper to stitch sections
      generatedById: userId,
      aiModel: generated.aiModel,
    });

    return NextResponse.json(saved);
  } catch (error) {
    logger.error("LearnIt Generate Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
