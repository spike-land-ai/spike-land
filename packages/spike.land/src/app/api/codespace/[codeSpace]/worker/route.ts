import { CORS_HEADERS, corsOptions } from "@/lib/codespace/cors";
import {
  getOrCreateSession,
  upsertSession,
} from "@/lib/codespace/session-service";
import { buildWorkerDomHtml } from "@/lib/codespace/worker-dom-template";
import { bundleWorkerDom } from "@/lib/codespace/worker-dom-bundler";
import { transpileCodeWorkerDom } from "@/lib/codespace/transpile";
import { tryCatch } from "@/lib/try-catch";
import type { NextRequest } from "next/server";
import { logger } from "@/lib/logger";

const BUILD_TIMEOUT_MS = 15_000;

/**
 * GET /api/codespace/[codeSpace]/worker
 *
 * Serves a Worker-DOM rendered HTML page where React runs in a Web Worker
 * and DOM mutations are forwarded to the main thread.
 *
 * This is a new rendering mode alongside embed and bundle modes.
 * No caching for v1 — always rebuilds.
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

  // Load session
  const { data: session, error: sessionError } = await tryCatch(
    getOrCreateSession(codeSpace),
  );

  if (sessionError) {
    logger.error(
      `[Codespace Worker-DOM] Failed to get session for "${codeSpace}":`,
      sessionError,
    );
    return new Response("Failed to retrieve session", {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "text/plain" },
    });
  }

  // Transpile with react-ts-worker JSX source
  let transpiled = "";
  if (session.code) {
    const { data: result, error: transpileError } = await tryCatch(
      transpileCodeWorkerDom(session.code),
    );
    if (transpileError) {
      logger.error(
        `[Codespace Worker-DOM] Transpile failed for "${codeSpace}":`,
        transpileError,
      );
      return new Response("Transpilation failed", {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "text/plain" },
      });
    }
    transpiled = result;

    // Persist transpiled code in background
    upsertSession({ ...session, transpiled }).catch(err =>
      logger.error(
        `[Codespace Worker-DOM] Failed to persist transpiled code:`,
        err,
      )
    );
  }

  if (!transpiled) {
    return new Response("No code available to render", {
      status: 404,
      headers: { ...CORS_HEADERS, "Content-Type": "text/plain" },
    });
  }

  // Bundle with timeout
  const { data: bundleResult, error: bundleError } = await tryCatch(
    Promise.race([
      bundleWorkerDom({ transpiled, codeSpace }),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("Worker-DOM bundle timed out")),
          BUILD_TIMEOUT_MS,
        )
      ),
    ]),
  );

  if (bundleError) {
    logger.error(
      `[Codespace Worker-DOM] Bundle failed for "${codeSpace}":`,
      bundleError,
    );
    return new Response("Worker-DOM bundle failed", {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "text/plain" },
    });
  }

  const html = buildWorkerDomHtml({
    workerJs: bundleResult.workerJs,
    applierJs: bundleResult.applierJs,
    css: session.css || "",
    html: session.html || "",
    codeSpace,
  });

  return new Response(html, {
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache",
      "Content-Security-Policy":
        "default-src 'self' https://testing.spike.land; script-src 'unsafe-inline' 'wasm-unsafe-eval' https://esm.sh https://testing.spike.land data:; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src * data: blob:; connect-src * https://testing.spike.land wss://testing.spike.land; worker-src blob:; media-src *;",
    },
  });
}

export function OPTIONS() {
  return corsOptions();
}
