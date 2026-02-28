import { NextResponse } from "next/server";

import { tryCatch } from "@/lib/try-catch";

export async function POST(request: Request) {
  const { data: body, error } = await tryCatch(request.json());

  if (error) {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const variantId = (body as Record<string, unknown>).variantId;

  if (typeof variantId !== "string" || !variantId) {
    return NextResponse.json(
      { success: false, error: "Missing or invalid variantId" },
      { status: 400 },
    );
  }

  const prisma = (await import("@/lib/prisma")).default;

  const { data: variant, error: updateError } = await tryCatch(
    prisma.storeAppVariant.update({
      where: { id: variantId },
      data: { engagements: { increment: 1 } },
      select: { id: true },
    }),
  );

  if (updateError || !variant) {
    return NextResponse.json(
      { success: false, error: "Variant not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ success: true });
}
