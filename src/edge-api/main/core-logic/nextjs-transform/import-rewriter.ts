/**
 * Rewrites Next.js-specific imports to edge-native equivalents.
 *
 * Transforms:
 *   next/router        → @tanstack/react-router
 *   next/navigation    → @tanstack/react-router
 *   next/link          → @tanstack/react-router Link
 *   next/image         → standard <img> with lazy loading
 *   next/head          → document.head manipulation
 *   next/dynamic       → React.lazy
 *   next/script        → standard <script>
 */

import type { TransformResult } from "./types.ts";

/** Map of Next.js router hooks to TanStack equivalents. */
const ROUTER_HOOK_MAP: Record<string, string> = {
  useRouter: "useRouter",
  usePathname: "useLocation",
  useSearchParams: "useSearch",
  useParams: "useParams",
  useSelectedLayoutSegment: "useMatch",
  useSelectedLayoutSegments: "useMatches",
};

/** Map of next/navigation hooks to TanStack equivalents. */
const NAVIGATION_HOOK_MAP: Record<string, string> = {
  useRouter: "useNavigate",
  usePathname: "useLocation",
  useSearchParams: "useSearch",
  useParams: "useParams",
  redirect: "useNavigate",
  notFound: "notFound",
  useSelectedLayoutSegment: "useMatch",
  useSelectedLayoutSegments: "useMatches",
};

/**
 * Rewrite all Next.js imports in a source file to edge-native equivalents.
 */
export function rewriteImports(filename: string, source: string): TransformResult {
  const warnings: string[] = [];
  let transformed = source;

  transformed = rewriteNextRouter(transformed, warnings);
  transformed = rewriteNextNavigation(transformed, warnings);
  transformed = rewriteNextLink(transformed, warnings);
  transformed = rewriteNextImage(transformed, warnings);
  transformed = rewriteNextHead(transformed, warnings);
  transformed = rewriteNextDynamic(transformed, warnings);
  transformed = rewriteNextScript(transformed, warnings);
  transformed = rewriteNextServerImports(transformed, warnings);

  return { filename, original: source, transformed, warnings };
}

/**
 * Rewrite `next/router` imports to `@tanstack/react-router`.
 */
function rewriteNextRouter(source: string, warnings: string[]): string {
  // Match: import { useRouter, ... } from "next/router"
  const importPattern = /import\s*\{([^}]+)\}\s*from\s*['"]next\/router['"]/g;

  return source.replace(importPattern, (_match, specifiers: string) => {
    const items = specifiers
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const mapped: string[] = [];

    for (const item of items) {
      const parts = item.split(/\s+as\s+/);
      const name = parts[0]?.trim() ?? "";
      const alias = parts.length > 1 ? parts[1]?.trim() : undefined;
      const replacement = ROUTER_HOOK_MAP[name];

      if (replacement) {
        mapped.push(alias ? `${replacement} as ${alias}` : replacement);
      } else {
        warnings.push(`Unknown next/router import "${name}" — kept as-is, manual review needed`);
        mapped.push(item);
      }
    }

    return `import { ${mapped.join(", ")} } from "@tanstack/react-router"`;
  });
}

/**
 * Rewrite `next/navigation` imports to `@tanstack/react-router`.
 */
function rewriteNextNavigation(source: string, warnings: string[]): string {
  const importPattern = /import\s*\{([^}]+)\}\s*from\s*['"]next\/navigation['"]/g;

  return source.replace(importPattern, (_match, specifiers: string) => {
    const items = specifiers
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const mapped: string[] = [];

    for (const item of items) {
      const parts = item.split(/\s+as\s+/);
      const name = parts[0]?.trim() ?? "";
      const alias = parts.length > 1 ? parts[1]?.trim() : undefined;
      const replacement = NAVIGATION_HOOK_MAP[name];

      if (replacement) {
        mapped.push(alias ? `${replacement} as ${alias}` : replacement);
      } else {
        warnings.push(
          `Unknown next/navigation import "${name}" — kept as-is, manual review needed`,
        );
        mapped.push(item);
      }
    }

    return `import { ${mapped.join(", ")} } from "@tanstack/react-router"`;
  });
}

/**
 * Rewrite `next/link` → TanStack `Link` from `@tanstack/react-router`.
 */
