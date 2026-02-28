import { CORS_HEADERS, corsOptions } from "@/lib/codespace/cors";
import { buildEmbedHtml } from "@/lib/codespace/html-template";
import {
  getOrCreateSession,
  upsertSession,
} from "@/lib/codespace/session-service";
import { transpileCode } from "@/lib/codespace/transpile";
import { tryCatch } from "@/lib/try-catch";
import type { NextRequest } from "next/server";
import { logger } from "@/lib/logger";

/**
 * GET /api/codespace/[codeSpace]/embed
 *
 * Serves a self-contained HTML page that renders the current session's
 * app. Designed to be loaded in an iframe for live app previews.
 *
 * Replaces the Cloudflare Worker's handleWrapHTMLRoute from liveRoutes.ts.
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

  const { data: session, error: sessionError } = await tryCatch(
    getOrCreateSession(codeSpace),
  );

  if (sessionError) {
    logger.error(
      `[Codespace Embed] Failed to get session for "${codeSpace}":`,
      sessionError,
    );
    return new Response("Failed to retrieve session", {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "text/plain" },
    });
  }

  // Auto-transpile if session has code but no transpiled output (e.g. migrated data)
  let { transpiled } = session;
  if (!transpiled && session.code) {
    const { data: result, error: transpileError } = await tryCatch(
      transpileCode(session.code),
    );
    if (transpileError) {
      logger.error(
        `[Codespace Embed] Auto-transpile failed for "${codeSpace}":`,
        transpileError,
      );
    } else if (result) {
      transpiled = result;
      // Persist so subsequent requests don't need to re-transpile
      upsertSession({
        ...session,
        transpiled,
      }).catch(err =>
        logger.error(
          `[Codespace Embed] Failed to persist transpiled code:`,
          err,
        )
      );
    }
  }

  const html = buildEmbedHtml({
    transpiled,
    html: session.html,
    css: session.css,
    codeSpace: session.codeSpace,
  });

  return new Response(html, {
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache",
      // The embed HTML uses inline scripts and module imports from esm.sh.
      // Override the parent page's CSP so the iframe content can execute.
      "Content-Security-Policy":
        "default-src 'self' https://testing.spike.land; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://esm.sh https://testing.spike.land data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src * data: blob:; connect-src * https://testing.spike.land wss://testing.spike.land; media-src *;",
    },
  });
}

export function OPTIONS() {
  return corsOptions();
}
