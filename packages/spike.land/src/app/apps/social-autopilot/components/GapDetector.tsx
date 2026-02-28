"use client";

import { AlertTriangle, CheckCircle2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GapDetectorProps {
  gapDays: string[];
  daysAhead: number;
  onFillGap: (dateStr: string) => void;
  isLoading: boolean;
}

function formatGapDate(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const target = new Date(dateStr + "T00:00:00");
  if (target.toDateString() === today.toDateString()) return "Today";
  if (target.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function getGapSeverity(dateStr: string): "urgent" | "warning" | "low" {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  const diffDays = Math.floor(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays <= 1) return "urgent";
  if (diffDays <= 3) return "warning";
  return "low";
}

const SEVERITY_STYLES = {
  urgent: {
    dot: "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]",
    label: "text-red-400",
    badge: "bg-red-950/40 border-red-500/20 text-red-400",
    row: "border-red-500/10 hover:border-red-500/30",
  },
  warning: {
    dot: "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.4)]",
    label: "text-yellow-400",
    badge: "bg-yellow-950/40 border-yellow-500/20 text-yellow-400",
    row: "border-yellow-500/10 hover:border-yellow-500/20",
  },
  low: {
    dot: "bg-zinc-500",
    label: "text-zinc-400",
    badge: "bg-zinc-800 border-zinc-700 text-zinc-500",
    row: "border-zinc-800/60 hover:border-zinc-700",
  },
};

export function GapDetector(
  { gapDays, daysAhead, onFillGap, isLoading }: GapDetectorProps,
) {
  const urgentCount = gapDays.filter(d => getGapSeverity(d) === "urgent").length;
  const warningCount = gapDays.filter(d => getGapSeverity(d) === "warning").length;

  if (isLoading) {
    return (
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-5 space-y-3">
        <div className="h-4 w-32 bg-zinc-800 rounded animate-pulse" />
        <div className="h-3 w-48 bg-zinc-800/60 rounded animate-pulse" />
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="h-10 bg-zinc-800/40 rounded-xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          {gapDays.length === 0
            ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            : <AlertTriangle className="w-4 h-4 text-yellow-400" />}
          <h3 className="text-sm font-semibold text-white">
            Gap Detector
          </h3>
        </div>
        <p className="text-[11px] text-zinc-600 mt-1">
          Next {daysAhead} days &mdash; {gapDays.length === 0
            ? "All days covered"
            : `${gapDays.length} gap${gapDays.length !== 1 ? "s" : ""} found`}
        </p>

        {gapDays.length > 0 && (
          <div className="flex items-center gap-3 mt-2">
            {urgentCount > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-red-400 font-bold">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500" />
                {urgentCount} urgent
              </span>
            )}
            {warningCount > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-yellow-400 font-bold">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-yellow-500" />
                {warningCount} soon
              </span>
            )}
          </div>
        )}
      </div>

      {/* Gap list */}
      <div className="p-4">
        {gapDays.length === 0
          ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="w-10 h-10 rounded-2xl bg-emerald-900/30 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-sm font-medium text-zinc-300">
                Calendar is full
              </p>
              <p className="text-[11px] text-zinc-600 mt-1">
                Great job! All days have scheduled content.
              </p>
            </div>
          )
          : (
            <div className="space-y-2">
              {gapDays.map(dateStr => {
                const severity = getGapSeverity(dateStr);
                const styles = SEVERITY_STYLES[severity];
                return (
                  <div
                    key={dateStr}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${styles.row}`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${styles.dot}`}
                    />
                    <div className="flex-1 min-w-0">
                      <span className={`text-xs font-semibold ${styles.label}`}>
                        {formatGapDate(dateStr)}
                      </span>
                      <p className="text-[10px] text-zinc-700 font-mono mt-0.5">
                        {dateStr}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onFillGap(dateStr)}
                      className="h-7 px-2.5 text-[11px] text-emerald-400 hover:text-emerald-300 hover:bg-emerald-900/30 gap-1 flex-shrink-0"
                    >
                      <Zap className="w-3 h-3" />
                      Fill
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
      </div>
    </div>
  );
}
