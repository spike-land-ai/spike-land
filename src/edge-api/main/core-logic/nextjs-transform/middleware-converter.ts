/**
 * Converts Next.js middleware.ts to Hono middleware equivalent.
 *
 * Handles:
 *   - NextRequest → Hono Context
 *   - NextResponse.next() → next()
 *   - NextResponse.redirect() → c.redirect()
 *   - NextResponse.rewrite() → proxy pattern
 *   - matcher config → Hono .use() paths
 */

import type { TransformResult } from "./types.ts";

/**
 * Convert Next.js middleware.ts to Hono middleware.
 */
export function convertMiddleware(filename: string, source: string): TransformResult {
  const warnings: string[] = [];
  let transformed = source;

  // Replace imports
  transformed = transformed.replace(
    /import\s*\{([^}]*)\}\s*from\s*['"]next\/server['"]/g,
    (_match, imports: string) => {
      const cleaned = imports
        .split(",")
        .map((s: string) => s.trim())
        .filter((s: string) => s && s !== "NextRequest" && s !== "NextResponse")
        .join(", ");
      const honoImports = `import type { Context, Next } from "hono"`;
      return cleaned ? `${honoImports}\n// Removed: ${imports.trim()}` : honoImports;
    },
  );

  // Replace NextRequest type annotations
  transformed = transformed.replace(/(\w+)\s*:\s*NextRequest/g, "c: Context");

  // Replace request.nextUrl.pathname
  transformed = transformed.replace(/(\w+)\.nextUrl\.pathname/g, "new URL(c.req.url).pathname");

  // Replace request.nextUrl.searchParams
  transformed = transformed.replace(
    /(\w+)\.nextUrl\.searchParams/g,
    "new URL(c.req.url).searchParams",
  );

  // Replace request.cookies
  transformed = transformed.replace(
    /(\w+)\.cookies\.get\(([^)]+)\)/g,
    (_match, _req: string, cookieName: string) => {
      return `c.req.cookie(${cookieName})`;
    },
  );

  // Replace NextResponse.next()
  transformed = transformed.replace(/NextResponse\.next\(\)/g, "await next()");

  // Replace NextResponse.redirect
  transformed = transformed.replace(
    /NextResponse\.redirect\(new\s+URL\(([^,)]+),\s*\w+\.url\)\)/g,
    (_match, path: string) => `c.redirect(${path})`,
  );

  // Replace NextResponse.rewrite
  if (transformed.includes("NextResponse.rewrite")) {
    warnings.push("NextResponse.rewrite() detected — convert to Hono proxy or redirect pattern");
    transformed = transformed.replace(
      /NextResponse\.rewrite\([^)]+\)/g,
      "/* TODO: Manual review needed — convert rewrite to Hono proxy pattern */",
    );
  }

  // Replace NextResponse.json
  transformed = transformed.replace(/NextResponse\.json\(([^)]+)\)/g, "c.json($1)");

  // Extract matcher config
  const matcherMatch = source.match(
    /export\s+const\s+config\s*=\s*\{[\s\S]*?matcher\s*:\s*(\[[\s\S]*?\]|['"][^'"]+['"])/,
  );
  if (matcherMatch) {
    const matcherValue = matcherMatch[1]!;
    warnings.push(`Matcher config detected: ${matcherValue} — apply as app.use() paths`);
  }

  // Replace function signature
  transformed = transformed.replace(
    /export\s+(async\s+)?function\s+middleware\s*\([^)]*\)/g,
    "export async function authMiddleware(c: Context, next: Next)",
  );

  // Add Hono middleware wrapper note
  const header = `/**
 * Hono middleware — converted from Next.js middleware.ts
 *
 * Usage in your Hono app:
 *   import { authMiddleware } from "./middleware/auth.js";
 *   app.use("/protected/*", authMiddleware);
 */\n\n`;

  transformed = header + transformed;

  // Remove the config export (matcher) — it's now app.use() paths
  transformed = transformed.replace(/export\s+const\s+config\s*=\s*\{[\s\S]*?\};?\s*$/m, "");

  return {
    filename: filename.replace("middleware", "middleware/auth"),
    original: source,
    transformed,
    warnings,
  };
}
