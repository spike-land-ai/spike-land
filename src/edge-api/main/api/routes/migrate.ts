import { Hono } from "hono";
import type { Env } from "../../core-logic/env.js";
import { migrateNextjsProject } from "../../core-logic/nextjs-transform/index.js";

// TODO: Add per-IP rate limiting via LIMITERS Durable Object before
// opening this to public traffic. Recommended: 10 req/min per IP for
// /migrate/analyze (each call fans out to 50+ GitHub API requests).

const migrate = new Hono<{ Bindings: Env }>();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GitTreeItem {
  path: string;
  type: "blob" | "tree";
  sha: string;
  size?: number;
  url: string;
}

interface GitTreeResponse {
  sha: string;
  tree: GitTreeItem[];
  truncated: boolean;
}

interface GitContentsResponse {
  content: string; // base64-encoded
  encoding: string;
}

interface AnalyzeRequestBody {
  repoUrl: string;
}

interface TransformRequestBody {
  files: Array<{ path: string; content: string }>;
  routerType: string;
}

type RouterType = "pages" | "app" | "mixed" | "unknown";

interface AnalyzeResponse {
  owner: string;
  repo: string;
  routerType: RouterType;
  files: Array<{ path: string; content: string }>;
  structure: {
    hasMiddleware: boolean;
    hasApiRoutes: boolean;
    routeCount: number;
    dependencies: Record<string, string>;
  };
}

