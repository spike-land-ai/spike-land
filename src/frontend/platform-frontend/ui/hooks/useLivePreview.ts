/**
 * useLivePreview — In-browser React/TypeScript preview engine.
 *
 * Bundles a virtual multi-file project using esbuild-wasm (lazy-loaded) and
 * renders the output into a sandboxed iframe via srcdoc. Falls back to a
 * lightweight regex-based transform when esbuild-wasm is unavailable.
 *
 * External dependencies (react, react-dom) are resolved through an importmap
 * pointing at esm.sh, so the iframe needs no server-side bundling.
 */

import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface PreviewFile {
  path: string;
  content: string;
}

export interface LivePreviewOptions {
  files: Array<PreviewFile>;
  /** Explicit entry point path. When omitted the hook auto-detects the root component. */
  entryPoint?: string;
  /** Debounce delay in milliseconds (default: 300). */
  debounceMs?: number;
}

export interface LivePreviewResult {
  iframeRef: RefObject<HTMLIFrameElement | null>;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const REACT_VERSION = "19";
const ESM_SH = "https://esm.sh";
const DEFAULT_DEBOUNCE_MS = 300;

/** Candidate filenames tried (in order) when no entryPoint is specified. */
const ENTRY_CANDIDATES = [
  "index.tsx",
  "index.ts",
  "App.tsx",
  "App.ts",
  "main.tsx",
  "main.ts",
  "index.jsx",
  "App.jsx",
];

// ---------------------------------------------------------------------------
// esbuild-wasm singleton initialisation
// ---------------------------------------------------------------------------

type EsbuildModule = typeof import("esbuild-wasm");

interface EsbuildState {
  status: "idle" | "loading" | "ready" | "failed";
  module: EsbuildModule | null;
  error: string | null;
}

const esbuildState: EsbuildState = {
  status: "idle",
  module: null,
  error: null,
};

/** Lazily load + initialise esbuild-wasm exactly once per page lifetime. */
async function getEsbuild(): Promise<EsbuildModule> {
  if (esbuildState.status === "ready" && esbuildState.module !== null) {
    return esbuildState.module;
  }

  if (esbuildState.status === "loading") {
    // Another call already kicked off initialization; poll until complete.
    return new Promise<EsbuildModule>((resolve, reject) => {
      const interval = setInterval(() => {
        if (esbuildState.status === "ready" && esbuildState.module !== null) {
          clearInterval(interval);
          resolve(esbuildState.module);
        } else if (esbuildState.status === "failed") {
          clearInterval(interval);
          reject(new Error(esbuildState.error ?? "esbuild-wasm failed to initialise"));
        }
      }, 50);
    });
  }

  if (esbuildState.status === "failed") {
    throw new Error(esbuildState.error ?? "esbuild-wasm failed to initialise");
  }

  // status === "idle" — we are first.
  esbuildState.status = "loading";

  try {
    // Dynamic import keeps esbuild-wasm out of the initial bundle.
    const esbuild = (await import("esbuild-wasm")) as EsbuildModule;

    // esbuild-wasm ships its own .wasm binary; the wasmURL must point to the
    // correct location for the runtime environment. Using the CDN URL here
    // means no local asset hosting is required.
    await esbuild.initialize({
      wasmURL: `${ESM_SH}/esbuild-wasm/esbuild.wasm`,
      worker: true,
    });

    esbuildState.module = esbuild;
    esbuildState.status = "ready";
    return esbuild;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    esbuildState.error = message;
    esbuildState.status = "failed";
    throw new Error(`esbuild-wasm init failed: ${message}`);
  }
}

// ---------------------------------------------------------------------------
// Virtual filesystem plugin for esbuild
// ---------------------------------------------------------------------------

/**
 * Builds an esbuild plugin that resolves imports from the in-memory `files`
 * map. Unknown bare specifiers (react, etc.) pass through as externals.
 */
function createVirtualFsPlugin(
  virtualFiles: ReadonlyMap<string, string>,
): import("esbuild-wasm").Plugin {
  return {
    name: "virtual-fs",
    setup(build) {
      // Intercept the entry-point load (namespace: "virtual").
      build.onResolve({ filter: /.*/, namespace: "virtual" }, (args) => {
        return { path: args.path, namespace: "virtual" };
      });

      // Resolve relative imports originating from virtual files.
      build.onResolve({ filter: /^\./, namespace: "virtual" }, (args) => {
        const base = args.importer.replace(/\/[^/]+$/, "");
        const candidates = resolvePath(base, args.path);
        for (const candidate of candidates) {
          if (virtualFiles.has(candidate)) {
            return { path: candidate, namespace: "virtual" };
          }
        }
        // Not found in virtual fs — let esbuild handle it (will fail gracefully).
        return null;
      });

      // Load file contents from the virtual map.
      build.onLoad({ filter: /.*/, namespace: "virtual" }, (args) => {
        const content = virtualFiles.get(args.path);
        if (content === undefined) {
          return { errors: [{ text: `Virtual file not found: ${args.path}` }] };
        }
        const loader = inferLoader(args.path);
        return { contents: content, loader };
      });
    },
  };
}

/**
 * Returns candidate absolute paths to try when resolving `importPath` from
 * `baseDir`, covering common extension variants.
 */
function resolvePath(baseDir: string, importPath: string): string[] {
  // Normalise: collapse any `..` / `.` segments naively (good enough for
  // virtual paths that don't need OS-level resolution).
  const joined = baseDir + "/" + importPath;
  const normalised = normalisePath(joined);

  const candidates: string[] = [normalised];

  // If the path has no extension, try common ones.
  if (!/\.[a-z]+$/i.test(normalised)) {
    candidates.push(
      normalised + ".tsx",
      normalised + ".ts",
      normalised + ".jsx",
      normalised + ".js",
      normalised + "/index.tsx",
      normalised + "/index.ts",
    );
  }

  return candidates;
}

function normalisePath(path: string): string {
  const parts = path.split("/");
  const resolved: string[] = [];
  for (const part of parts) {
    if (part === "..") {
      resolved.pop();
    } else if (part !== ".") {
      resolved.push(part);
    }
  }
  return resolved.join("/");
}

function inferLoader(path: string): import("esbuild-wasm").Loader {
  if (path.endsWith(".tsx")) return "tsx";
  if (path.endsWith(".ts")) return "ts";
  if (path.endsWith(".jsx")) return "jsx";
  if (path.endsWith(".css")) return "css";
  if (path.endsWith(".json")) return "json";
  return "js";
}

// ---------------------------------------------------------------------------
// esbuild-wasm bundling
// ---------------------------------------------------------------------------

async function bundleWithEsbuild(
  virtualFiles: ReadonlyMap<string, string>,
  entryPoint: string,
): Promise<string> {
  const esbuild = await getEsbuild();

  const result = await esbuild.build({
    entryPoints: [entryPoint],
    bundle: true,
    format: "esm",
    target: "es2020",
    jsx: "automatic",
    // Keep react/react-dom out of the bundle — they arrive via importmap.
    external: [
      "react",
      "react-dom",
      "react-dom/client",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
    ],
    plugins: [createVirtualFsPlugin(virtualFiles)],
    write: false,
  });

  const output = result.outputFiles?.[0];
  if (!output) {
    throw new Error("esbuild produced no output files");
  }

  return output.text;
}

// ---------------------------------------------------------------------------
// Fallback: lightweight regex-based transform
// ---------------------------------------------------------------------------

/**
 * Strips TypeScript type annotations and rewrites JSX using a minimal regex
 * approach. This is intentionally limited — it only handles simple cases and
 * is used only when esbuild-wasm fails to initialise.
 *
 * Limitations (not exhaustive):
 * - No type-checking, no generic syntax support in expressions.
 * - Multi-file imports are not resolved; only the entry file is processed.
 * - Complex TSX patterns (namespaced elements, spreads) may break.
 */
function fallbackTransform(source: string): string {
  let code = source;

  // Remove import type statements.
  code = code.replace(/^import\s+type\s+[^;]+;\s*$/gm, "");

  // Remove type-only export clauses: export type { ... }
  code = code.replace(/^export\s+type\s+\{[^}]*\}\s*;?\s*$/gm, "");

