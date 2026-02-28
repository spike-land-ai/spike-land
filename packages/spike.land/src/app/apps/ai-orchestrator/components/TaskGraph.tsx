"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  ArrowDown,
  CheckCircle2,
  Clock,
  GitBranch,
  Layers,
  Play,
  Plus,
  Wand2,
} from "lucide-react";

export type PipelineStepStatus = "idle" | "running" | "done" | "error";

export interface PipelineStep {
  id: number;
  label: string;
  model: string;
  status: PipelineStepStatus;
  agentId?: string;
  durationMs?: number;
}

interface TaskGraphProps {
  steps: PipelineStep[];
  onAddStep: () => void;
  onEditStep: (id: number) => void;
  onRunStep: (id: number) => void;
}

const STEP_CONFIG: Record<PipelineStepStatus, {
  borderClass: string;
  bgClass: string;
  dotClass: string;
  textClass: string;
  icon: React.ReactNode;
}> = {
  idle: {
    borderClass: "border-zinc-800",
    bgClass: "bg-zinc-900/40",
    dotClass: "bg-zinc-600",
    textClass: "text-zinc-500",
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  running: {
    borderClass: "border-blue-500/30",
    bgClass: "bg-blue-950/20",
    dotClass: "bg-blue-500 animate-pulse",
    textClass: "text-blue-400",
    icon: <Play className="w-3.5 h-3.5" />,
  },
  done: {
    borderClass: "border-emerald-500/20",
    bgClass: "bg-emerald-950/10",
    dotClass: "bg-emerald-500",
    textClass: "text-emerald-400",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  error: {
    borderClass: "border-red-500/30",
    bgClass: "bg-red-950/10",
    dotClass: "bg-red-500",
    textClass: "text-red-400",
    icon: <AlertCircle className="w-3.5 h-3.5" />,
  },
};

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60_000)}m ${Math.floor((ms % 60_000) / 1000)}s`;
}

export function TaskGraph(
  { steps, onAddStep, onEditStep, onRunStep }: TaskGraphProps,
) {
  const completedCount = steps.filter(s => s.status === "done").length;
  const runningCount = steps.filter(s => s.status === "running").length;
  const errorCount = steps.filter(s => s.status === "error").length;

  return (
    <div className="flex flex-col h-full">
      {/* Graph header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-violet-500" />
          <h2 className="text-sm font-bold text-zinc-300">Pipeline Graph</h2>
        </div>
        <div className="flex items-center gap-2">
          {runningCount > 0 && (
            <Badge
              variant="outline"
              className="text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/30"
            >
              {runningCount} running
            </Badge>
          )}
          {errorCount > 0 && (
            <Badge
              variant="outline"
              className="text-[10px] bg-red-500/10 text-red-400 border-red-500/30"
            >
              {errorCount} errors
            </Badge>
          )}
          <span className="text-[10px] text-zinc-600">
            {completedCount}/{steps.length} done
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 bg-zinc-800 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-violet-600 to-emerald-500 rounded-full transition-all duration-500"
          style={{
            width: `${steps.length > 0 ? (completedCount / steps.length) * 100 : 0}%`,
          }}
        />
      </div>

      {/* Steps */}
      <div className="flex-1 overflow-y-auto space-y-0 pr-1">
        {steps.map((step, idx) => {
          const config = STEP_CONFIG[step.status];
          return (
            <div key={step.id}>
              <div
                className={`rounded-xl border ${config.borderClass} ${config.bgClass} p-4 hover:bg-zinc-800/20 transition-all group`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Step number */}
                    <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400 shrink-0">
                      {step.id}
                    </div>

                    {/* Step info */}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-zinc-200">
                        {step.label}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[10px] text-zinc-500 flex items-center gap-1">
                          <Layers className="w-2.5 h-2.5" />
                          {step.model}
                        </p>
                        {step.durationMs !== undefined && step.durationMs > 0
                          && (
                            <p className="text-[10px] text-zinc-600">
                              {formatDuration(step.durationMs)}
                            </p>
                          )}
                      </div>
                    </div>
                  </div>

                  {/* Status + actions */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex items-center gap-1.5 text-[10px] font-bold ${config.textClass}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`}
                      />
                      {step.status}
                    </span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-zinc-600 hover:text-violet-400"
                        onClick={() => onEditStep(step.id)}
                        aria-label="Edit step"
                      >
                        <Wand2 className="w-3 h-3" />
                      </Button>
                      {step.status !== "running" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-zinc-600 hover:text-emerald-400"
                          onClick={() => onRunStep(step.id)}
                          aria-label="Run step"
                        >
                          <Play className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {idx < steps.length - 1 && (
                <div className="flex justify-center py-1.5">
                  <ArrowDown className="w-3.5 h-3.5 text-zinc-700" />
                </div>
              )}
            </div>
          );
        })}

        {/* Add step */}
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-dashed border-zinc-700 bg-transparent hover:bg-zinc-800 hover:border-violet-500/40 transition-all text-xs"
            onClick={onAddStep}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Step
          </Button>
        </div>
      </div>
    </div>
  );
}
