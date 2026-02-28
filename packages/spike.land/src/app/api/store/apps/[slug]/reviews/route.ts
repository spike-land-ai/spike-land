import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { z } from "zod";

// Prisma model (migration separate):
// model AppReview {
//   id        String   @id @default(cuid())
//   appSlug   String
//   userId    String
//   rating    Int
//   body      String
//   helpful   Int      @default(0)
//   createdAt DateTime @default(now())
//   @@unique([appSlug, userId])
// }

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  body: z.string().min(10).max(1000),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string; }>; },
) {
  const { slug } = await params;
  try {
    const prisma = (await import("@/lib/prisma")).default;
    const reviews = await prisma.storeAppReview.findMany({
      where: { appSlug: slug },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    const total = await prisma.storeAppReview.count({
      where: { appSlug: slug },
    });
    return NextResponse.json({ reviews, total });
  } catch {
    // Table may not exist yet — return empty
    return NextResponse.json({ reviews: [], total: 0 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string; }>; },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { slug } = await params;
  const body = await req.json();
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, {
      status: 400,
    });
  }
  try {
    const prisma = (await import("@/lib/prisma")).default;
    const review = await prisma.storeAppReview.upsert({
      where: { appSlug_userId: { appSlug: slug, userId: session.user.id } },
      update: { rating: parsed.data.rating, body: parsed.data.body },
      create: {
        appSlug: slug,
        userId: session.user.id,
        rating: parsed.data.rating,
        body: parsed.data.body,
      },
    });
    return NextResponse.json({ review });
  } catch {
    return NextResponse.json({ error: "Failed to save review" }, {
      status: 500,
    });
  }
}
