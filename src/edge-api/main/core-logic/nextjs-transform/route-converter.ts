/**
 * Converts Next.js file-system routing to TanStack Router route trees.
 *
 * Supports:
 *   - pages/ directory (Next.js 12-)
 *   - app/ directory (Next.js 13+)
 *   - Dynamic routes: [id] → $id
 *   - Catch-all routes: [...slug] → $
 *   - Optional catch-all: [[...slug]] → $
 *   - Route groups: (group)/ → flattened out
 *   - Layouts: layout.tsx → route with children
 *   - Parallel routes: @slot → warning
 *   - Intercepting routes: (.)/(..)/(...) → warning
 */

import type { RepoFile, RouteEntry, RoutingConvention } from "./types.ts";

/**
 * Detect which routing convention is used based on file paths.
 */
export function detectRoutingConvention(files: RepoFile[]): RoutingConvention | null {
  const hasApp = files.some((f) => f.path.startsWith("app/") || f.path.includes("/app/"));
  const hasPages = files.some((f) => f.path.startsWith("pages/") || f.path.includes("/pages/"));

  if (hasApp) return "app";
  if (hasPages) return "pages";
  return null;
}

/**
 * Convert a Next.js file path segment to a TanStack Router path segment.
 */
export function convertSegment(segment: string): {
  converted: string;
  isDynamic: boolean;
  warning: string | null;
} {
  // Route groups: (group) → skip entirely
  if (/^\([^.][^)]*\)$/.test(segment)) {
    return { converted: "", isDynamic: false, warning: null };
  }

  // Parallel routes: @slot
  if (segment.startsWith("@")) {
    return {
      converted: "",
      isDynamic: false,
      warning: `Parallel route "${segment}" detected — not supported in TanStack Router, manual migration needed`,
    };
  }

  // Intercepting routes: (.) (..) (...)
  if (/^\(\.\.*\)/.test(segment)) {
    return {
      converted: segment.replace(/^\(\.\.*\)/, ""),
      isDynamic: false,
      warning: `Intercepting route "${segment}" detected — not supported in TanStack Router, manual migration needed`,
    };
  }

  // Optional catch-all: [[...slug]]
  const optionalCatchAll = segment.match(/^\[\[\.\.\.(\w+)\]\]$/);
  if (optionalCatchAll) {
    return { converted: "$", isDynamic: true, warning: null };
  }

  // Catch-all: [...slug]
  const catchAll = segment.match(/^\[\.\.\.(\w+)\]$/);
  if (catchAll) {
    return { converted: "$", isDynamic: true, warning: null };
  }

  // Dynamic: [id]
  const dynamic = segment.match(/^\[(\w+)\]$/);
  if (dynamic) {
    return { converted: `$${dynamic[1]}`, isDynamic: true, warning: null };
  }

  return { converted: segment, isDynamic: false, warning: null };
}

/**
 * Convert a Next.js file path to a TanStack Router file path.
 *
 * Examples:
 *   pages/index.tsx           → routes/index.tsx
 *   pages/about.tsx           → routes/about.tsx
 *   pages/blog/[id].tsx       → routes/blog/$id.tsx
 *   pages/[...slug].tsx       → routes/$.tsx
 *   app/dashboard/page.tsx    → routes/dashboard.tsx
 *   app/(auth)/login/page.tsx → routes/login.tsx
 */
export function convertFilePath(
  filePath: string,
  convention: RoutingConvention,
): { tanstackPath: string; isLayout: boolean; isDynamic: boolean; warnings: string[] } {
  const warnings: string[] = [];

  // Strip the convention root
  let relativePath = filePath;
  const pagesMatch = relativePath.match(/(?:^|\/)pages\/(.+)$/);
  const appMatch = relativePath.match(/(?:^|\/)app\/(.+)$/);

  if (pagesMatch && pagesMatch[1]) {
    relativePath = pagesMatch[1];
  } else if (appMatch && appMatch[1]) {
    relativePath = appMatch[1];
  }

  // Remove file extension
  const ext = relativePath.match(/\.(tsx?|jsx?)$/);
  if (ext) {
    relativePath = relativePath.slice(0, -ext[0].length);
  }

  const segments = relativePath.split("/").filter(Boolean);
  const convertedSegments: string[] = [];
  let isDynamic = false;
  let isLayout = false;

  for (const segment of segments) {
    // Skip app-router special files (keep the parent path)
    if (convention === "app") {
      if (segment === "page") continue;
      if (segment === "layout") {
        isLayout = true;
        continue;
      }
      if (segment === "loading" || segment === "error" || segment === "not-found") {
        warnings.push(`App router special file "${segment}" detected — needs manual migration`);
        continue;
      }
      if (segment === "template") {
        warnings.push(
          `App router "template" detected — TanStack Router has no direct equivalent, treating as layout`,
        );
        isLayout = true;
        continue;
      }
      if (segment === "route") {
        warnings.push(`App router API route ("route.ts") detected — migrate to Hono handler`);
        continue;
      }
    }

    // Skip _app, _document (pages router)
    if (convention === "pages" && (segment === "_app" || segment === "_document")) {
      warnings.push(`"${segment}" detected — migrate to root layout / HTML template`);
      return {
        tanstackPath: "",
        isLayout: segment === "_app",
        isDynamic: false,
        warnings,
      };
    }

    const { converted, isDynamic: segDynamic, warning } = convertSegment(segment);
    if (warning) warnings.push(warning);
    if (segDynamic) isDynamic = true;
    if (converted) convertedSegments.push(converted);
  }

  // Build output path
  let tanstackPath: string;

  if (convertedSegments.length === 0) {
    tanstackPath = isLayout ? "routes/__root.tsx" : "routes/index.tsx";
  } else {
    const joined = convertedSegments.join("/");
    if (isLayout) {
      // Layouts become route files that wrap children
      tanstackPath = `routes/${joined}/route.tsx`;
    } else {
      tanstackPath = `routes/${joined}.tsx`;
    }
  }

  return { tanstackPath, isLayout, isDynamic, warnings };
}