function rewriteNextLink(source: string, warnings: string[]): string {
  // Default import: import Link from "next/link"
  const defaultImport = /import\s+(\w+)\s+from\s*['"]next\/link['"]/g;

  let result = source.replace(defaultImport, (_match, name: string) => {
    if (name !== "Link") {
      warnings.push(`next/link imported as "${name}" — renamed to Link, update JSX usage manually`);
    }
    return `import { Link } from "@tanstack/react-router"`;
  });

  // Rewrite <Link href=...> to <Link to=...>
  result = result.replace(/<Link\s+href=/g, "<Link to=");

  return result;
}

/**
 * Rewrite `next/image` → standard `<img>` with lazy loading attributes.
 */
function rewriteNextImage(source: string, warnings: string[]): string {
  // Remove the import entirely
  let result = source.replace(
    /import\s+(\w+)\s+from\s*['"]next\/image['"];\n?/g,
    (_match, name: string) => {
      if (name !== "Image") {
        warnings.push(`next/image imported as "${name}" — all <${name}> tags should be reviewed`);
      }
      return `// TODO: Manual review needed — next/image removed, using native <img>\n`;
    },
  );

  // Replace <Image ... /> with <img ... loading="lazy" />
  // Handle self-closing Image tags
  result = result.replace(/<Image(\s+[^>]*?)\s*\/>/g, (_match, attrs: string) => {
    let imgAttrs = attrs;
    // Remove Next.js-specific props
    imgAttrs = imgAttrs.replace(/\s+priority(\s|\/|>|$)/g, "$1");
    imgAttrs = imgAttrs.replace(/\s+placeholder\s*=\s*(?:"[^"]*"|'[^']*'|\{[^}]*\})/g, "");
    imgAttrs = imgAttrs.replace(/\s+blurDataURL\s*=\s*(?:"[^"]*"|'[^']*'|\{[^}]*\})/g, "");
    imgAttrs = imgAttrs.replace(/\s+loader\s*=\s*\{[^}]*\}/g, "");
    imgAttrs = imgAttrs.replace(
      /\s+fill(\s|\/|>|$)/g,
      " style={{ width: '100%', height: '100%', objectFit: 'cover' }}$1",
    );
    imgAttrs = imgAttrs.replace(/\s+quality\s*=\s*\{[^}]*\}/g, "");
    imgAttrs = imgAttrs.replace(/\s+sizes\s*=\s*"[^"]*"/g, "");

    // Add loading="lazy" if not already present
    if (!imgAttrs.includes("loading=")) {
      imgAttrs += ' loading="lazy"';
    }

    return `<img${imgAttrs} />`;
  });

  return result;
}

/**
 * Rewrite `next/head` → direct document.head manipulation via useEffect.
 */
function rewriteNextHead(source: string, warnings: string[]): string {
  const hasHeadImport = /import\s+(\w+)\s+from\s*['"]next\/head['"]/.test(source);

  if (!hasHeadImport) return source;

  warnings.push(
    "next/head usage detected — replaced with useEffect document.head manipulation. Consider using react-helmet-async for SSR.",
  );

  // Remove the import
  let result = source.replace(
    /import\s+\w+\s+from\s*['"]next\/head['"];\n?/g,
    `// TODO: Manual review needed — next/head replaced with useEffect\nimport { useEffect } from "react";\n`,
  );

  // Replace <Head>...</Head> blocks with a TODO comment
  result = result.replace(/<Head>([\s\S]*?)<\/Head>/g, (_match, content: string) => {
    const titleMatch = content.match(/<title>([^<]*)<\/title>/);
    const title = titleMatch ? titleMatch[1] : undefined;

    const lines = [
      "/* TODO: Manual review needed — migrate Head contents to useEffect or react-helmet-async */",
    ];

    if (title) {
      lines.push(`{(() => { document.title = ${JSON.stringify(title)}; return null; })()}`);
    }

    return lines.join("\n");
  });

  return result;
}

/**
 * Rewrite `next/dynamic` → `React.lazy`.
 */
function rewriteNextDynamic(source: string, warnings: string[]): string {
  const hasDynamic = /import\s+dynamic\s+from\s*['"]next\/dynamic['"]/.test(source);

  if (!hasDynamic) return source;

  // Replace import
  let result = source.replace(
    /import\s+dynamic\s+from\s*['"]next\/dynamic['"];\n?/g,
    `import { lazy, Suspense } from "react";\n`,
  );

  // Replace dynamic(() => import(...)) with lazy(() => import(...))
  // Simple case: dynamic(() => import("..."))
  result = result.replace(
    /dynamic\(\s*\(\)\s*=>\s*import\(([^)]+)\)\s*\)/g,
    "lazy(() => import($1))",
  );

  // Complex case with options: dynamic(() => import("..."), { ssr: false, loading: ... })
  result = result.replace(
    /dynamic\(\s*\(\)\s*=>\s*import\(([^)]+)\)\s*,\s*\{[^}]*\}\s*\)/g,
    (_match, importPath: string) => {
      warnings.push(
        `dynamic() options (ssr, loading) removed — wrap with <Suspense> for loading states`,
      );
      return `lazy(() => import(${importPath}))`;
    },
  );

  return result;
}

/**
 * Rewrite `next/script` → standard `<script>` tag.
 */
function rewriteNextScript(source: string, warnings: string[]): string {
  const hasScript = /import\s+Script\s+from\s*['"]next\/script['"]/.test(source);

  if (!hasScript) return source;

  warnings.push(
    "next/script replaced with standard <script> — strategy prop removed, load ordering may differ",
  );

  // Remove the import
  let result = source.replace(
    /import\s+Script\s+from\s*['"]next\/script['"];\n?/g,
    "// TODO: Manual review needed — next/script replaced with native <script>\n",
  );

  // Replace <Script> with <script>, removing Next.js-specific props
  result = result.replace(/<Script(\s)/g, "<script$1");
  result = result.replace(/<\/Script>/g, "</script>");
  result = result.replace(/<Script\/>/g, "<script />");

  // Remove strategy prop
  result = result.replace(/\s+strategy\s*=\s*(?:"[^"]*"|'[^']*'|\{[^}]*\})/g, "");

  return result;
}

/**
 * Rewrite Next.js server-only imports that have no edge equivalent.
 */
function rewriteNextServerImports(source: string, warnings: string[]): string {
  const serverImports = ["next/headers", "next/cookies", "next/server"];

  let result = source;

  for (const mod of serverImports) {
    const pattern = new RegExp(
      `import\\s+(?:\\{[^}]+\\}|\\w+)\\s+from\\s*['"]${mod.replace("/", "\\/")}['"]`,
      "g",
    );

    if (pattern.test(result)) {
      warnings.push(
        `Server-only import "${mod}" detected — must be manually migrated to Hono equivalents`,
      );
      result = result.replace(
        new RegExp(
          `import\\s+(\\{[^}]+\\}|\\w+)\\s+from\\s*['"]${mod.replace("/", "\\/")}['"]`,
          "g",
        ),
        `// TODO: Manual review needed — "${mod}" has no direct edge equivalent\n// import $1 from "${mod}"`,
      );
    }
  }

  return result;
}