interface TransformResponse {
  transformed: Array<{
    path: string;
    original: string;
    transformed: string;
    warnings: string[];
  }>;
  routeTree: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parse owner and repo name from a GitHub URL.
 * Accepts: https://github.com/owner/repo, github.com/owner/repo,
 *          github.com/owner/repo.git, https://github.com/owner/repo/tree/main
 * Returns null if the URL cannot be parsed.
 */
function parseGitHubUrl(raw: string): { owner: string; repo: string } | null {
  // Normalise: strip protocol, trailing slashes, and .git suffix
  const stripped = raw
    .replace(/^https?:\/\//, "")
    .replace(/\.git$/, "")
    .replace(/\/$/, "");

  if (!stripped.startsWith("github.com/")) return null;

  const parts = stripped.slice("github.com/".length).split("/");
  if (parts.length < 2 || !parts[0] || !parts[1]) return null;

  return { owner: parts[0], repo: parts[1] };
}

/** Build GitHub API request headers, optionally injecting a bearer token. */
function githubHeaders(token: string | undefined): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "spike-edge-migrate",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

/** File extensions worth fetching for migration analysis. */
const RELEVANT_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx"]);

/** File name prefixes/patterns that are always relevant regardless of extension. */
const RELEVANT_NAMES = ["next.config", "middleware", "package.json"];

function isRelevantFile(path: string): boolean {
  const lower = path.toLowerCase();
  const ext = lower.slice(lower.lastIndexOf("."));
  if (RELEVANT_EXTENSIONS.has(ext)) return true;
  const base = lower.split("/").pop() ?? "";
  return RELEVANT_NAMES.some((name) => base.startsWith(name));
}

/**
 * Assign a priority score to a file path so that route files and config are
 * fetched before generic source files when truncating to MAX_FILES.
 * Lower score = higher priority.
 */
function filePriority(path: string): number {
  const lower = path.toLowerCase();
  if (lower === "package.json") return 0;
  if (lower.startsWith("next.config")) return 1;
  if (lower.startsWith("middleware")) return 2;
  if (lower.includes("/pages/api/") || lower.includes("/app/api/")) return 3;
  if (lower.startsWith("pages/") || lower.startsWith("app/")) return 4;
  return 5;
}

const MAX_FILES = 50;

/** Decode base64 content returned by the GitHub Contents API. */
function decodeBase64(encoded: string): string {
  // The API returns the content with embedded newlines — strip them first.
  const clean = encoded.replace(/\n/g, "");
  return atob(clean);
}

function detectRouterType(paths: string[]): RouterType {
  const hasPages = paths.some((p) => p.startsWith("pages/") || p.includes("/pages/"));
  const hasApp = paths.some((p) => p.startsWith("app/") || p.includes("/app/"));
  if (hasPages && hasApp) return "mixed";
  if (hasPages) return "pages";
  if (hasApp) return "app";
  return "unknown";
}

function validateAnalyzeBody(body: unknown): body is AnalyzeRequestBody {
  if (typeof body !== "object" || body === null) return false;
  const b = body as Record<string, unknown>;
  return typeof b["repoUrl"] === "string" && b["repoUrl"].length > 0;
}

function validateTransformBody(body: unknown): body is TransformRequestBody {
  if (typeof body !== "object" || body === null) return false;
  const b = body as Record<string, unknown>;
  if (!Array.isArray(b["files"])) return false;
  if (typeof b["routerType"] !== "string") return false;
  for (const f of b["files"] as unknown[]) {
    if (typeof f !== "object" || f === null) return false;
    const file = f as Record<string, unknown>;
    if (typeof file["path"] !== "string") return false;
    if (typeof file["content"] !== "string") return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// POST /api/migrate/analyze
// ---------------------------------------------------------------------------

migrate.post("/api/migrate/analyze", async (c) => {
  const body = await c.req.json<unknown>();
  if (!validateAnalyzeBody(body)) {
    return c.json({ error: "Invalid request body: repoUrl is required" }, 400);
  }

  const parsed = parseGitHubUrl(body.repoUrl);
  if (!parsed) {
    return c.json(
      {
        error:
          "Could not parse GitHub repository URL. Expected format: https://github.com/owner/repo",
      },
      400,
    );
  }

  const { owner, repo } = parsed;
  const token: string | undefined = c.env.GITHUB_TOKEN || undefined;
  const headers = githubHeaders(token);

  // 1. Fetch the full repo tree (recursive).
  const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`;
  const treeResp = await fetch(treeUrl, { headers });

  if (treeResp.status === 404) {
    return c.json({ error: `Repository ${owner}/${repo} not found or is private` }, 404);
  }
  if (!treeResp.ok) {
    const detail = await treeResp.text();
    return c.json(
      { error: "GitHub API error when fetching repository tree", detail },
      treeResp.status as 400 | 403 | 429 | 500,
    );
  }

  const tree = await treeResp.json<GitTreeResponse>();

  // 2. Filter blobs to relevant files only.
  const allPaths = tree.tree
    .filter((item) => item.type === "blob" && isRelevantFile(item.path))
    .map((item) => item.path);

  // 3. Sort by priority and take the first MAX_FILES.
  const prioritised = allPaths
    .slice()
    .sort((a, b) => filePriority(a) - filePriority(b))
    .slice(0, MAX_FILES);

  // 4. Fetch file contents in parallel (GitHub Contents API, base64 response).
  const contentResults = await Promise.allSettled(
    prioritised.map(async (path) => {
      const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`;
      const resp = await fetch(url, { headers });
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status} fetching ${path}`);
      }
      const data = await resp.json<GitContentsResponse>();
      if (data.encoding !== "base64") {
        throw new Error(`Unexpected encoding "${data.encoding}" for ${path}`);
      }
      return { path, content: decodeBase64(data.content) };
    }),
  );

  const files: Array<{ path: string; content: string }> = [];
  for (const result of contentResults) {
    if (result.status === "fulfilled") {
      files.push(result.value);
    }
    // Silently skip files that failed to fetch (private, too large, etc.)
  }

  // 5. Derive structural metadata from the fetched files.
  const routerType = detectRouterType(allPaths);

  const hasMiddleware = allPaths.some(
    (p) => p.toLowerCase().startsWith("middleware.") || p.toLowerCase() === "middleware/index.ts",
  );

  // API routes exist if there are files under pages/api/ or app/api/ (App Router route handlers)
  const hasApiRoutes = allPaths.some((p) => p.startsWith("pages/api/") || p.startsWith("app/api/"));

  // Count distinct route files: anything under pages/ or app/ that is a
  // page/route file (not _app, _document, layout, error, loading, etc.)
  const NON_ROUTE_PREFIXES = [
    "_app",
    "_document",
    "_error",
    "layout",
    "loading",
    "error",
    "not-found",
    "template",
    "global-error",
  ];
  const routeCount = allPaths.filter((p) => {
    const inPagesOrApp = p.startsWith("pages/") || p.startsWith("app/");
    if (!inPagesOrApp) return false;
    const base = (p.split("/").pop() ?? "").split(".")[0] ?? "";
    return !NON_ROUTE_PREFIXES.includes(base);
  }).length;

  // Extract dependencies from package.json if we fetched it.
  let dependencies: Record<string, string> = {};
  const pkgFile = files.find((f) => f.path === "package.json");
  if (pkgFile) {
    try {
      const pkg = JSON.parse(pkgFile.content) as Record<string, unknown>;
      const deps = (pkg["dependencies"] ?? {}) as Record<string, string>;
      const devDeps = (pkg["devDependencies"] ?? {}) as Record<string, string>;
      dependencies = { ...deps, ...devDeps };
    } catch {
      // Malformed package.json — leave dependencies empty.
    }
  }

  const response: AnalyzeResponse = {
    owner,
    repo,
    routerType,
    files,
    structure: {
      hasMiddleware,
      hasApiRoutes,
      routeCount,
      dependencies,
    },
  };

  return c.json(response, 200);
});

// ---------------------------------------------------------------------------
// POST /api/migrate/transform
// ---------------------------------------------------------------------------

migrate.post("/api/migrate/transform", async (c) => {
  const body = await c.req.json<unknown>();
  if (!validateTransformBody(body)) {
    return c.json(
      {
        error:
          "Invalid request body: files (array of {path, content}) and routerType (string) are required",
      },
      400,
    );
  }

  const routerType = body.routerType as "pages" | "app" | "mixed" | "unknown";
  const report = migrateNextjsProject(body.files, routerType);

  const response: TransformResponse = {
    transformed: report.files.map((f) => ({
      path: f.filename,
      original: body.files.find((bf) => bf.path === f.filename)?.content ?? "",
      transformed: f.transformed,
      warnings: f.warnings,
    })),
    routeTree: report.routeTree || "(no route files detected)",
  };

  return c.json(response, 200);
});

export { migrate };
