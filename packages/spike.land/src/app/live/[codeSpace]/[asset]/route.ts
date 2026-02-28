import { SessionService } from "@/lib/codespace/session-service";
import { type NextRequest } from "next/server";

/**
 * GET /live/[codeSpace]/[asset]
 * Serves codespace assets (index.mjs, index.css, etc.)
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ codeSpace: string; asset: string; }>; },
) {
  const { codeSpace, asset } = await context.params;

  const session = await SessionService.getSession(codeSpace);

  if (!session) {
    return new Response("Codespace not found", { status: 404 });
  }

  // Handle JS
  if (asset === "index.mjs" || asset === "index.js" || asset === "start.mjs") {
    return new Response(session.transpiled || "", {
      headers: {
        "Content-Type": "application/javascript; charset=UTF-8",
        "Access-Control-Allow-Origin": "*",
        "Cross-Origin-Embedder-Policy": "require-corp",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  }

  // Handle CSS
  if (asset === "index.css") {
    return new Response(session.css || "", {
      headers: {
        "Content-Type": "text/css; charset=UTF-8",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  }

  // Handle Source Code
  if (asset === "index.tsx" || asset === "code") {
    return new Response(session.code || "", {
      headers: {
        "Content-Type": "text/plain; charset=UTF-8",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  }

  // Handle Session JSON
  if (asset === "session.json") {
    return new Response(JSON.stringify(session), {
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  }

  return new Response("Asset not found", { status: 404 });
}
