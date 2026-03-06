import { lazy, Suspense, useState, useCallback, useMemo } from "react";
import type { OnMount } from "@monaco-editor/react";
import { Copy, Check, FileCode } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { useDarkMode } from "@/hooks/useDarkMode";

// Configure Monaco web workers to load from esm.spike.land (CSP-safe).
if (typeof globalThis !== "undefined") {
  (globalThis as Record<string, unknown>).MonacoEnvironment = {
    getWorkerUrl(_moduleId: string, label: string) {
      const base = "https://esm.spike.land/monaco-editor@0.55.1/min/vs";
      if (label === "typescript" || label === "javascript") return `${base}/language/typescript/ts.worker.js`;
      if (label === "json") return `${base}/language/json/json.worker.js`;
      if (label === "css" || label === "scss" || label === "less") return `${base}/language/css/css.worker.js`;
      if (label === "html" || label === "handlebars" || label === "razor") return `${base}/language/html/html.worker.js`;
      return `${base}/editor/editor.worker.js`;
    },
  };
}

// Lazy-load the heavy Monaco bundle so it doesn't block initial page load.
const Editor = lazy(() => import("@monaco-editor/react"));

/** Map file extensions to Monaco language identifiers. */
const EXTENSION_LANGUAGE_MAP: Record<string, string> = {
  ts: "typescript",
  tsx: "typescriptreact",
  js: "javascript",
  jsx: "javascriptreact",
  css: "css",
  scss: "scss",
  less: "less",
  json: "json",
  html: "html",
  xml: "xml",
  md: "markdown",
  mdx: "markdown",
  yaml: "yaml",
  yml: "yaml",
  sh: "shell",
  bash: "shell",
  py: "python",
  go: "go",
  rs: "rust",
  sql: "sql",
};

function detectLanguage(fileName: string | undefined, fallback: string): string {
  if (!fileName) return fallback;
  const ext = fileName.split(".").pop()?.toLowerCase();
  return (ext && EXTENSION_LANGUAGE_MAP[ext]) ?? fallback;
}

export interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  theme?: "vs-dark" | "light";
  readOnly?: boolean;
  height?: string;
  fileName?: string;
}

function LoadingSpinner() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
    </div>
  );
}

export function CodeEditor({
  value,
  onChange,
  language = "typescript",
  theme,
  readOnly = false,
  height = "100%",
  fileName,
}: CodeEditorProps) {
  const { isDarkMode } = useDarkMode();
  const [copied, setCopied] = useState(false);

  // Derive Monaco theme: explicit prop overrides auto-detection.
  const monacoTheme = theme ?? (isDarkMode ? "vs-dark" : "light");

  // Auto-detect language from fileName extension; fall back to the prop.
  const resolvedLanguage = useMemo(
    () => detectLanguage(fileName, language),
    [fileName, language],
  );

  // Derive line count from current value for the toolbar badge.
  const lineCount = useMemo(
    () => value.split("\n").length,
    [value],
  );

  const handleChange = useCallback(
    (newValue: string | undefined) => {
      onChange(newValue ?? "");
    },
    [onChange],
  );

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may be unavailable in some contexts — fail silently.
    }
  }, [value]);

  // Focus the editor as soon as it mounts so users can type immediately.
  const handleMount = useCallback<OnMount>((editor) => {
    editor.focus();
  }, []);

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-lg border border-border bg-background",
        "shadow-sm",
      )}
      style={{ height }}
    >
      {/* Toolbar */}
      <div className="flex shrink-0 items-center justify-between border-b border-border bg-muted/40 px-3 py-2">
        <div className="flex items-center gap-2">
          <FileCode className="h-4 w-4 text-muted-foreground" />
          {fileName && (
            <span className="text-sm font-medium text-foreground">
              {fileName}
            </span>
          )}
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-medium",
              "bg-primary/10 text-primary",
            )}
          >
            {resolvedLanguage}
          </span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-medium",
              "bg-muted text-muted-foreground",
            )}
          >
            {lineCount} {lineCount === 1 ? "line" : "lines"}
          </span>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? "Copied to clipboard" : "Copy code to clipboard"}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs",
            "text-muted-foreground transition-colors",
            "hover:bg-muted hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-green-500" />
              <span className="text-green-500">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Editor area */}
      <div className="min-h-0 flex-1">
        <Suspense fallback={<LoadingSpinner />}>
          <Editor
            height="100%"
            language={resolvedLanguage}
            theme={monacoTheme}
            value={value}
            onChange={handleChange}
            onMount={handleMount}
            options={{
              readOnly,
              minimap: { enabled: false },
              fontSize: 14,
              lineHeight: 22,
              fontFamily:
                '"JetBrains Mono", "Fira Code", "Cascadia Code", ui-monospace, monospace',
              fontLigatures: true,
              scrollBeyondLastLine: false,
              wordWrap: "on",
              tabSize: 2,
              renderWhitespace: "selection",
              smoothScrolling: true,
              cursorBlinking: "smooth",
              padding: { top: 12, bottom: 12 },
              bracketPairColorization: { enabled: true },
              guides: { bracketPairs: true },
              suggest: { showKeywords: true },
            }}
          />
        </Suspense>
      </div>
    </div>
  );
}
