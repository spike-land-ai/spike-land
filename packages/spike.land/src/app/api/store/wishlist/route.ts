import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Prisma model (migration separate):
// model AppWishlist {
//   id        String   @id @default(cuid())
//   appSlug   String
//   userId    String
//   createdAt DateTime @default(now())
//   @@unique([appSlug, userId])
// }

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ slugs: [] });
  }

  try {
    const prisma = (await import("@/lib/prisma")).default;
    const wishlist = await prisma.storeAppWishlist.findMany({
      where: { userId: session.user.id },
      select: { appSlug: true },
    });
    return NextResponse.json({
      slugs: wishlist.map((w: { appSlug: string; }) => w.appSlug),
    });
  } catch {
    return NextResponse.json({ slugs: [] });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as { appSlug: string; };
    const prisma = (await import("@/lib/prisma")).default;

    const existing = await prisma.storeAppWishlist.findUnique({
      where: {
        appSlug_userId: {
          appSlug: body.appSlug,
          userId: session.user.id,
        },
      },
    });

    if (existing) {
      await prisma.storeAppWishlist.delete({
        where: { id: existing.id },
      });
      return NextResponse.json({ wishlisted: false });
    }

    await prisma.storeAppWishlist.create({
      data: { appSlug: body.appSlug, userId: session.user.id },
    });
    return NextResponse.json({ wishlisted: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
