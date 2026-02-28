"use client";

import { ArrowRight, Repeat, Shield, Zap } from "lucide-react";
import type { Transition } from "@/lib/state-machine/types";
import { cn } from "@/lib/utils";

interface TransitionArrowProps {
  transition: Transition;
  isActive: boolean;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export function TransitionArrow({
  transition,
  isActive,
  isSelected,
  onSelect,
}: TransitionArrowProps) {
  const isSelfLoop = transition.source === transition.target;

  return (
    <button
      onClick={() => onSelect(transition.id)}
      className={cn(
        "group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all duration-200",
        "hover:scale-[1.005] active:scale-[0.995]",
        isSelected
          ? "bg-indigo-500/10 border-indigo-500/40 shadow-md shadow-indigo-900/20"
          : isActive
          ? "bg-blue-500/8 border-blue-500/30"
          : "bg-zinc-900/30 border-zinc-800/60 hover:bg-zinc-900/60 hover:border-zinc-700/60",
      )}
      aria-pressed={isSelected}
      aria-label={`Transition: ${transition.event} from ${transition.source} to ${transition.target}`}
    >
      {/* Active animation dot */}
      {isActive && (
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
        </span>
      )}

      {/* Self-loop indicator */}
      {isSelfLoop && (
        <Repeat
          className={cn(
            "w-3 h-3 shrink-0",
            isActive ? "text-blue-400" : "text-zinc-500",
          )}
        />
      )}

      {/* Source → Target */}
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        <span
          className={cn(
            "text-xs font-mono truncate max-w-[80px]",
            isActive ? "text-blue-300" : "text-zinc-400",
          )}
        >
          {transition.source}
        </span>
        <ArrowRight
          className={cn(
            "w-3 h-3 shrink-0",
            isActive ? "text-blue-400" : "text-zinc-600",
          )}
        />
        <span
          className={cn(
            "text-xs font-mono truncate max-w-[80px]",
            isActive ? "text-blue-200" : "text-zinc-300",
          )}
        >
          {transition.target}
        </span>
      </div>

      {/* Event name badge */}
      <span
        className={cn(
          "shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border",
          isActive
            ? "bg-blue-500/15 text-blue-300 border-blue-500/30"
            : "bg-zinc-800/50 text-zinc-400 border-zinc-700/50 group-hover:border-zinc-600/60",
        )}
      >
        <Zap className="w-2.5 h-2.5" />
        {transition.event}
      </span>

      {/* Guard indicator */}
      {transition.guard && (
        <span
          title={`Guard: ${transition.guard.expression}`}
          className="shrink-0"
        >
          <Shield
            className={cn(
              "w-3.5 h-3.5",
              isActive ? "text-amber-400" : "text-amber-600/60",
            )}
          />
        </span>
      )}
    </button>
  );
}
