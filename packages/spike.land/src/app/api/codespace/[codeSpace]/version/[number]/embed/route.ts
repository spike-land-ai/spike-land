import { CORS_HEADERS, corsOptions } from "@/lib/codespace/cors";
import { buildEmbedHtml } from "@/lib/codespace/html-template";
import { getVersion } from "@/lib/codespace/session-service";
import { tryCatch } from "@/lib/try-catch";
import type { NextRequest } from "next/server";
import { logger } from "@/lib/logger";

/**
 * GET /api/codespace/[codeSpace]/version/[number]/embed
 *
 * Serves a self-contained HTML page that renders a specific immutable
 * version of the codespace app. Designed for iframe embedding.
 *
 * Replaces the Cloudflare Worker's handleVersionedContentRoute("embed")
 * from liveRoutes.ts.
 *
 * Since versions are immutable, responses are cached aggressively.
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
      `[Codespace Embed] Failed to get version ${versionNumber} for "${codeSpace}":`,
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

  const html = buildEmbedHtml({
    transpiled: version.transpiled,
    html: version.html,
    css: version.css,
    codeSpace,
  });

  return new Response(html, {
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "text/html; charset=utf-8",
      // Versions are immutable -- cache for 1 year
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Security-Policy":
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://esm.sh data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src * data: blob:; connect-src *; media-src *;",
    },
  });
}

export function OPTIONS() {
  return corsOptions();
}
