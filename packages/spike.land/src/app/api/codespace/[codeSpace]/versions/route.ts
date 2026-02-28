import { CORS_HEADERS, corsOptions } from "@/lib/codespace/cors";
import { getVersionsList } from "@/lib/codespace/session-service";
import { tryCatch } from "@/lib/try-catch";
import type { NextRequest } from "next/server";
import { logger } from "@/lib/logger";

/**
 * GET /api/codespace/[codeSpace]/versions
 *
 * Returns the list of immutable version snapshots for a codespace.
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ codeSpace: string; }>; },
) {
  const { data: params, error: paramsError } = await tryCatch(context.params);
  if (paramsError) {
    return new Response("Invalid parameters", {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "text/plain" },
    });
  }

  const { codeSpace } = params;

  const { data: versions, error: versionsError } = await tryCatch(
    getVersionsList(codeSpace),
  );

  if (versionsError) {
    logger.error(
      `[Codespace Versions] Failed to get versions for "${codeSpace}":`,
      versionsError,
    );
    return new Response("Failed to retrieve versions", {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "text/plain" },
    });
  }

  return Response.json(
    { codeSpace, versions: versions ?? [] },
    {
      headers: {
        ...CORS_HEADERS,
        "Cache-Control": "public, max-age=10",
      },
    },
  );
}

export function OPTIONS() {
  return corsOptions();
}
