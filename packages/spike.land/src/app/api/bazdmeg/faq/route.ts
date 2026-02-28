import { auth } from "@/lib/auth";
import { isAdminByUserId } from "@/lib/auth/admin-middleware";
import { tryCatch } from "@/lib/try-catch";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

/** GET: list published FAQ entries (public) */
export async function GET(request: NextRequest) {
  const prisma = (await import("@/lib/prisma")).default;
  const category = request.nextUrl.searchParams.get("category");

  const entries = await prisma.bazdmegFaqEntry.findMany({
    where: {
      isPublished: true,
      ...(category ? { category } : {}),
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({ entries });
}

const CreateFaqSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
  category: z.string().default("general"),
  sortOrder: z.number().default(0),
  isPublished: z.boolean().default(true),
});

const UpdateFaqSchema = z.object({
  id: z.string().min(1),
  question: z.string().optional(),
  answer: z.string().optional(),
  category: z.string().optional(),
  sortOrder: z.number().optional(),
  isPublished: z.boolean().optional(),
});

/** POST: create FAQ entry (admin only) */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const isUserAdmin = await isAdminByUserId(session.user.id);
  if (!isUserAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: body, error: jsonError } = await tryCatch(request.json());
  if (jsonError) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = CreateFaqSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const prisma = (await import("@/lib/prisma")).default;
  const entry = await prisma.bazdmegFaqEntry.create({ data: parsed.data });
  return NextResponse.json({ entry }, { status: 201 });
}

/** PATCH: update FAQ entry (admin only) */
export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const isUserAdmin = await isAdminByUserId(session.user.id);
  if (!isUserAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: body, error: jsonError } = await tryCatch(request.json());
  if (jsonError) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = UpdateFaqSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const { id, ...updateData } = parsed.data;
  const prisma = (await import("@/lib/prisma")).default;

  const { data: entry, error } = await tryCatch(
    prisma.bazdmegFaqEntry.update({ where: { id }, data: updateData }),
  );

  if (error) {
    return NextResponse.json({ error: "FAQ entry not found" }, { status: 404 });
  }

  return NextResponse.json({ entry });
}

/** DELETE: delete FAQ entry (admin only) */
export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const isUserAdmin = await isAdminByUserId(session.user.id);
  if (!isUserAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: body, error: jsonError } = await tryCatch(request.json());
  if (jsonError) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { id } = body as { id?: string; };
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const prisma = (await import("@/lib/prisma")).default;
  const { error } = await tryCatch(
    prisma.bazdmegFaqEntry.delete({ where: { id } }),
  );

  if (error) {
    return NextResponse.json({ error: "FAQ entry not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
