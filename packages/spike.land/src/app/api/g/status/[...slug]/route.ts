import { NextResponse } from "next/server";
import { getRouteBySlug } from "@/lib/generate/route-cache";
import { tryCatch } from "@/lib/try-catch";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string[]; }>; },
) {
  const { data: response, error: handlerError } = await tryCatch((async () => {
    const { slug: slugParts } = await params;
    const slug = slugParts.join("/");

    const { data: route, error } = await tryCatch(getRouteBySlug(slug));

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch route status" },
        { status: 500 },
      );
    }

    if (!route) {
      return NextResponse.json({ status: "NOT_FOUND" });
    }

    return NextResponse.json({
      status: route.status,
      title: route.title,
      description: route.description,
      codespaceUrl: route.codespaceUrl,
      generationTimeMs: route.generationTimeMs,
      viewCount: route.viewCount,
    });
  })());

  if (handlerError) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }

  return response;
}