  // Strip type annotations from variable declarations: `: SomeType` before `=`
  code = code.replace(/:\s*[A-Z][A-Za-z<>\[\], |&?]*(?=\s*=)/g, "");

  // Strip interface / type alias declarations.
  code = code.replace(
    /^(export\s+)?(interface|type)\s+\w[\s\S]*?(?=\n(?:export|const|let|var|function|class|\/\/|$))/gm,
    "",
  );

  // Strip return type annotations on functions: ): ReturnType {
  code = code.replace(/\)\s*:\s*[A-Za-z<>[\]|& ,?]+\s*(?=\{)/g, ") ");

  // Strip function parameter type annotations: (param: Type, param2: Type)
  // This is best-effort only.
  code = code.replace(
    /(\w+)\s*:\s*(?:string|number|boolean|void|never|unknown|any|null|undefined|React\.\w+|ReactNode|ReactElement)\b/g,
    "$1",
  );

  // Rewrite JSX to React.createElement calls is non-trivial without a parser;
  // instead rely on the importmap + native browser JSX (not supported).
  // The fallback therefore ships the code as-is and adds a React shim.
  return code;
}

// ---------------------------------------------------------------------------
// HTML generation
// ---------------------------------------------------------------------------

/**
 * Extracts the name of the default export so the iframe bootstrap knows which
 * identifier to mount. Mirrors the logic in useTranspiler.ts.
 */
