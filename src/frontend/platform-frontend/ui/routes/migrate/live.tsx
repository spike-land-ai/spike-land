import { useState, useEffect, useCallback, useMemo } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MigratedFile {
  path: string;
  original: string;
  transformed: string;
  warnings: string[];
}

interface AnalyzeResult {
  owner: string;
  repo: string;
  routerType: string;
  files: MigratedFile[];
  routeTree: string;
}

interface MigrateState {
  repoUrl: string;
  loading: boolean;
  error: string | null;
  result: AnalyzeResult | null;
  activeFile: string | null;
}

interface DiffLine {
  type: "added" | "removed" | "todo" | "context";
  content: string;
}

// ---------------------------------------------------------------------------
// Countdown
// ---------------------------------------------------------------------------

const COUNTDOWN_TARGET = new Date("2026-03-27T00:00:00Z").getTime();

function useCountdown(targetMs: number) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  return useMemo(() => {
    const diff = Math.max(0, targetMs - now);
    const d = Math.floor(diff / 86_400_000);
    const h = Math.floor((diff % 86_400_000) / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    const s = Math.floor((diff % 60_000) / 1000);
    return { d, h, m, s, expired: diff <= 0 };
  }, [targetMs, now]);
}

function CountdownBanner() {
  const { d, h, m, s, expired } = useCountdown(COUNTDOWN_TARGET);

  if (expired) return null;

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div
      className="mx-auto max-w-3xl rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] px-6 py-4 text-center"
      role="timer"
      aria-live="polite"
      aria-label="Countdown to March 27"
    >
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[var(--muted-fg)] mb-2">
        March 27, 2026
      </p>
      <p className="font-mono text-3xl font-black tracking-wider text-[var(--fg)] tabular-nums sm:text-4xl">
        {pad(d)}D {pad(h)}H {pad(m)}M {pad(s)}S
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Diff helpers
// ---------------------------------------------------------------------------

function parseDiffLines(original: string, transformed: string): DiffLine[] {
  const origLines = original.split("\n");
  const transLines = transformed.split("\n");

  const lines: DiffLine[] = [];

  // Simple unified-diff style: mark removed lines from original and added from
  // transformed. For a real diff we'd use a diff algorithm; here we do a
  // heuristic pass that gives clear visual feedback.
  const maxLen = Math.max(origLines.length, transLines.length);

  for (let i = 0; i < maxLen; i++) {
    const orig = origLines[i];
    const trans = transLines[i];

    if (orig === undefined && trans !== undefined) {
      if (trans.includes("// TODO: Manual review needed")) {
        lines.push({ type: "todo", content: `+ ${trans}` });
      } else {
        lines.push({ type: "added", content: `+ ${trans}` });
      }
    } else if (trans === undefined && orig !== undefined) {
      lines.push({ type: "removed", content: `- ${orig}` });
    } else if (orig !== trans) {
      lines.push({ type: "removed", content: `- ${orig ?? ""}` });
      if (trans !== undefined) {
        if (trans.includes("// TODO: Manual review needed")) {
          lines.push({ type: "todo", content: `+ ${trans}` });
        } else {
          lines.push({ type: "added", content: `+ ${trans}` });
        }
      }
    } else {
      lines.push({ type: "context", content: `  ${orig ?? ""}` });
    }
  }

  return lines;
}

function lineClass(type: DiffLine["type"]): string {
  switch (type) {
    case "added":
      return "bg-green-950/60 text-green-300";
    case "removed":
      return "bg-red-950/60 text-red-300 line-through opacity-70";
    case "todo":
      return "bg-amber-950/60 text-amber-300";
    default:
      return "text-[var(--muted-fg)]";
  }
}

// ---------------------------------------------------------------------------
// File tree
// ---------------------------------------------------------------------------

interface FileTreeProps {
  files: MigratedFile[];
  activeFile: string | null;
  onSelect: (path: string) => void;
  transformed?: boolean;
}

function FileTree({ files, activeFile, onSelect, transformed = false }: FileTreeProps) {
  return (
    <nav aria-label={transformed ? "Transformed file tree" : "Original file tree"}>
      <ul className="space-y-0.5">
        {files.map((f) => {
          const displayPath = transformed
            ? f.path.replace(/\.(tsx|ts|jsx|js)$/, (ext) => `.edge${ext}`)
            : f.path;
          const isActive = f.path === activeFile;
          return (
            <li key={f.path}>
              <button
                type="button"
                onClick={() => onSelect(f.path)}
                className={`w-full truncate rounded-lg px-3 py-1.5 text-left font-mono text-xs transition-colors ${
                  isActive
                    ? "bg-[var(--primary-color)] text-white"
                    : "text-[var(--muted-fg)] hover:bg-[var(--accent-bg)] hover:text-[var(--fg)]"
                }`}
                title={displayPath}
              >
                {displayPath}
                {f.warnings.length > 0 && (
                  <span className="ml-1.5 inline-block rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-400">
                    {f.warnings.length}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Code panels
// ---------------------------------------------------------------------------

function OriginalPanel({ file }: { file: MigratedFile }) {
  return (
    <pre
      className="h-full overflow-auto rounded-xl bg-[var(--card-bg)] p-4 font-mono text-xs leading-5 text-[var(--fg)]"
      aria-label="Original file content"
    >
      <code>{file.original}</code>
    </pre>
  );
}

function TransformedPanel({ file }: { file: MigratedFile }) {
  const diffLines = useMemo(
    () => parseDiffLines(file.original, file.transformed),
    [file.original, file.transformed],
  );

  return (
    <div className="h-full overflow-auto rounded-xl bg-[var(--card-bg)] p-4 font-mono text-xs leading-5">
      {file.warnings.length > 0 && (
        <div className="mb-3 rounded-lg border border-amber-500/30 bg-amber-950/40 px-3 py-2">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-amber-400">
            Warnings
          </p>
          <ul className="space-y-1">
            {file.warnings.map((w) => (
              <li key={w} className="text-xs text-amber-300">
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}
      <code>
        {diffLines.map((line, i) => (
          <div
            key={`${line.type}-${i}-${line.content.slice(0, 16)}`}
            className={`-mx-4 px-4 ${lineClass(line.type)}`}
          >
            {line.content}
          </div>
        ))}
      </code>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Preview iframe with error boundary via state
// ---------------------------------------------------------------------------

interface LivePreviewProps {
  owner: string;
  repo: string;
}

function LivePreview({ owner, repo }: LivePreviewProps) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const previewUrl = `https://preview.spike.land/migrate/${owner}/${repo}`;

  return (
    <div className="relative h-full min-h-64 w-full overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)]">
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary-color)] border-t-transparent" />
            <p className="text-sm text-[var(--muted-fg)]">Preview loading...</p>
          </div>
        </div>
      )}
      {status === "error" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-sm font-semibold text-[var(--fg)]">Preview unavailable</p>
            <p className="mt-1 text-xs text-[var(--muted-fg)]">
              The live preview could not be loaded for this repository.
            </p>
          </div>
        </div>
      )}
      <iframe
        src={previewUrl}
        title={`Live preview of ${owner}/${repo}`}
        className={`h-full min-h-64 w-full border-0 transition-opacity ${
          status === "ready" ? "opacity-100" : "opacity-0"
        }`}
        sandbox="allow-scripts allow-same-origin allow-forms"
        onLoad={() => setStatus("ready")}
        onError={() => setStatus("error")}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Results view
// ---------------------------------------------------------------------------

interface RouterTypeBadgeProps {
  routerType: string;
}

function RouterTypeBadge({ routerType }: RouterTypeBadgeProps) {
  const colorMap: Record<string, string> = {
    Pages: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    App: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    Mixed: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  };
  const classes =
    colorMap[routerType] ?? "bg-[var(--accent-bg)] text-[var(--fg)] border-[var(--border-color)]";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${classes}`}
    >
      {routerType} Router
    </span>
  );
}

interface ResultsViewProps {
  result: AnalyzeResult;
  activeFile: string | null;
  onSelectFile: (path: string) => void;
}

function ResultsView({ result, activeFile, onSelectFile }: ResultsViewProps) {
  const currentFile = useMemo(
    () => result.files.find((f) => f.path === activeFile) ?? result.files[0] ?? null,
    [result.files, activeFile],
  );

  const totalWarnings = useMemo(
    () => result.files.reduce((acc, f) => acc + f.warnings.length, 0),
    [result.files],
  );

  function handleCopyAll() {
    const allCode = result.files.map((f) => `// === ${f.path} ===\n${f.transformed}`).join("\n\n");
    void navigator.clipboard.writeText(allCode);
  }

  return (
    <section aria-label="Migration results" className="space-y-4">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] px-5 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-sm font-semibold text-[var(--fg)]">
            {result.owner}/{result.repo}
          </span>
          <RouterTypeBadge routerType={result.routerType} />
          <span className="text-xs text-[var(--muted-fg)]">{result.files.length} files</span>
          {totalWarnings > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-400">
              {totalWarnings} warning{totalWarnings !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={handleCopyAll}
          className="rounded-lg border border-[var(--border-color)] bg-[var(--bg)] px-4 py-1.5 text-xs font-semibold text-[var(--fg)] transition-colors hover:border-[var(--primary-color)] hover:text-[var(--primary-color)]"
        >
          Copy All
        </button>
      </div>

      {/* Split panel */}
      <div className="grid gap-4 xl:grid-cols-2">
        {/* Left: Original */}
        <div className="rubik-panel flex min-h-[28rem] flex-col gap-3 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--muted-fg)]">
              Original (Next.js)
            </h3>
          </div>
          <div className="flex flex-1 gap-3 overflow-hidden">
            {/* File tree sidebar */}
            <div className="w-44 shrink-0 overflow-y-auto border-r border-[var(--border-color)] pr-3">
              <FileTree
                files={result.files}
                activeFile={currentFile?.path ?? null}
                onSelect={onSelectFile}
                transformed={false}
              />
            </div>
            {/* Code view */}
            <div className="flex-1 overflow-hidden">
              {currentFile ? (
                <OriginalPanel file={currentFile} />
              ) : (
                <p className="text-xs text-[var(--muted-fg)]">Select a file</p>
              )}
            </div>
          </div>
        </div>

        {/* Right: Transformed */}
        <div className="rubik-panel flex min-h-[28rem] flex-col gap-3 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--muted-fg)]">
              Transformed (Edge-native)
            </h3>
          </div>
          <div className="flex flex-1 gap-3 overflow-hidden">
            {/* File tree sidebar */}
            <div className="w-44 shrink-0 overflow-y-auto border-r border-[var(--border-color)] pr-3">
              <FileTree
                files={result.files}
                activeFile={currentFile?.path ?? null}
                onSelect={onSelectFile}
                transformed
              />
            </div>
            {/* Diff view */}
            <div className="flex-1 overflow-hidden">
              {currentFile ? (
                <TransformedPanel file={currentFile} />
              ) : (
                <p className="text-xs text-[var(--muted-fg)]">Select a file</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Live preview */}
      <div className="rubik-panel p-4">
        <h3 className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--muted-fg)]">
          Live Preview
        </h3>
        <LivePreview owner={result.owner} repo={result.repo} />
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function MigrateLivePage() {
  const [state, setState] = useState<MigrateState>({
    repoUrl: "",
    loading: false,
    error: null,
    result: null,
    activeFile: null,
  });

  const handleTransform = useCallback(async () => {
    const url = state.repoUrl.trim();
    if (!url) return;

    setState((prev) => ({ ...prev, loading: true, error: null, result: null, activeFile: null }));

    try {
      // Step 1: analyze
      const analyzeRes = await fetch("/api/migrate/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl: url }),
      });

      if (!analyzeRes.ok) {
        const text = await analyzeRes.text();
        throw new Error(text || `Analyze failed (${analyzeRes.status})`);
      }

      const analyzeData = (await analyzeRes.json()) as {
        owner: string;
        repo: string;
        routerType: string;
        files: Array<{ path: string; content: string }>;
        routeTree: string;
      };

      // Step 2: transform
      const transformRes = await fetch("/api/migrate/transform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: analyzeData.files }),
      });

      if (!transformRes.ok) {
        const text = await transformRes.text();
        throw new Error(text || `Transform failed (${transformRes.status})`);
      }

      const transformData = (await transformRes.json()) as {
        files: Array<{ path: string; original: string; transformed: string; warnings: string[] }>;
      };

      const result: AnalyzeResult = {
        owner: analyzeData.owner,
        repo: analyzeData.repo,
        routerType: analyzeData.routerType,
        routeTree: analyzeData.routeTree,
        files: transformData.files,
      };

      setState((prev) => ({
        ...prev,
        loading: false,
        result,
        activeFile: result.files[0]?.path ?? null,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : "An unexpected error occurred.",
      }));
    }
  }, [state.repoUrl]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      void handleTransform();
    }
  }

  function handleSelectFile(path: string) {
    setState((prev) => ({ ...prev, activeFile: path }));
  }

  return (
    <div className="rubik-container rubik-page rubik-stack">
      {/* Countdown */}
      <div className="py-2">
        <CountdownBanner />
      </div>

      {/* Hero */}
      <section
        className="rubik-panel-strong space-y-6 p-6 text-center sm:p-10"
        aria-labelledby="migrate-live-heading"
      >
        <div className="space-y-3">
          <span className="rubik-eyebrow">
            <span className="h-2 w-2 rounded-full bg-[var(--primary-color)]" />
            Zero-Install Migration
          </span>
          <h1
            id="migrate-live-heading"
            className="text-4xl font-semibold tracking-[-0.06em] text-[var(--fg)] sm:text-5xl"
          >
            Zero-Install Next.js Migration
          </h1>
          <p className="mx-auto max-w-xl text-base leading-relaxed text-[var(--muted-fg)] sm:text-lg">
            Paste a GitHub repo URL. Watch it transform. No clone. No build. No Vercel.
          </p>
        </div>

        {/* Input + button */}
        <div className="mx-auto flex max-w-2xl flex-col gap-3 sm:flex-row">
          <label htmlFor="repo-url-input" className="sr-only">
            GitHub repository URL
          </label>
          <input
            id="repo-url-input"
            type="url"
            value={state.repoUrl}
            onChange={(e) => setState((prev) => ({ ...prev, repoUrl: e.target.value }))}
            onKeyDown={handleKeyDown}
            placeholder="github.com/vercel/next.js-canary/examples/hello-world"
            disabled={state.loading}
            className="flex-1 rounded-xl border border-[var(--border-color)] bg-[var(--bg)] px-4 py-3 font-mono text-sm text-[var(--fg)] placeholder:text-[var(--muted-fg)] focus:border-[var(--primary-color)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]/20 disabled:opacity-50 transition-colors"
            aria-describedby={state.error ? "transform-error" : undefined}
          />
          <button
            type="button"
            onClick={() => void handleTransform()}
            disabled={state.loading || !state.repoUrl.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--primary-color)] px-7 py-3 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {state.loading ? (
              <>
                <span
                  className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                  aria-hidden="true"
                />
                Transforming...
              </>
            ) : (
              "Transform"
            )}
          </button>
        </div>

        {/* Error */}
        {state.error && (
          <div
            id="transform-error"
            role="alert"
            className="mx-auto max-w-2xl rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-300"
          >
            {state.error}
          </div>
        )}
      </section>

      {/* Results */}
      {state.result && (
        <ResultsView
          result={state.result}
          activeFile={state.activeFile}
          onSelectFile={handleSelectFile}
        />
      )}

      {/* Empty state when no result and not loading */}
      {!state.result && !state.loading && (
        <div
          aria-hidden="true"
          className="rubik-panel p-10 text-center text-sm text-[var(--muted-fg)]"
        >
          <p className="text-3xl mb-3 opacity-30">&#x21BB;</p>
          <p>Enter a GitHub URL above and click Transform to see the migration output here.</p>
          <p className="mt-2 text-xs opacity-70">
            Works with Pages Router, App Router, and mixed Next.js projects.
          </p>
        </div>
      )}
    </div>
  );
}
