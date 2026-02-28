import { getCreatedApp } from "@/lib/create/content-service";
import { tryCatch } from "@/lib/try-catch";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const slug = new URL(request.url).searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "Slug query parameter is required" }, {
      status: 400,
    });
  }

  const app = await getCreatedApp(slug);
  if (!app || !app.codespaceId) {
    return NextResponse.json({ error: "App not found" }, { status: 404 });
  }

  // Fetch screenshot from component worker
  const componentUrl = process.env.SPIKE_LAND_COMPONENT_URL
    ?? "https://testing.spike.land";
  const screenshotUrl = `${componentUrl}/live/${app.codespaceId}/screenshot`;
  const { data: response, error: fetchError } = await tryCatch(
    fetch(screenshotUrl, { next: { revalidate: 30 } }),
  );

  if (fetchError || !response?.ok) {
    return NextResponse.json({ error: "Screenshot unavailable" }, {
      status: 502,
    });
  }

  const { data: arrayBuffer, error: bufferError } = await tryCatch(
    response.arrayBuffer(),
  );
  if (bufferError || !arrayBuffer) {
    return NextResponse.json({ error: "Failed to read screenshot" }, {
      status: 502,
    });
  }

  const base64 = Buffer.from(arrayBuffer).toString("base64");

  return NextResponse.json(
    { base64, mimeType: "image/jpeg" },
    {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    },
  );
}
