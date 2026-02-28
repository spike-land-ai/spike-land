import { auth } from "@/lib/auth";
import {
  checkCodespaceHasContent,
  claimCreatedApp,
  findAppByIdentifier,
  findCreatedAppByCodespace,
} from "@/lib/app-lookup";
import { tryCatch } from "@/lib/try-catch";
import { isAgentWorking } from "@/lib/upstash";
import { ensureLocalFile } from "@/lib/vibe-watcher";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

/**
 * GET /api/apps/by-codespace/[codeSpace]
 *
 * Look up an app by its codespace identifier.
 * Returns the app if it exists, or null if it doesn't (with hasContent info).
 * This allows the frontend to distinguish between "no app yet" and "app exists".
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ codeSpace: string; }>; },
) {
  const { data: session, error: authError } = await tryCatch(auth());

  if (authError || !session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: params, error: paramsError } = await tryCatch(context.params);
  if (paramsError) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  const { codeSpace } = params;

  // Validate codespace format (alphanumeric, dots, hyphens, underscores, max 50 chars)
  if (
    !codeSpace || codeSpace.length > 50
    || !/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(codeSpace)
  ) {
    return NextResponse.json(
      { error: "Invalid codespace name" },
      { status: 400 },
    );
  }

  // Try to find the app by codespace
  const { data: app, error: fetchError } = await tryCatch(
    findAppByIdentifier(codeSpace, session.user.id),
  );

  if (fetchError) {
    logger.error("Error fetching app by codespace:", fetchError);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }

  // Check if the codespace has actual content
  const { data: hasContent } = await tryCatch(
    checkCodespaceHasContent(codeSpace),
  );

  // In development, ensure local file exists for vibe coding workflow
  if (process.env.NODE_ENV === "development" && hasContent) {
    void tryCatch(ensureLocalFile(codeSpace));
  }

  if (!app) {
    // Check if user has a CreatedApp with this codespace (from /create flow)
    const { data: createdApp } = await tryCatch(
      findCreatedAppByCodespace(codeSpace, session.user.id),
    );

    if (createdApp) {
      // Auto-claim the CreatedApp by creating an App record
      const { data: claimedApp, error: claimError } = await tryCatch(
        claimCreatedApp(createdApp, session.user.id),
      );

      if (claimError) {
        logger.error("Error claiming CreatedApp:", claimError);
        // Fall through to return null - user can still create manually
      } else if (claimedApp) {
        // Successfully claimed - return the new app
        const { data: agentWorking } = await tryCatch(
          isAgentWorking(claimedApp.id),
        );

        return NextResponse.json({
          app: {
            ...claimedApp,
            agentWorking: agentWorking || false,
          },
          codeSpace,
          hasContent: hasContent || false,
          claimed: true, // Indicate this was auto-claimed from CreatedApp
        });
      }
    }

    // App doesn't exist yet - return info needed to create it
    return NextResponse.json({
      app: null,
      codeSpace,
      hasContent: hasContent || false,
    });
  }

  // App exists - check if agent is working
  const { data: agentWorking } = await tryCatch(isAgentWorking(app.id));

  return NextResponse.json({
    app: {
      ...app,
      agentWorking: agentWorking || false,
    },
    codeSpace,
    hasContent: hasContent || false,
  });
}
