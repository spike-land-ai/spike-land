/**
 * Personalized Store API
 *
 * GET /api/store/personalized - Returns filtered store apps based on user's AVL profile.
 * Unauthenticated users receive the full unfiltered list.
 */

import { auth } from "@/lib/auth";
import { tryCatch } from "@/lib/try-catch";
import { NextResponse } from "next/server";

export async function GET() {
  const { data: response, error: handlerError } = await tryCatch((async () => {
    const { data: session, error: authError } = await tryCatch(auth());

    if (authError) {
      return NextResponse.json(
        { error: "Failed to fetch personalized apps" },
        { status: 500 },
      );
    }

    const { data: result, error: fetchError } = await tryCatch((async () => {
      const { getPersonalizedApps } = await import(
        "@/lib/avl-profile/personalization"
      );

      if (!session?.user?.id) {
        // Unauthenticated: return all apps
        const { STORE_APPS } = await import("@/app/store/data/store-apps");
        return { apps: STORE_APPS };
      }

      const apps = await getPersonalizedApps(session.user.id);
      return { apps };
    })());

    if (fetchError) {
      return NextResponse.json(
        { error: "Failed to fetch personalized apps" },
        { status: 500 },
      );
    }

    return NextResponse.json(result);
  })());

  if (handlerError) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }

  return response;
}
