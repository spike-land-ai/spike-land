import { isCodespaceHealthy } from "@/lib/create/codespace-health";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const codespaceId = request.nextUrl.searchParams.get("codespaceId");

  if (!codespaceId) {
    return NextResponse.json({ error: "codespaceId is required" }, {
      status: 400,
    });
  }

  const healthy = await isCodespaceHealthy(codespaceId);

  return NextResponse.json(
    { healthy },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    },
  );
}
