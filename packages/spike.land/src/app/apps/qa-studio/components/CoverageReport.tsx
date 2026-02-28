"use client";

import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";
import {
  BarChart3,
  ChevronDown,
  ChevronRight,
  Loader2,
  Play,
  TrendingUp,
} from "lucide-react";
import type { CoverageState } from "../hooks/useQaStudio";

interface CoverageReportProps {
  state: CoverageState;
  onTargetChange: (target: string) => void;
  onAnalyze: () => void;
}

type CoverageVariant = "success" | "warning" | "destructive";

function getCoverageVariant(value: number | undefined): CoverageVariant {
  if (value === undefined) return "destructive";
  if (value >= 80) return "success";
  if (value >= 60) return "warning";
  return "destructive";
}

function getCoverageColor(value: number | undefined): string {
  if (value === undefined) return "text-muted-foreground";
  if (value >= 80) return "text-green-400";
  if (value >= 60) return "text-amber-400";
  return "text-red-400";
}

interface MetricBarProps {
  label: string;
  value: number | undefined;
  threshold?: number;
}

function MetricBar({ label, value, threshold = 80 }: MetricBarProps) {
  const displayValue = value ?? 0;
  const variant = getCoverageVariant(value);
  const colorClass = getCoverageColor(value);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground font-medium">{label}</span>
        <div className="flex items-center gap-2">
          {value !== undefined && value < threshold && (
            <span className="text-[10px] text-muted-foreground">
              need {(threshold - value).toFixed(1)}% more
            </span>
          )}
          <span className={`font-mono font-bold tabular-nums ${colorClass}`}>
            {value !== undefined ? `${value.toFixed(1)}%` : "N/A"}
          </span>
        </div>
      </div>
      <Progress value={displayValue} variant={variant} glow className="h-2" />
      {threshold > 0 && (
        <div className="relative h-0">
          <div
            className="absolute top-0 h-3 w-px bg-border/60"
            style={{ left: `${threshold}%` }}
            aria-hidden="true"
            title={`CI threshold: ${threshold}%`}
          />
        </div>
      )}
    </div>
  );
}

function OverallScore({ lines, functions, branches, statements }: {
  lines?: number;
  functions?: number;
  branches?: number;
  statements?: number;
}) {
  const values = [lines, functions, branches, statements].filter((
    v,
  ): v is number => v !== undefined);
  if (values.length === 0) return null;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const colorClass = getCoverageColor(avg);

  return (
    <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-black/20 border border-border/30">
      <TrendingUp className={`h-5 w-5 ${colorClass}`} />
      <div className="text-center">
        <p className={`text-2xl font-bold tabular-nums ${colorClass}`}>
          {avg.toFixed(1)}%
        </p>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
          Overall Average
        </p>
      </div>
    </div>
  );
}

export function CoverageReport(
  { state, onTargetChange, onAnalyze }: CoverageReportProps,
) {
  const [rawOpen, setRawOpen] = useState(false);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        onAnalyze();
      }
    },
    [onAnalyze],
  );

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/40 flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          Coverage Report
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3 flex-1">
        <div className="flex items-center gap-2">
          <Input
            value={state.target}
            onChange={e => onTargetChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="src/lib/mcp"
            className="text-xs font-mono h-8 bg-black/20 border-border/30 flex-1"
            aria-label="Source file or directory for coverage analysis"
          />
          <Button
            size="sm"
            onClick={onAnalyze}
            disabled={state.status === "loading" || !state.target.trim()}
            className="h-8 shrink-0"
          >
            {state.status === "loading"
              ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              : <Play className="h-3.5 w-3.5 mr-1.5" />}
            Analyze
          </Button>
        </div>

        {state.status === "loading" && (
          <div className="space-y-3 py-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <p className="text-xs text-muted-foreground text-center pt-1">
              Analyzing coverage... this may take a moment
            </p>
          </div>
        )}

        {state.status === "error" && state.error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            {state.error}
          </div>
        )}

        {state.status === "success" && state.result && (
          <div className="space-y-4">
            <div className="text-xs text-muted-foreground">
              Target:{" "}
              <span className="font-mono text-foreground/80 break-all">
                {state.result.target}
              </span>
            </div>

            <OverallScore
              lines={state.result.lines}
              functions={state.result.functions}
              branches={state.result.branches}
              statements={state.result.statements}
            />

            <div className="space-y-4">
              <MetricBar
                label="Lines"
                value={state.result.lines}
                threshold={80}
              />
              <MetricBar
                label="Functions"
                value={state.result.functions}
                threshold={80}
              />
              <MetricBar
                label="Branches"
                value={state.result.branches}
                threshold={75}
              />
              <MetricBar
                label="Statements"
                value={state.result.statements}
                threshold={80}
              />
            </div>

            <p className="text-[10px] text-muted-foreground">
              Vertical markers indicate CI thresholds (Lines/Functions/Statements: 80%, Branches:
              75%)
            </p>

            <Collapsible open={rawOpen} onOpenChange={setRawOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-full justify-start text-xs text-muted-foreground hover:text-foreground"
                >
                  {rawOpen
                    ? <ChevronDown className="h-3 w-3 mr-1.5" />
                    : <ChevronRight className="h-3 w-3 mr-1.5" />}
                  Raw output
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <pre className="mt-2 rounded-lg border border-border/30 bg-black/30 p-3 text-xs font-mono text-foreground/60 whitespace-pre-wrap break-all max-h-[200px] overflow-y-auto">
                  {state.result.raw}
                </pre>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}

        {state.status === "idle" && (
          <div className="flex items-center justify-center h-20 rounded-lg border border-dashed border-border/30 text-muted-foreground text-xs">
            Enter a source file or directory to analyze coverage
          </div>
        )}
      </CardContent>
    </Card>
  );
}
