import { type NextRequest, NextResponse } from "next/server";

/**
 * Health check endpoint for deployment verification
 * - Default (shallow): Returns 200 immediately (used by ALB health checks)
 * - ?deep=true: Verifies database connectivity (used by smoke tests)
 */
export async function GET(request: NextRequest) {
  const deep = request.nextUrl.searchParams.get("deep") === "true";

  if (!deep) {
    return NextResponse.json({ status: "ok" }, { status: 200 });
  }

  try {
    const prisma = (await import("@/lib/prisma")).default;
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json(
      { status: "ok", checks: { database: "connected" } },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { status: "degraded", checks: { database: "unreachable" } },
      { status: 503 },
    );
  }
}
