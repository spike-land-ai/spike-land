/**
 * Converts Next.js data-loading patterns to edge-native equivalents.
 *
 * Transforms:
 *   getServerSideProps  → client-side useEffect + fetch
 *   getStaticProps      → TanStack Router loader function
 *   getStaticPaths      → removed (client-side routing)
 *   Server Components   → client components with data fetching
 */

import type { TransformResult } from "./types.ts";

/**
 * Convert all Next.js data-loading patterns in a source file.
 */
export function convertDataLoaders(filename: string, source: string): TransformResult {
  const warnings: string[] = [];
  let transformed = source;

  transformed = convertGetServerSideProps(transformed, warnings);
  transformed = convertGetStaticProps(transformed, warnings);
  transformed = convertGetStaticPaths(transformed, warnings);
  transformed = convertServerComponent(transformed, filename, warnings);

  return { filename, original: source, transformed, warnings };
}

/**
 * Convert getServerSideProps to client-side useEffect + fetch.
 *
 * Input:
 *   export async function getServerSideProps(context) { ... return { props: { data } } }
 *
 * Output:
 *   // Extracted data-fetching hook
 *   function useServerData() { ... }
 */
function convertGetServerSideProps(source: string, warnings: string[]): string {
  // Match the full getServerSideProps export
  const gsspPattern = /export\s+(async\s+)?function\s+getServerSideProps\s*\([^)]*\)\s*\{/;

  if (!gsspPattern.test(source)) return source;

  warnings.push(
    "getServerSideProps converted to client-side data fetching — server-only logic (DB queries, auth checks) must be moved to an API endpoint",
  );

  // Extract the function body (best effort with brace counting)
  const extracted = extractFunctionBody(source, "getServerSideProps");
  if (!extracted) {
    warnings.push("Could not parse getServerSideProps body — manual migration required");
    return source;
  }

  // Remove the original function
  let result = source.replace(extracted.fullMatch, "");

  // Add the replacement hook
  const hookCode = `
// TODO: Manual review needed — migrated from getServerSideProps
// Move server-only logic (DB queries, secrets) to an API endpoint
import { useState, useEffect } from "react";

interface ServerData {
  [key: string]: unknown;
}

function useServerData(): { data: ServerData | null; loading: boolean; error: Error | null } {
  const [data, setData] = useState<ServerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // TODO: Manual review needed — replace with actual API endpoint
        const response = await fetch(window.location.pathname + "?_data=1");
        if (!response.ok) throw new Error(\`HTTP \${response.status}\`);
        const result = await response.json() as ServerData;
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    }
    void fetchData();
  }, []);

  return { data, loading, error };
}`;

  // Ensure we don't duplicate React import
  if (!result.includes("import") || !result.includes("useState")) {
    result = hookCode + "\n\n" + result;
  } else {
    // Just add the hook function without the import
    result =
      result + "\n\n" + hookCode.replace(/import \{ useState, useEffect \} from "react";\n/, "");
  }

  // Replace props usage in the component — add a note
  result = result.replace(
    /export\s+default\s+function\s+(\w+)\s*\(\s*\{([^}]*)\}\s*\)/,
    (_match, name: string, props: string) => {
      warnings.push(
        `Component "${name}" received props { ${props.trim()} } from getServerSideProps — update to use useServerData() hook`,
      );
      return `export default function ${name}() /* TODO: Manual review needed — use useServerData() instead of props { ${props.trim()} } */`;
    },
  );

  return result;
}

/**
 * Convert getStaticProps to a TanStack Router loader function.
 */
