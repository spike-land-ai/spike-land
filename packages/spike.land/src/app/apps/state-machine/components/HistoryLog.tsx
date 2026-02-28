"use client";

import { ArrowRight, ChevronDown, ChevronRight, Clock } from "lucide-react";
import type { TransitionLogEntry } from "@/lib/state-machine/types";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface HistoryLogProps {
  entries: TransitionLogEntry[];
  maxVisible?: number;
}

function HistoryEntry({
  entry,
  index,
}: {
  entry: TransitionLogEntry;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasContextChange =
    JSON.stringify(entry.beforeContext) !== JSON.stringify(entry.afterContext);
  const hasDetails = entry.guardEvaluated || entry.actionsExecuted.length > 0
    || hasContextChange;

  return (
    <div className="group relative pl-4 pb-1">
      {/* Timeline dot */}
      <div
        className={cn(
          "absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full border-2 border-zinc-950 z-10 transition-colors",
          index === 0 ? "bg-indigo-500" : "bg-zinc-700 group-hover:bg-zinc-500",
        )}
      />

      <div
        className={cn(
          "p-3 rounded-xl border transition-all",
          index === 0
            ? "bg-indigo-500/5 border-indigo-500/20"
            : "bg-zinc-900/40 border-zinc-800/60 group-hover:bg-zinc-900/70 group-hover:border-zinc-700/60",
        )}
      >
        {/* Header row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={cn(
                "text-xs font-bold shrink-0",
                index === 0 ? "text-indigo-300" : "text-zinc-200",
              )}
            >
              {entry.event}
            </span>
            <span className="text-zinc-600 text-xs shrink-0">·</span>
            <div className="flex items-center gap-1 min-w-0 text-[10px] text-zinc-500">
              <span className="truncate max-w-[60px]">
                {entry.fromStates.join(", ")}
              </span>
              <ArrowRight className="w-2.5 h-2.5 shrink-0 text-zinc-600" />
              <span className="truncate max-w-[60px] text-zinc-300 font-medium">
                {entry.toStates.join(", ")}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[9px] text-zinc-600 font-mono">
              {new Date(entry.timestamp).toLocaleTimeString()}
            </span>
            {hasDetails && (
              <button
                onClick={() => setExpanded(v => !v)}
                className="p-0.5 rounded hover:bg-zinc-700/50 text-zinc-600 hover:text-zinc-300 transition-colors"
                aria-label={expanded ? "Collapse details" : "Expand details"}
              >
                {expanded
                  ? <ChevronDown className="w-3 h-3" />
                  : <ChevronRight className="w-3 h-3" />}
              </button>
            )}
          </div>
        </div>

        {/* Expandable details */}
        {expanded && hasDetails && (
          <div className="mt-2.5 pt-2.5 border-t border-zinc-800/50 space-y-2 text-[10px]">
            {entry.guardEvaluated && (
              <div className="flex items-start gap-2">
                <span className="text-amber-600 font-semibold shrink-0">
                  guard:
                </span>
                <span className="font-mono text-amber-500/80 break-all">
                  {entry.guardEvaluated}
                </span>
              </div>
            )}
            {entry.actionsExecuted.length > 0 && (
              <div className="flex items-start gap-2">
                <span className="text-indigo-500 font-semibold shrink-0">
                  actions:
                </span>
                <span className="text-indigo-400/80">
                  {entry.actionsExecuted.map(a => a.type).join(", ")}
                </span>
              </div>
            )}
            {hasContextChange && (
              <div>
                <span className="text-zinc-500 font-semibold block mb-1">
                  context delta:
                </span>
                <pre className="p-2 rounded-lg bg-black/40 text-zinc-400 font-mono whitespace-pre-wrap overflow-x-auto border border-zinc-800 text-[9px] leading-relaxed">
                  {JSON.stringify(entry.afterContext, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function HistoryLog({ entries, maxVisible = 50 }: HistoryLogProps) {
  const [showAll, setShowAll] = useState(false);
  const reversed = [...entries].reverse();
  const visible = showAll ? reversed : reversed.slice(0, maxVisible);
  const hasMore = reversed.length > maxVisible;

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-zinc-600 gap-4">
        <div className="p-4 rounded-full bg-zinc-900/50 border border-zinc-800">
          <Clock className="w-7 h-7 opacity-40" />
        </div>
        <p className="text-sm font-medium">No transitions recorded yet</p>
        <p className="text-xs text-zinc-700 text-center max-w-[200px]">
          Send events to the machine to see the transition history
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-2">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
          Transition History
        </p>
        <span className="text-[10px] text-zinc-600 bg-zinc-900/50 px-2 py-0.5 rounded border border-zinc-800">
          {entries.length} total
        </span>
      </div>

      <div className="relative pl-3 border-l-2 border-zinc-800/60 ml-1.5 space-y-2">
        {visible.map((entry, idx) => (
          <HistoryEntry
            key={`${entry.timestamp}-${entry.event}-${idx}`}
            entry={entry}
            index={idx}
          />
        ))}
      </div>

      {hasMore && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full text-center text-xs text-zinc-500 hover:text-zinc-300 py-2 border border-zinc-800/60 rounded-xl hover:bg-zinc-900/40 transition-all mt-2"
        >
          Show all {reversed.length} entries
        </button>
      )}
    </div>
  );
}
