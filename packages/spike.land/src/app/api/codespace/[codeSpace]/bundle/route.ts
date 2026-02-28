import { getCacheRaw, invalidateCache, setCacheRaw } from "@/lib/cache";
import { buildBundleHtml } from "@/lib/codespace/bundle-template";
import { bundleCodespace } from "@/lib/codespace/bundler";
import { CORS_HEADERS, corsOptions } from "@/lib/codespace/cors";
import { buildEmbedHtml } from "@/lib/codespace/html-template";
import {
  getOrCreateSession,
  upsertSession,
} from "@/lib/codespace/session-service";
import { transpileCode } from "@/lib/codespace/transpile";
import logger from "@/lib/logger";
import { tryCatch } from "@/lib/try-catch";
import type { NextRequest } from "next/server";

const BUILD_TIMEOUT_MS = 10_000;

const TRANSIENT_PATTERNS = [
  "ECONNREFUSED",
  "ECONNRESET",
  "ETIMEDOUT",
  "timeout",
  "redis",
  "ENOTFOUND",
  "socket hang up",
];

function isTransientError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return TRANSIENT_PATTERNS.some(p => message.toLowerCase().includes(p.toLowerCase()));
}

/**
 * GET /api/codespace/[codeSpace]/bundle
 *
 * Serves a fully self-contained HTML page with an IIFE-bundled app.
 * All JS (React, Emotion, user code) is inlined — no CDN dependencies at runtime.
 *
 * Query params:
 *   ?download=true — returns the HTML as a downloadable file
 *   ?rebuild=true  — force re-transpile and rebuild, bypassing cache
 */
export async function GET(
  request: NextRequest,
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
  const rebuild = request.nextUrl.searchParams.get("rebuild") === "true";

  // Load session
  const { data: session, error: sessionError } = await tryCatch(
    getOrCreateSession(codeSpace),
  );

  if (sessionError) {
    logger.error(
      `[Codespace Bundle] Failed to get session for "${codeSpace}":`,
      sessionError,
    );
    const isTransient = isTransientError(sessionError);
    return new Response(
      isTransient
        ? "Service temporarily unavailable"
        : "Failed to retrieve session",
      {
        status: isTransient ? 503 : 500,
        headers: {
          ...CORS_HEADERS,
          "Content-Type": "text/plain",
          ...(isTransient && { "Retry-After": "5" }),
        },
      },
    );
  }

  // Auto-transpile if session has code but no transpiled output.
  // On rebuild, always re-transpile from source code.
  let { transpiled } = session;
  if ((!transpiled || rebuild) && session.code) {
    const { data: result, error: transpileError } = await tryCatch(
      transpileCode(session.code),
    );
    if (transpileError) {
      const transpileMsg = transpileError instanceof Error
        ? transpileError.message
        : JSON.stringify(transpileError);
      logger.error(
        `[Codespace Bundle] Auto-transpile failed for "${codeSpace}":`,
        {
          message: transpileMsg,
          stack: transpileError instanceof Error
            ? transpileError.stack
            : undefined,
        },
      );
    } else if (result) {
      transpiled = result;
      upsertSession({ ...session, transpiled }).catch(err =>
        logger.error(
          `[Codespace Bundle] Failed to persist transpiled code:`,
          err,
        )
      );
    }
  }

  if (!transpiled) {
    return new Response("No transpiled code available", {
      status: 404,
      headers: { ...CORS_HEADERS, "Content-Type": "text/plain" },
    });
  }

  // Check cache (skip on rebuild)
  const sessionHash = session.hash || codeSpace;

  const bundleCacheKey = `codespace:bundle:${codeSpace}:${sessionHash}`;
  const fallbackCacheKey = `${bundleCacheKey}:fallback`;

  if (rebuild) {
    invalidateCache(bundleCacheKey).catch(err =>
      logger.error(`[Codespace Bundle] Failed to delete cache on rebuild:`, err)
    );
    invalidateCache(fallbackCacheKey).catch(err =>
      logger.error(
        `[Codespace Bundle] Failed to delete fallback cache on rebuild:`,
        err,
      )
    );
  }

  if (!rebuild) {
    const { data: cached } = await tryCatch(
      getCacheRaw<string>(bundleCacheKey),
    );

    if (cached) {
      return bundleResponse(cached, codeSpace, request);
    }
  }

  // Build bundle with timeout
  const { data: bundleResult, error: bundleError } = await tryCatch(
    Promise.race([
      bundleCodespace({ ...session, transpiled }),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("Bundle build timed out")),
          BUILD_TIMEOUT_MS,
        )
      ),
    ]),
  );

  if (bundleError) {
    const errorMessage = bundleError instanceof Error
      ? bundleError.message
      : JSON.stringify(bundleError);
    const errorStack = bundleError instanceof Error
      ? bundleError.stack
      : undefined;
    logger.warn(
      `[Codespace Bundle] Build failed for "${codeSpace}", falling back to embed HTML`,
      { message: errorMessage, stack: errorStack },
    );
    if (
      bundleError && typeof bundleError === "object" && "errors" in bundleError
    ) {
      logger.warn(
        "[Codespace Bundle] esbuild errors",
        {
          errors: JSON.stringify((bundleError as { errors: unknown[]; }).errors),
        },
      );
    }

    // Check fallback cache first
    const { data: cachedFallback } = await tryCatch(
      getCacheRaw<string>(fallbackCacheKey),
    );
    if (cachedFallback) {
      return bundleResponse(cachedFallback, codeSpace, request);
    }

    // Build fallback using import-map based embed HTML (no esbuild needed)
    const fallbackHtml = buildFallbackHtml({
      transpiled,
      html: session.html || "",
      css: session.css || "",
      codeSpace,
    });

    // Cache fallback with shorter TTL
    setCacheRaw(fallbackCacheKey, fallbackHtml, 600).catch(err =>
      logger.error(`[Codespace Bundle] Failed to cache fallback:`, err)
    );

    return bundleResponse(fallbackHtml, codeSpace, request);
  }

  const html = buildBundleHtml({
    js: bundleResult.js,
    css: bundleResult.css + (session.css || ""),
    html: session.html || "",
    codeSpace,
  });

  // Cache in background
  setCacheRaw(bundleCacheKey, html, 3600).catch(err =>
    logger.error(`[Codespace Bundle] Failed to cache bundle:`, err)
  );

  return bundleResponse(html, codeSpace, request);
}