function convertGetStaticProps(source: string, warnings: string[]): string {
  const gspPattern = /export\s+(async\s+)?function\s+getStaticProps\s*\([^)]*\)\s*\{/;

  if (!gspPattern.test(source)) return source;

  warnings.push(
    "getStaticProps converted to TanStack Router loader — data will be fetched at route load time instead of build time",
  );

  const extracted = extractFunctionBody(source, "getStaticProps");
  if (!extracted) {
    warnings.push("Could not parse getStaticProps body — manual migration required");
    return source;
  }

  // Remove the original function
  let result = source.replace(extracted.fullMatch, "");

  // Generate a loader stub
  const loaderCode = `
// TODO: Manual review needed — migrated from getStaticProps
// Data is now fetched at route load time (not build time)
export const loader = async () => {
  // TODO: Manual review needed — move the data-fetching logic here
  // Original getStaticProps body:
${extracted.body
  .split("\n")
  .map((line) => `  // ${line}`)
  .join("\n")}
  return {};
};`;

  result = loaderCode + "\n\n" + result;

  return result;
}

/**
 * Convert getStaticPaths — remove it since client-side routing doesn't need it.
 */
function convertGetStaticPaths(source: string, warnings: string[]): string {
  const pattern = /export\s+(async\s+)?function\s+getStaticPaths\s*\([^)]*\)\s*\{/;

  if (!pattern.test(source)) return source;

  warnings.push(
    "getStaticPaths removed — client-side routing handles dynamic paths without pre-generation",
  );

  const extracted = extractFunctionBody(source, "getStaticPaths");
  if (!extracted) {
    return source.replace(
      pattern,
      "// getStaticPaths removed — not needed with client-side routing\n// ",
    );
  }

  return source.replace(
    extracted.fullMatch,
    "// getStaticPaths removed — not needed with client-side routing",
  );
}

/**
 * Detect and convert Server Components to client components.
 *
 * Server Components are identified by:
 *   - async function as default export
 *   - No "use client" directive
 *   - Direct await calls in the component body
 *   - Server-only imports (db, fs, etc.)
 */
function convertServerComponent(source: string, filename: string, warnings: string[]): string {
  // Already a client component
  if (/^['"]use client['"]/.test(source.trim())) return source;

  // Check for server component indicators
  const isAsync =
    /export\s+default\s+async\s+function/.test(source) ||
    /export\s+default\s+async\s+\(/.test(source);

  const hasServerImports =
    /import.*from\s*['"](?:fs|path|crypto|database|db|prisma|drizzle|@\/server|@\/lib\/server)['"]/.test(
      source,
    );

  const hasDirectAwait = /export\s+default\s+async\s+function\s+\w+[^{]*\{[\s\S]*?\bawait\b/.test(
    source,
  );

  if (!isAsync && !hasServerImports) return source;

  if (isAsync || hasDirectAwait) {
    warnings.push(
      `"${filename}" appears to be a Server Component (async default export) — converted to client component with data fetching`,
    );

    let result = `"use client";\n\n` + source;

    // Convert async default export to regular function
    result = result.replace(
      /export\s+default\s+async\s+function\s+(\w+)\s*\(([^)]*)\)\s*\{/,
      (_match, name: string, params: string) => {
        return `// TODO: Manual review needed — was async Server Component, now client component
// Move data fetching to a loader or useEffect
export default function ${name}(${params}) {`;
      },
    );

    // Comment out direct await usage at the top level of the component
    // (This is a best-effort transform)
    result = result.replace(
      /^(\s+)(const|let|var)\s+(\w+)\s*=\s*await\s+/gm,
      "$1// TODO: Manual review needed — move to loader or useEffect\n$1// $2 $3 = await ",
    );

    return result;
  }

  if (hasServerImports) {
    warnings.push(
      `"${filename}" imports server-only modules — add "use client" and migrate server logic to API endpoints`,
    );
  }

  return source;
}

/**
 * Extract a named function's body from source code using brace counting.
 * Returns null if the function cannot be reliably extracted.
 */
function extractFunctionBody(
  source: string,
  functionName: string,
): { fullMatch: string; body: string } | null {
  const pattern = new RegExp(
    `export\\s+(?:async\\s+)?function\\s+${functionName}\\s*\\([^)]*\\)\\s*(?::\\s*[^{]+)?\\{`,
  );

  const match = source.match(pattern);
  if (!match || match.index === undefined) return null;

  const startIndex = match.index;
  const braceStart = source.indexOf("{", startIndex + match[0].length - 1);

  if (braceStart === -1) return null;

  let depth = 0;
  let i = braceStart;

  for (; i < source.length; i++) {
    if (source[i] === "{") depth++;
    if (source[i] === "}") {
      depth--;
      if (depth === 0) break;
    }
  }

  if (depth !== 0) return null;

  const fullMatch = source.slice(startIndex, i + 1);
  const body = source.slice(braceStart + 1, i).trim();

  return { fullMatch, body };
}