/**
 * Build a complete route tree from a set of Next.js files.
 */
export function buildRouteTree(
  files: RepoFile[],
  convention: RoutingConvention,
): { entries: RouteEntry[]; routeTreeCode: string; warnings: string[] } {
  const allWarnings: string[] = [];
  const entries: RouteEntry[] = [];

  // Filter to only route files
  const routeFiles = files.filter((f) => {
    const isRouteFile = /\.(tsx?|jsx?)$/.test(f.path);
    const isNotApi = convention === "pages" ? !f.path.includes("pages/api/") : true;
    return isRouteFile && isNotApi;
  });

  for (const file of routeFiles) {
    const { tanstackPath, isLayout, isDynamic, warnings } = convertFilePath(file.path, convention);

    if (!tanstackPath) continue;

    allWarnings.push(...warnings);

    entries.push({
      originalPath: file.path,
      tanstackPath,
      isLayout,
      isDynamic,
      children: [],
    });
  }

  // Generate the route tree definition code
  const routeTreeCode = generateRouteTreeCode(entries);

  return { entries, routeTreeCode, warnings: allWarnings };
}

/**
 * Generate TanStack Router route tree TypeScript code.
 */
function generateRouteTreeCode(entries: RouteEntry[]): string {
  const imports: string[] = [];
  const routeNames: string[] = [];

  for (const entry of entries) {
    if (!entry.tanstackPath) continue;

    // Generate a route name from the path
    const routeName =
      entry.tanstackPath
        .replace(/^routes\//, "")
        .replace(/\.(tsx?|jsx?)$/, "")
        .replace(/[/$]/g, "_")
        .replace(/^_+|_+$/g, "") || "index";

    const importName = `${routeName}Route`;
    const importPath = `./${entry.tanstackPath.replace(/\.(tsx?|jsx?)$/, "")}`;

    imports.push(`import { Route as ${importName} } from "${importPath}";`);
    routeNames.push(importName);
  }

  const lines = [
    "// AUTO-GENERATED by nextjs-transform — do not edit manually",
    "// TODO: Manual review needed — verify route tree matches expected navigation",
    "",
    'import { createRouter } from "@tanstack/react-router";',
    'import { Route as rootRoute } from "./routes/__root";',
    "",
    ...imports,
    "",
    "const routeTree = rootRoute.addChildren([",
    ...routeNames.map((name) => `  ${name},`),
    "]);",
    "",
    "export const router = createRouter({ routeTree });",
    "",
    "declare module '@tanstack/react-router' {",
    "  interface Register {",
    "    router: typeof router;",
    "  }",
    "}",
  ];

  return lines.join("\n");
}

/**
 * Convert Next.js API routes (pages/api/) to Hono handler stubs.
 */
export function convertApiRoute(
  filename: string,
  source: string,
): { code: string; warnings: string[] } {
  const warnings: string[] = [];

  warnings.push(`API route "${filename}" needs manual migration to Hono handler`);

  // Extract the handler's HTTP methods if possible
  const methods: string[] = [];
  if (/req\.method\s*===?\s*['"]GET['"]/.test(source)) methods.push("GET");
  if (/req\.method\s*===?\s*['"]POST['"]/.test(source)) methods.push("POST");
  if (/req\.method\s*===?\s*['"]PUT['"]/.test(source)) methods.push("PUT");
  if (/req\.method\s*===?\s*['"]DELETE['"]/.test(source)) methods.push("DELETE");
  if (/req\.method\s*===?\s*['"]PATCH['"]/.test(source)) methods.push("PATCH");

  // App router named exports
  if (/export\s+(async\s+)?function\s+GET\b/.test(source)) methods.push("GET");
  if (/export\s+(async\s+)?function\s+POST\b/.test(source)) methods.push("POST");
  if (/export\s+(async\s+)?function\s+PUT\b/.test(source)) methods.push("PUT");
  if (/export\s+(async\s+)?function\s+DELETE\b/.test(source)) methods.push("DELETE");
  if (/export\s+(async\s+)?function\s+PATCH\b/.test(source)) methods.push("PATCH");

  const uniqueMethods = [...new Set(methods)];
  if (uniqueMethods.length === 0) uniqueMethods.push("GET");

  const routePath = filename
    .replace(/.*\/api\//, "/api/")
    .replace(/\.(tsx?|jsx?)$/, "")
    .replace(/\/index$/, "/")
    .replace(/\[(\w+)\]/g, ":$1")
    .replace(/\[\.\.\.(\w+)\]/g, "*");

  const handlerLines = uniqueMethods.map(
    (method) =>
      `app.${method.toLowerCase()}("${routePath}", async (c) => {\n  // TODO: Manual review needed — migrate handler logic from Next.js API route\n  return c.json({ message: "not implemented" }, 501);\n});`,
  );

  const code = [
    `// Migrated from: ${filename}`,
    "// TODO: Manual review needed — verify handler logic",
    'import { Hono } from "hono";',
    "",
    "const app = new Hono();",
    "",
    ...handlerLines,
    "",
    "export default app;",
  ].join("\n");

  return { code, warnings };
}
