import { useState } from "react";
import { CheckCircle2, XCircle, ChevronDown, ChevronRight, Star } from "lucide-react";

interface ResultRendererProps {
  result?: unknown;
  error?: unknown;
}

export function ResultRenderer({ result, error }: ResultRendererProps) {
  const [showRaw, setShowRaw] = useState(false);

  if (error) {
    const errorObj = error as { message?: string };
    return (
      <div className="rounded-lg bg-destructive/10 text-destructive p-3 text-sm flex items-start gap-2">
        <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
        <div className="font-mono whitespace-pre-wrap break-all">
          {errorObj?.message || String(error)}
        </div>
      </div>
    );
  }

  if (!result) return null;

  const resObj = result as { isError?: boolean; content?: Array<Record<string, unknown>> };
  const isErrorResult = resObj.isError;
  const content = resObj.content ?? [];

  return (
    <div
      className={`rounded-lg border p-3 text-sm ${
        isErrorResult ? "border-destructive/50 bg-destructive/10" : "border-border bg-muted/30"
      }`}
    >
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/50">
        {isErrorResult ? (
          <XCircle className="w-4 h-4 text-destructive" />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-green-500" />
        )}
        <span className="font-semibold text-sm">{isErrorResult ? "Error" : "Success"}</span>
        <button
          onClick={() => setShowRaw(!showRaw)}
          className="ml-auto text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          {showRaw ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          RAW
        </button>
      </div>

      <div className="space-y-3">
        {content.map((block, idx) => {
          if (block.type === "text") {
            const text =
              typeof block.text === "object"
                ? JSON.stringify(block.text, null, 2)
                : String(block.text);

            // Try to render as table if it looks like a JSON array of objects
            const parsed = tryParseJsonArray(text);
            if (parsed) return <ResultTable key={idx} data={parsed} />;

            return (
              <div
                key={idx}
                className="font-mono text-xs whitespace-pre-wrap break-words bg-background p-2 rounded border border-border"
              >
                {text}
              </div>
            );
          }
          if (block.type === "image") {
            return (
              <div key={idx} className="bg-background p-2 rounded border border-border">
                <img
                  src={`data:${String(block.mimeType)};base64,${String(block.data)}`}
                  alt="Tool result"
                  className="max-w-full rounded"
                />
              </div>
            );
          }
          return null;
        })}
      </div>

      {showRaw && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <pre className="text-[10px] font-mono p-2 bg-background rounded overflow-x-auto border border-border">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      {!isErrorResult && <StarCta />}
    </div>
  );
}

function tryParseJsonArray(text: string): Record<string, unknown>[] | null {
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === "object") {
      return parsed as Record<string, unknown>[];
    }
  } catch {
    // not JSON
  }
  return null;
}

function StarCta() {
  const [dismissed, setDismissed] = useState(
    () => typeof localStorage !== "undefined" && localStorage.getItem("star-cta-dismissed") === "1",
  );

  if (dismissed) return null;

  return (
    <div className="mt-3 flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
      <Star className="w-4 h-4 text-primary shrink-0" />
      <span className="text-xs text-foreground">
        Enjoyed this? Star us on GitHub — it helps others discover spike.land.
      </span>
      <a
        href="https://github.com/spike-land-ai/spike.land"
        target="_blank"
        rel="noopener noreferrer"
        className="ml-auto shrink-0 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        <Star className="w-3 h-3" />
        Star
      </a>
      <button
        onClick={() => {
          setDismissed(true);
          localStorage.setItem("star-cta-dismissed", "1");
        }}
        className="shrink-0 text-muted-foreground hover:text-foreground text-xs"
        aria-label="Dismiss"
      >
        &times;
      </button>
    </div>
  );
}

function ResultTable({ data }: { data: Record<string, unknown>[] }) {
  const keys = Object.keys(data[0]);
  return (
    <div className="overflow-x-auto rounded border border-border">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-muted/50">
            {keys.map((k) => (
              <th
                key={k}
                className="px-2 py-1.5 text-left font-semibold text-muted-foreground uppercase tracking-wider border-b border-border"
              >
                {k}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 50).map((row, i) => (
            <tr key={i} className="border-b border-border/30 last:border-0">
              {keys.map((k) => (
                <td key={k} className="px-2 py-1.5 font-mono">
                  {typeof row[k] === "object" ? JSON.stringify(row[k]) : String(row[k] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
