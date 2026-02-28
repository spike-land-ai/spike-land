import { SessionService } from "@/lib/codespace/session-service";
import { HTML_TEMPLATE, IMPORT_MAP } from "@/lib/codespace/html-template";
import { type NextRequest } from "next/server";

/**
 * GET /live/[codeSpace]
 * Renders the live application HTML
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ codeSpace: string; }>; },
) {
  const { codeSpace } = await context.params;

  // Validate codeSpace format
  if (!/^[a-zA-Z0-9_-]+$/.test(codeSpace)) {
    return new Response("Invalid codeSpace format", { status: 400 });
  }

  const session = await SessionService.getSession(codeSpace);

  if (!session) {
    return new Response("Codespace not found", { status: 404 });
  }

  // Perform replacements in the template
  let html = HTML_TEMPLATE
    .replace("// IMPORTMAP", JSON.stringify(IMPORT_MAP))
    .replace("<!-- HTML_CONTENT -->", session.html || "")
    .replace(
      "<script type=\"module\" src=\"/start.mjs\"></script>",
      `<script type="module">
import App from "/live/${codeSpace}/index.mjs";
const {createRoot} = await import("react-dom/client");
const {jsx} = await import("react/jsx-runtime");
createRoot(document.getElementById("embed")).render(jsx(App, {}));
</script>`,
    );

  // Inject CSS link
  const cssLink = `
    <link rel="preload" href="/live/${codeSpace}/index.css" as="style">
    <link rel="stylesheet" href="/live/${codeSpace}/index.css">
  `;
  html = html.replace("<!-- CSS_LINKS -->", cssLink);

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=UTF-8",
      "Access-Control-Allow-Origin": "*",
      "Cross-Origin-Resource-Policy": "cross-origin",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Content-Security-Policy":
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://esm.sh data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src * data: blob:; connect-src *; media-src *;",
    },
  });
}
