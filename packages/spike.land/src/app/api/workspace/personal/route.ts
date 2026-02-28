import { getPersonalWorkspaceId } from "@/lib/workspace";
import { tryCatch } from "@/lib/try-catch";
import { NextResponse } from "next/server";

export async function GET() {
  const { data: response, error: handlerError } = await tryCatch((async () => {
    const { data: workspaceId, error } = await tryCatch(
      getPersonalWorkspaceId(),
    );

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch workspace" },
        { status: 500 },
      );
    }

    if (!workspaceId) {
      return NextResponse.json({ workspaceId: null }, { status: 200 });
    }

    return NextResponse.json({ workspaceId });
  })());

  if (handlerError) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }

  return response;
}
