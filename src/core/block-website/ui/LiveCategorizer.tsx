"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@spike-land-ai/shared";
import { analyzeCode } from "../core-logic/categorizer-engine";
import type { CategorizationResult, Category } from "../core-logic/categorizer-engine";

const CATEGORY_STYLES: Record<Category, { badge: string; label: string }> = {
  "mcp-tools": {
    badge: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    label: "MCP Tools",
  },
  frontend: {
    badge: "bg-violet-500/15 text-violet-400 border-violet-500/30",
    label: "Frontend",
  },
  "edge-api": {
    badge: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    label: "Edge API",
  },
  media: {
    badge: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    label: "Media",
  },
  cli: {
    badge: "bg-green-500/15 text-green-400 border-green-500/30",
    label: "CLI",
  },
  core: {
    badge: "bg-slate-500/15 text-slate-400 border-slate-500/30",
    label: "Core",
  },
  utilities: {
    badge: "bg-teal-500/15 text-teal-400 border-teal-500/30",
    label: "Utilities",
  },
};

const PLACEHOLDER = `Paste your TypeScript code here...

// Example:
import { Hono } from "hono";
import type { Env } from "./env";

const app = new Hono<{ Bindings: Env }>();`;

export function LiveCategorizer() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<CategorizationResult | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
    }
    if (!code.trim()) {
      setResult(null);
      return;
    }
    timerRef.current = setTimeout(() => {
      setResult(analyzeCode(code));
    }, 300);
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, [code]);

  const style = result ? CATEGORY_STYLES[result.category] : null;

  return (
    <div className="rounded-[2rem] border border-border/60 bg-card/80 p-6 shadow-[var(--panel-shadow)] backdrop-blur-sm">
      <div className="flex flex-col gap-5">
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={PLACEHOLDER}
          spellCheck={false}
          className="h-52 w-full resize-none rounded-2xl border border-border/50 bg-background p-4 font-mono text-xs leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
        />

        {result && style && (
          <div className="flex flex-col gap-4">
            {/* Category badge + reason */}
            <div className="flex flex-wrap items-start gap-3">
              <span
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.24em]",
                  style.badge,
                )}
              >
                {style.label}
              </span>
              <p className="text-sm text-muted-foreground">{result.reason}</p>
            </div>

            {/* Suggested subdirectory */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-[0.24em] text-muted-foreground/60">
                Suggested subdir
              </span>
              <code className="rounded-lg bg-muted/50 px-2 py-0.5 text-xs font-mono text-foreground">
                {result.suggestedSubdir}/
              </code>
            </div>

            {/* Detected imports */}
            {result.imports.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-xs font-black uppercase tracking-[0.24em] text-muted-foreground/60">
                  Detected imports ({result.imports.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {result.imports.map((imp) => (
                    <code
                      key={imp}
                      className="rounded-lg border border-border/40 bg-muted/30 px-2 py-0.5 text-xs font-mono text-muted-foreground"
                    >
                      {imp}
                    </code>
                  ))}
                </div>
              </div>
            )}

            {result.imports.length === 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-[0.24em] text-muted-foreground/60">
                  Detected imports
                </span>
                <span className="text-xs text-muted-foreground/50">none — pure logic</span>
              </div>
            )}
          </div>
        )}

        {!result && code.trim() === "" && (
          <p className="text-xs text-muted-foreground/40">Results appear as you type.</p>
        )}
      </div>
    </div>
  );
}
