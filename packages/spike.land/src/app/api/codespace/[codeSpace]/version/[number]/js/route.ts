import { CORS_HEADERS, corsOptions } from "@/lib/codespace/cors";
import { getVersion } from "@/lib/codespace/session-service";
import { tryCatch } from "@/lib/try-catch";
import type { NextRequest } from "next/server";
import { logger } from "@/lib/logger";

/**
 * GET /api/codespace/[codeSpace]/version/[number]/js
 *
 * Returns the transpiled JavaScript for a specific immutable version.
 *
 * Replaces the Cloudflare Worker's handleVersionedContentRoute("js")
 * from liveRoutes.ts.
 *
 * The response is the raw transpiled output. The caller is responsible
 * for providing an import map that resolves bare specifiers like "react".
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ codeSpace: string; number: string; }>; },
) {
  const { data: params, error: paramsError } = await tryCatch(context.params);
  if (paramsError) {
    return new Response("Invalid parameters", {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "text/plain" },
    });
  }

  const { codeSpace } = params;
  const versionNumber = parseInt(params.number, 10);

  if (isNaN(versionNumber) || versionNumber < 1) {
    return new Response("Invalid version number", {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "text/plain" },
    });
  }

  const { data: version, error: versionError } = await tryCatch(
    getVersion(codeSpace, versionNumber),
  );

  if (versionError) {
    logger.error(
      `[Codespace JS] Failed to get version ${versionNumber} for "${codeSpace}":`,
      versionError,
    );
    return new Response("Failed to retrieve version", {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "text/plain" },
    });
  }

  if (!version) {
    return new Response("Version not found", {
      status: 404,
      headers: { ...CORS_HEADERS, "Content-Type": "text/plain" },
    });
  }

  return new Response(version.transpiled, {
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/javascript; charset=utf-8",
      // Versions are immutable -- cache for 1 year
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

export function OPTIONS() {
  return corsOptions();
}