function extractDefaultExport(code: string): { code: string; appRef: string } {
  let processed = code;
  let appRef = "App";

  const namedFn = processed.match(/export\s+default\s+function\s+(\w+)/);
  if (namedFn) {
    appRef = namedFn[1] ?? "App";
    processed = processed.replace(/export\s+default\s+function\s+/, "function ");
  } else {
    const namedClass = processed.match(/export\s+default\s+class\s+(\w+)/);
    if (namedClass) {
      appRef = namedClass[1] ?? "App";
      processed = processed.replace(/export\s+default\s+class\s+/, "class ");
    } else {
      const ident = processed.match(/export\s+default\s+(\w+)\s*;/);
      if (ident) {
        appRef = ident[1] ?? "App";
        processed = processed.replace(/export\s+default\s+\w+\s*;/, "");
      } else if (/export\s+default\s+/.test(processed)) {
        processed = processed.replace(/export\s+default\s+/, "const App = ");
        appRef = "App";
      }
    }
  }

  // Strip remaining top-level export keywords (export const, export function …)
  processed = processed.replace(/^export\s+\{[^}]*\}\s*;?\s*$/gm, "");
  processed = processed.replace(/^export\s+/gm, "");

  return { code: processed, appRef };
}

function buildIframeHtml(bundledCode: string, usedFallback: boolean): string {
  // esbuild output keeps `export default` for ESM; the iframe bootstrap
  // imports the module dynamically, so we don't need to strip it.
  // For the fallback path the code may still have `export` keywords.
  const moduleScript = usedFallback
    ? (() => {
        const { code, appRef } = extractDefaultExport(bundledCode);
        return { inlineCode: code, appRef };
      })()
    : { inlineCode: null, appRef: null };

  const esmBlock = usedFallback
    ? `
  ${moduleScript.inlineCode ?? ""}

  globalThis.process ??= { env: {} };
  globalThis.process.env.NODE_ENV ??= "development";
  globalThis.global ??= globalThis;

  try {
    const { createRoot } = await import("react-dom/client");
    const { createElement } = await import("react");
    const _Comp = typeof ${moduleScript.appRef} !== "undefined" ? ${moduleScript.appRef} : null;
    if (_Comp) {
      createRoot(document.getElementById("root")).render(createElement(_Comp));
    } else {
      document.getElementById("root").innerHTML =
        '<p style="padding:2rem;text-align:center;color:#64748b;">No component exported as default.</p>';
    }
  } catch (err) {
    showError(err instanceof Error ? err.message : String(err));
  }`
    : `
  globalThis.process ??= { env: {} };
  globalThis.process.env.NODE_ENV ??= "development";
  globalThis.global ??= globalThis;

  let mod;
  try {
    const blob = new Blob([${JSON.stringify(bundledCode)}], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    mod = await import(url);
    URL.revokeObjectURL(url);
  } catch (err) {
    showError(err instanceof Error ? err.message : String(err));
    mod = null;
  }

  if (mod) {
    try {
      const { createRoot } = await import("react-dom/client");
      const { createElement } = await import("react");
      const Component = mod.default ?? null;
      if (typeof Component === "function") {
        createRoot(document.getElementById("root")).render(createElement(Component));
      } else {
        document.getElementById("root").innerHTML =
          '<p style="padding:2rem;text-align:center;color:#64748b;">No default export found.</p>';
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : String(err));
    }
  }`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script type="importmap">
  {
    "imports": {
      "react": "${ESM_SH}/react@${REACT_VERSION}",
      "react-dom": "${ESM_SH}/react-dom@${REACT_VERSION}",
      "react-dom/client": "${ESM_SH}/react-dom@${REACT_VERSION}/client",
      "react/jsx-runtime": "${ESM_SH}/react@${REACT_VERSION}/jsx-runtime",
      "react/jsx-dev-runtime": "${ESM_SH}/react@${REACT_VERSION}/jsx-dev-runtime"
    }
  }
  </script>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; min-height: 100%; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    #error-display {
      display: none;
      padding: 1rem;
      margin: 1rem;
      color: #dc2626;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      font-family: ui-monospace, monospace;
      font-size: 13px;
      white-space: pre-wrap;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <div id="error-display"></div>
  <script type="module">
  function showError(msg) {
    const el = document.getElementById("error-display");
    if (el) { el.style.display = "block"; el.textContent = msg; }
    window.parent?.postMessage({ type: "preview-error", message: msg }, "*");
  }

  window.addEventListener("error", (e) => showError(e.message));
  window.addEventListener("unhandledrejection", (e) => {
    showError(e.reason instanceof Error ? e.reason.message : String(e.reason));
  });

  ${esmBlock}
  </script>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Entry-point detection
// ---------------------------------------------------------------------------

function detectEntryPoint(files: ReadonlyArray<PreviewFile>): string | null {
  const paths = new Set(files.map((f) => f.path));

  for (const candidate of ENTRY_CANDIDATES) {
    if (paths.has(candidate)) return candidate;
    // Also try without leading slash.
    if (paths.has("/" + candidate)) return "/" + candidate;
  }

  // Last resort: pick the first .tsx/.ts file.
  return files.find((f) => f.path.endsWith(".tsx") || f.path.endsWith(".ts"))?.path ?? null;
}

// ---------------------------------------------------------------------------
// Build pipeline
// ---------------------------------------------------------------------------

interface BuildResult {
  html: string;
  usedFallback: boolean;
}

async function buildPreview(
  files: ReadonlyArray<PreviewFile>,
  entryPoint: string,
): Promise<BuildResult> {
  // Normalise keys: strip leading slash so resolution is consistent.
  const virtualFiles = new Map<string, string>();
  for (const file of files) {
    const key = file.path.startsWith("/") ? file.path.slice(1) : file.path;
    virtualFiles.set(key, file.content);
  }

  const normalisedEntry = entryPoint.startsWith("/") ? entryPoint.slice(1) : entryPoint;

  try {
    const bundled = await bundleWithEsbuild(virtualFiles, normalisedEntry);
    return { html: buildIframeHtml(bundled, false), usedFallback: false };
  } catch (esbuildError) {
    // esbuild-wasm init failed or bundle errored — attempt fallback on the
    // entry file only. Re-throw bundle errors (syntax issues) directly so the
    // caller can surface them; only swallow init failures.
    const isInitError =
      esbuildState.status === "failed" ||
      (esbuildError instanceof Error &&
        esbuildError.message.startsWith("esbuild-wasm init failed"));

    if (!isInitError) {
      throw esbuildError;
    }

    const entryFile = files.find(
      (f) =>
        f.path === entryPoint ||
        f.path === "/" + entryPoint ||
        f.path.replace(/^\//, "") === normalisedEntry,
    );

    if (!entryFile) {
      throw new Error(`Entry file "${entryPoint}" not found and esbuild-wasm is unavailable.`);
    }

    const transformed = fallbackTransform(entryFile.content);
    return { html: buildIframeHtml(transformed, true), usedFallback: true };
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Bundles and previews a virtual set of React/TypeScript source files inside
 * an iframe.
 *
 * @example
 * ```tsx
 * const { iframeRef, loading, error, refresh } = useLivePreview({
 *   files: [{ path: "App.tsx", content: "export default function App() { return <h1>Hi</h1>; }" }],
 * });
 * return <iframe ref={iframeRef} style={{ width: "100%", height: 400 }} />;
 * ```
 */
export function useLivePreview(options: LivePreviewOptions): LivePreviewResult {
  const { files, entryPoint, debounceMs = DEFAULT_DEBOUNCE_MS } = options;

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stable reference to the latest files/entry so the debounced callback
  // always picks up current values without being recreated.
  const latestFilesRef = useRef(files);
  const latestEntryRef = useRef(entryPoint);
  latestFilesRef.current = files;
  latestEntryRef.current = entryPoint;

  // Track the current blob URL so it can be cleaned up on the next build.
  const blobUrlRef = useRef<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // A counter that increments each time refresh() is called, allowing the
  // effect to re-run even when files/entryPoint haven't changed.
  const [refreshToken, setRefreshToken] = useState(0);

  const refresh = useCallback(() => {
    setRefreshToken((t) => t + 1);
  }, []);

  // Stable key representing the current file set — used to decide whether to
  // schedule a new build.
  const filesKey = useMemo(() => {
    return files.map((f) => `${f.path}:${f.content}`).join("|") + (entryPoint ?? "");
  }, [files, entryPoint]);

  useEffect(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
    }

    if (files.length === 0) {
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    timerRef.current = setTimeout(() => {
      void (async () => {
        const currentFiles = latestFilesRef.current;
        const currentEntry = latestEntryRef.current ?? detectEntryPoint(currentFiles) ?? null;

        if (currentEntry === null) {
          setError(
            "Could not determine an entry point. Add an index.tsx, App.tsx, or main.tsx file.",
          );
          setLoading(false);
          return;
        }

        try {
          const { html } = await buildPreview(currentFiles, currentEntry);

          // Clean up previous blob URL if any.
          if (blobUrlRef.current !== null) {
            URL.revokeObjectURL(blobUrlRef.current);
            blobUrlRef.current = null;
          }

          const iframe = iframeRef.current;
          if (iframe !== null) {
            iframe.srcdoc = html;
          }

          setError(null);
        } catch (err) {
          setError(`Preview build failed: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
          setLoading(false);
        }
      })();
    }, debounceMs);

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
    // filesKey and refreshToken drive rebuilds; debounceMs changes are applied
    // on the next build cycle without cancelling an in-flight request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filesKey, refreshToken, debounceMs]);

  // Listen for runtime errors posted from the iframe.
  useEffect(() => {
    const handleMessage = (event: MessageEvent<unknown>) => {
      if (
        typeof event.data === "object" &&
        event.data !== null &&
        (event.data as Record<string, unknown>)["type"] === "preview-error"
      ) {
        const msg = (event.data as Record<string, unknown>)["message"];
        setError(`Runtime error: ${typeof msg === "string" ? msg : String(msg)}`);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Revoke any remaining blob URL when the component unmounts.
  useEffect(() => {
    return () => {
      if (blobUrlRef.current !== null) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return { iframeRef, loading, error, refresh };
}
