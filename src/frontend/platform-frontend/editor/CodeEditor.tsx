import { lazy, Suspense, useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Copy, Check, FileCode } from "lucide-react";
import { cn } from "../styling/cn";
import { useDarkMode } from "../ui/hooks/useDarkMode";
import { useMonacoTypeAcquisition } from "../ui/hooks/useMonacoTypeAcquisition";
import { MonacoCover } from "./monaco-cover/MonacoCover";

// Configure Monaco web workers to load from esm.spike.land (CSP-safe).
// We use a Blob with importScripts to bypass the cross-origin worker restriction.
if (typeof globalThis !== "undefined") {
  (globalThis as Record<string, unknown>).MonacoEnvironment = {
    getWorkerUrl(_moduleId: string, label: string) {
      const base = "https://esm.spike.land/monaco-editor@0.55.1/min/vs";
      let path = `${base}/editor/editor.worker.js`;
      if (label === "typescript" || label === "javascript") {
        path = `${base}/language/typescript/ts.worker.js`;
      } else if (label === "json") {
        path = `${base}/language/json/json.worker.js`;
      } else if (label === "css" || label === "scss" || label === "less") {
        path = `${base}/language/css/css.worker.js`;
      } else if (label === "html" || label === "handlebars" || label === "razor") {
        path = `${base}/language/html/html.worker.js`;
      }
      
      // Monaco internally instantiates the worker with { type: 'module' }.
      // importScripts is illegal in module workers, so we must use a dynamic or static import.
      const blob = new Blob([`import '${path}';`], { type: 'application/javascript' });
      return URL.createObjectURL(blob);
    },
  };
}

function LocalMonacoEditor({
  value,
  language,
  theme,
  onChange,
  options,
  onMount,
  beforeMount,
}: any) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    let isMounted = true;

    import("monaco-editor").then((monaco) => {
      if (!isMounted) return;

      if (beforeMount) {
        beforeMount(monaco);
      }

      editorRef.current = monaco.editor.create(containerRef.current!, {
        value,
        language,
        theme,
        ...options,
      });

      if (onMount) {
        onMount(editorRef.current, monaco);
      }

      editorRef.current.onDidChangeModelContent(() => {
        onChange(editorRef.current.getValue());
      });
    }).catch(err => {
      console.error("Failed to load monaco-editor", err);
    });

    return () => {
      isMounted = false;
      if (editorRef.current) {
        editorRef.current.dispose();
      }
    };
  }, []); // Run once on mount

  useEffect(() => {
    if (editorRef.current && editorRef.current.getValue() !== value) {
      editorRef.current.setValue(value);
    }
  }, [value]);

  useEffect(() => {
    if (editorRef.current) {
      import("monaco-editor").then((monaco) => {
         monaco.editor.setTheme(theme);
         const model = editorRef.current.getModel();
         if (model) {
           monaco.editor.setModelLanguage(model, language);
         }
      });
    }
  }, [theme, language]);

  return <div ref={containerRef} className="w-full h-full" />;
}

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
  const [monacoInstance, setMonacoInstance] = useState<typeof import("monaco-editor") | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const { typesReady } = useMonacoTypeAcquisition({
    monaco: monacoInstance,
    code: value,
  });

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

  const handleBeforeMount = useCallback((monaco: any) => {
    // Local monaco package exports typescript directly on the root object
    const typescript = monaco?.typescript || monaco?.languages?.typescript;
    if (!typescript) return;

    const tsDefaults = typescript.typescriptDefaults;
    if (!tsDefaults) return;

    tsDefaults.setCompilerOptions({
      target: 99, // ScriptTarget.ESNext
      module: 99, // ModuleKind.ESNext
      moduleResolution: 2, // ModuleResolutionKind.NodeJs
      jsx: 4, // JsxEmit.ReactJSX
      jsxImportSource: "react",
      allowNonTsExtensions: true,
      allowSyntheticDefaultImports: true,
      esModuleInterop: true,
      strict: false,
      noEmit: true,
      skipLibCheck: true,
      lib: ["dom", "dom.iterable", "es2015", "es2016", "esnext"],
    });

    // Eagerly opt-in to validation but suppress "missing module" noise
    // that fires before ATA has fetched the type definitions.
    tsDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
      noSuggestionDiagnostics: true,
      diagnosticCodesToIgnore: [2307, 7016],
    });

    // Enable automatic type acquisition for the editor model
    tsDefaults.setEagerModelSync(true);
  }, []);

  // Focus the editor as soon as it mounts so users can type immediately.
  const handleMount = useCallback((editor: any, monaco: any) => {
    editor.focus();
    setMonacoInstance(monaco);
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
      <div className="flex shrink-0 items-center justify-between border-b border-border bg-muted/40 px-3 py-2 cursor-pointer select-none" onClick={() => setIsEditing(true)}>
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
          {!isEditing && (
            <span className="text-xs font-medium text-muted-foreground/60 ml-2">
              Click to edit
            </span>
          )}
          {monacoInstance && isEditing && (resolvedLanguage === "typescript" || resolvedLanguage === "typescriptreact") && (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-medium",
                typesReady ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500 animate-pulse"
              )}
            >
              {typesReady ? "Types Loaded" : "Loading Types..."}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleCopy();
          }}
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
      <div className="min-h-0 flex-1 relative bg-background">
        {!isEditing ? (
          <MonacoCover
            value={value}
            isDark={monacoTheme === "vs-dark"}
            onClick={() => setIsEditing(true)}
          />
        ) : (
          <Suspense fallback={<LoadingSpinner />}>
            <LocalMonacoEditor
              height="100%"
              language={resolvedLanguage}
              theme={monacoTheme}
              value={value}
              onChange={handleChange}
              beforeMount={handleBeforeMount}
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
        )}
      </div>
    </div>
  );
}
