import { auth } from "@/lib/auth";
import { requireAdminByUserId } from "@/lib/auth/admin-middleware";
import {
  getChildTopics,
  getParentTopic,
  getPrerequisites,
  getRelatedTopics,
} from "@/lib/learnit/relation-service";
import prisma from "@/lib/prisma";
import { tryCatch } from "@/lib/try-catch";
import { NextResponse } from "next/server";
import { z } from "zod";

const querySchema = z.object({
  slug: z.string().min(1),
  type: z.enum(["all", "related", "prerequisites", "children", "parent"])
    .default("all"),
});

/**
 * GET /api/learnit/relations?slug=topic-slug&type=all
 * Get relationships for a topic
 */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const parsed = querySchema.safeParse({
    slug: searchParams.get("slug"),
    type: searchParams.get("type") || "all",
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  const { slug, type } = parsed.data;

  // Find the topic
  const topic = await prisma.learnItContent.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!topic) {
    return NextResponse.json({ error: "Topic not found" }, { status: 404 });
  }

  switch (type) {
    case "related":
      return NextResponse.json(await getRelatedTopics(topic.id));
    case "prerequisites":
      return NextResponse.json(await getPrerequisites(topic.id));
    case "children":
      return NextResponse.json(await getChildTopics(topic.id));
    case "parent":
      return NextResponse.json(await getParentTopic(topic.id));
    case "all":
    default:
      const [related, prerequisites, children, parent] = await Promise.all([
        getRelatedTopics(topic.id),
        getPrerequisites(topic.id),
        getChildTopics(topic.id),
        getParentTopic(topic.id),
      ]);
      return NextResponse.json({
        related,
        prerequisites,
        children,
        parent,
      });
  }
}

const createRelationSchema = z.object({
  fromSlug: z.string().min(1),
  toSlug: z.string().min(1),
  type: z.enum(["PARENT_CHILD", "RELATED", "PREREQUISITE"]),
  strength: z.number().min(0).max(1).optional(),
});

/**
 * POST /api/learnit/relations
 * Create a relationship between two topics (admin only)
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { error: adminError } = await tryCatch(
    requireAdminByUserId(session.user.id),
  );

  if (adminError) {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, {
      status: 403,
    });
  }

  const json = await req.json();
  const parsed = createRelationSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({
      error: "Invalid parameters",
      details: parsed.error,
    }, {
      status: 400,
    });
  }

  const { fromSlug, toSlug, type, strength } = parsed.data;

  // Find both topics
  const [fromTopic, toTopic] = await Promise.all([
    prisma.learnItContent.findUnique({
      where: { slug: fromSlug },
      select: { id: true },
    }),
    prisma.learnItContent.findUnique({
      where: { slug: toSlug },
      select: { id: true },
    }),
  ]);

  if (!fromTopic || !toTopic) {
    return NextResponse.json({ error: "One or both topics not found" }, {
      status: 404,
    });
  }

  // Create the relation
  const relation = await prisma.learnItRelation.upsert({
    where: {
      fromTopicId_toTopicId_type: {
        fromTopicId: fromTopic.id,
        toTopicId: toTopic.id,
        type,
      },
    },
    create: {
      fromTopicId: fromTopic.id,
      toTopicId: toTopic.id,
      type,
      strength: strength ?? 1.0,
    },
    update: {
      strength: strength ?? 1.0,
    },
  });

  return NextResponse.json(relation, { status: 201 });
}
