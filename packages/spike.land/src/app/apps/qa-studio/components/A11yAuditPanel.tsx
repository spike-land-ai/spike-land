"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accessibility,
  CheckCircle2,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import type { A11yState } from "../hooks/useQaStudio";

interface A11yAuditPanelProps {
  state: A11yState;
  onStandardChange: (standard: "wcag2a" | "wcag2aa" | "wcag21aa") => void;
  onScan: () => void;
}

const WCAG_STANDARDS = [
  { value: "wcag2a", label: "WCAG 2.0 A", description: "Level A — minimum" },
  {
    value: "wcag2aa",
    label: "WCAG 2.0 AA",
    description: "Level AA — standard",
  },
  {
    value: "wcag21aa",
    label: "WCAG 2.1 AA",
    description: "Level AA 2.1 — recommended",
  },
] as const;

type ImpactLevel = "critical" | "serious" | "moderate" | "minor";

function getScoreVariant(score: number): "success" | "warning" | "destructive" {
  if (score >= 80) return "success";
  if (score >= 60) return "warning";
  return "destructive";
}

function getScoreLabel(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Good";
  if (score >= 60) return "Needs Work";
  if (score >= 40) return "Poor";
  return "Critical";
}

function getImpactBadgeVariant(
  impact: string,
): "destructive" | "warning" | "default" | "outline" {
  switch (impact.toLowerCase() as ImpactLevel) {
    case "critical":
      return "destructive";
    case "serious":
      return "warning";
    case "moderate":
      return "warning";
    case "minor":
      return "default";
    default:
      return "outline";
  }
}

function getImpactBorderColor(impact: string): string {
  switch (impact.toLowerCase() as ImpactLevel) {
    case "critical":
      return "border-red-500/40 bg-red-500/5";
    case "serious":
      return "border-orange-500/40 bg-orange-500/5";
    case "moderate":
      return "border-amber-500/40 bg-amber-500/5";
    case "minor":
      return "border-blue-500/40 bg-blue-500/5";
    default:
      return "border-border/30 bg-white/5";
  }
}

function ImpactSummary({
  violations,
}: {
  violations: Array<{ issue: string; impact: string; }>;
}) {
  const counts: Record<string, number> = {};
  for (const v of violations) {
    const key = v.impact.toLowerCase();
    counts[key] = (counts[key] ?? 0) + 1;
  }

  const impactOrder: ImpactLevel[] = [
    "critical",
    "serious",
    "moderate",
    "minor",
  ];
  const present = impactOrder.filter(level => counts[level]);

  if (present.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {present.map(level => (
        <Badge
          key={level}
          variant={getImpactBadgeVariant(level)}
          className="text-[10px]"
        >
          {counts[level]} {level}
        </Badge>
      ))}
    </div>
  );
}

export function A11yAuditPanel(
  { state, onStandardChange, onScan }: A11yAuditPanelProps,
) {
  const scoreVariant = state.result
    ? getScoreVariant(state.result.score)
    : "success";

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/40 flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Accessibility className="h-4 w-4 text-primary" />
            Accessibility Audit
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select
              value={state.standard}
              onValueChange={v => onStandardChange(v as "wcag2a" | "wcag2aa" | "wcag21aa")}
            >
              <SelectTrigger className="h-7 text-xs w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WCAG_STANDARDS.map(s => (
                  <SelectItem key={s.value} value={s.value}>
                    <span className="text-xs">{s.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={onScan}
              disabled={state.status === "loading"}
              className="h-7"
            >
              {state.status === "loading"
                ? <Loader2 className="h-3 w-3 animate-spin mr-1" />
                : <ShieldCheck className="h-3 w-3 mr-1" />}
              Scan
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 flex-1">
        {state.status === "error" && state.error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            {state.error}
          </div>
        )}

        {state.status === "loading" && (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        )}

        {state.status === "success" && state.result && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Accessibility Score
                  </p>
                  <p
                    className={`text-3xl font-bold tabular-nums ${
                      state.result.score >= 80
                        ? "text-green-400"
                        : state.result.score >= 60
                        ? "text-amber-400"
                        : "text-red-400"
                    }`}
                  >
                    {state.result.score}
                    <span className="text-sm text-muted-foreground font-normal">
                      /100
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-muted-foreground">
                    {getScoreLabel(state.result.score)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {state.result.standard}
                  </p>
                </div>
              </div>
              <Progress
                value={state.result.score}
                variant={scoreVariant}
                glow
                className="h-2.5"
              />
            </div>

            {state.result.violations.length > 0 && (
              <ImpactSummary violations={state.result.violations} />
            )}

            {state.result.violations.length === 0
              ? (
                <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-4 flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-green-400">
                      No violations found
                    </p>
                    <p className="text-xs text-muted-foreground">
                      All accessibility checks passed for {state.result.standard}
                    </p>
                  </div>
                </div>
              )
              : (
                <ScrollArea className="h-[220px]">
                  <div className="space-y-2 pr-2">
                    <p className="text-xs text-muted-foreground">
                      {state.result.violations.length} violation
                      {state.result.violations.length !== 1 ? "s" : ""} found
                    </p>
                    {state.result.violations.map(
                      (
                        violation: { issue: string; impact: string; },
                        idx: number,
                      ) => (
                        <div
                          key={`${violation.impact}-${idx}`}
                          className={`rounded-lg border p-3 ${
                            getImpactBorderColor(violation.impact)
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <Badge
                              variant={getImpactBadgeVariant(violation.impact)}
                              className="text-[10px] px-1.5 py-0 shrink-0 mt-0.5"
                            >
                              {violation.impact}
                            </Badge>
                            <span className="text-xs text-foreground/80 break-words">
                              {violation.issue}
                            </span>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </ScrollArea>
              )}
          </div>
        )}

        {state.status === "idle" && (
          <div className="flex flex-col items-center justify-center gap-2 h-24 rounded-lg border border-dashed border-border/30 text-muted-foreground text-xs">
            <Accessibility className="h-6 w-6 opacity-30" />
            <span>
              Navigate to a page, then click Scan to audit accessibility
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
