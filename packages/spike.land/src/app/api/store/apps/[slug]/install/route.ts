import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Prisma model (migration separate):
// model AppInstall {
//   id        String   @id @default(cuid())
//   appSlug   String
//   userId    String
//   createdAt DateTime @default(now())
//   @@unique([appSlug, userId])
// }

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string; }>; },
) {
  const { slug } = await params;
  const session = await auth();

  try {
    const { redis } = await import("@/lib/upstash/client");
    const count = (await redis.get<number>(`install:count:${slug}`)) ?? 0;

    let installed = false;
    if (session?.user?.id) {
      const prisma = (await import("@/lib/prisma")).default;
      const existing = await prisma.storeAppInstall.findUnique({
        where: {
          appSlug_userId: { appSlug: slug, userId: session.user.id },
        },
      });
      installed = !!existing;
    }

    return NextResponse.json({ count, installed });
  } catch {
    return NextResponse.json({ count: 0, installed: false });
  }
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ slug: string; }>; },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { slug } = await params;

  try {
    const prisma = (await import("@/lib/prisma")).default;
    const { redis } = await import("@/lib/upstash/client");

    await prisma.storeAppInstall.upsert({
      where: {
        appSlug_userId: { appSlug: slug, userId: session.user.id },
      },
      update: {},
      create: { appSlug: slug, userId: session.user.id },
    });

    const countKey = `install:count:${slug}`;
    const count = await redis.incr(countKey);
    // Set a long TTL on first increment to prevent orphaned keys; refreshed on each install
    if (count === 1) {
      await redis.expire(countKey, 365 * 24 * 60 * 60); // 1 year
    }
    return NextResponse.json({ count, installed: true });
  } catch {
    return NextResponse.json({ error: "Failed to install" }, { status: 500 });
  }
}