/**
 * Build fallback HTML using import-map based embed (no esbuild needed).
 * Injects the same error-reporting script used by buildBundleHtml so that
 * LiveAppDisplay error detection still works.
 */
function buildFallbackHtml(opts: {
  transpiled: string;
  html: string;
  css: string;
  codeSpace: string;
}): string {
  const html = buildEmbedHtml(opts);

  // Inject error-reporting script before </body> (same as buildBundleHtml)
  const errorScript = `<script>
    (function() {
      var reported = false;
      var cs = ${JSON.stringify(opts.codeSpace)};
      function report(msg, stack) {
        if (reported) return;
        reported = true;
        try {
          parent.postMessage({
            type: "iframe-error",
            source: "spike-land-bundle",
            codeSpace: cs,
            message: String(msg),
            stack: stack || ""
          }, "*");
        } catch { /* postMessage to detached parent — expected */ }
      }
      window.onerror = function(msg, url, line, col, err) {
        report(msg, err && err.stack ? err.stack : url + ":" + line + ":" + col);
      };
      window.addEventListener("unhandledrejection", function(ev) {
        var r = ev.reason;
        report(
          r && r.message ? r.message : String(r),
          r && r.stack ? r.stack : ""
        );
      });
      var timer = setTimeout(function() {
        var el = document.getElementById("embed");
        if (el && el.children.length === 0) {
          report("Render timeout: #embed is still empty after 15s");
        }
      }, 15000);
      var el = document.getElementById("embed");
      if (el && typeof MutationObserver !== "undefined") {
        var obs = new MutationObserver(function(mutations) {
          for (var i = 0; i < mutations.length; i++) {
            if (mutations[i].addedNodes.length > 0) {
              clearTimeout(timer);
              obs.disconnect();
              return;
            }
          }
        });
        obs.observe(el, { childList: true });
      }
    })();
    </script>`;

  return html.replace("</body>", `${errorScript}\n</body>`);
}

function bundleResponse(
  html: string,
  codeSpace: string,
  request: NextRequest,
): Response {
  const download = request.nextUrl.searchParams.get("download") === "true";

  const headers: Record<string, string> = {
    ...CORS_HEADERS,
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "private, max-age=60",
    "Content-Security-Policy":
      "default-src 'self' https://testing.spike.land; script-src 'unsafe-inline' 'wasm-unsafe-eval' https://esm.sh https://testing.spike.land data:; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src * data: blob:; connect-src * https://testing.spike.land wss://testing.spike.land; media-src *;",
  };

  if (download) {
    headers["Content-Disposition"] = `attachment; filename="${codeSpace}.html"`;
  }

  return new Response(html, { headers });
}

export function OPTIONS() {
  return corsOptions();
}
