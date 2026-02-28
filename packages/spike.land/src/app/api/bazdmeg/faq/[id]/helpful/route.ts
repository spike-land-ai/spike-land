import { checkRateLimit } from "@/lib/rate-limiter";
import { getClientIp } from "@/lib/rate-limit-presets";
import { tryCatch } from "@/lib/try-catch";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// RFC-4122 UUID v4 pattern — rejects arbitrary strings that could probe the DB
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; }>; },
) {
  const { id } = await params;

  // Validate id is a well-formed UUID before touching the database
  if (!UUID_PATTERN.test(id)) {
    return NextResponse.json({ error: "FAQ entry not found" }, { status: 404 });
  }

  const ip = getClientIp(request);

  const { isLimited } = await checkRateLimit(`bazdmeg:helpful:${ip}`, {
    maxRequests: 20,
    windowMs: 60000,
  });

  if (isLimited) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const prisma = (await import("@/lib/prisma")).default;

  // First confirm the entry exists so we return 404 rather than a DB error
  const { data: existing, error: findError } = await tryCatch(
    prisma.bazdmegFaqEntry.findUnique({ where: { id }, select: { id: true } }),
  );

  if (findError || !existing) {
    return NextResponse.json({ error: "FAQ entry not found" }, { status: 404 });
  }

  const { data: entry, error } = await tryCatch(
    prisma.bazdmegFaqEntry.update({
      where: { id },
      data: { helpfulCount: { increment: 1 } },
    }),
  );

  if (error) {
    return NextResponse.json({ error: "FAQ entry not found" }, { status: 404 });
  }

  return NextResponse.json({ helpfulCount: entry.helpfulCount });
}
