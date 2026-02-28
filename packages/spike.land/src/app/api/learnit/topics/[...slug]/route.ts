import { getLearnItContent } from "@/lib/learnit/content-service";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string[]; }>; },
) {
  const { slug } = await params; // slug is array from [...slug]
  const slugString = slug.join("/").toLowerCase();

  try {
    const content = await getLearnItContent(slugString);

    if (!content) {
      return new NextResponse("Not Found", { status: 404 });
    }

    return NextResponse.json(content);
  } catch (_error) {
    return NextResponse.json({ error: "Failed to fetch topic" }, {
      status: 500,
    });
  }
}
