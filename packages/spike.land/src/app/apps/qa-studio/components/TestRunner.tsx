"use client";

import { useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2,
  Clock,
  FlaskConical,
  Loader2,
  Play,
  XCircle,
} from "lucide-react";
import type { TestRunnerState } from "../hooks/useQaStudio";

interface TestRunnerProps {
  state: TestRunnerState;
  onTargetChange: (target: string) => void;
  onRun: () => void;
}

function StatusBadge({ passed }: { passed: boolean; }) {
  return (
    <Badge
      variant={passed ? "success" : "destructive"}
      className="flex items-center gap-1"
    >
      {passed
        ? <CheckCircle2 className="h-3 w-3" />
        : <XCircle className="h-3 w-3" />}
      {passed ? "PASSED" : "FAILED"}
    </Badge>
  );
}

function HistoryItem({
  entry,
  onRerun,
}: {
  entry: { target: string; passed: boolean; timestamp: number; };
  onRerun: (target: string) => void;
}) {
  const timeAgo = Math.round((Date.now() - entry.timestamp) / 1000);
  const label = timeAgo < 60
    ? `${timeAgo}s ago`
    : `${Math.round(timeAgo / 60)}m ago`;

  return (
    <button
      type="button"
      onClick={() => onRerun(entry.target)}
      className="w-full flex items-center justify-between gap-2 rounded-lg border border-border/30 bg-black/10 px-3 py-2 text-left hover:bg-black/20 transition-colors group"
    >
      <span className="text-xs font-mono text-foreground/70 truncate flex-1 group-hover:text-foreground/90">
        {entry.target}
      </span>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {label}
        </span>
        <div
          className={`h-2 w-2 rounded-full ${entry.passed ? "bg-green-500" : "bg-red-500"}`}
          aria-label={entry.passed ? "passed" : "failed"}
        />
      </div>
    </button>
  );
}

export function TestRunner({ state, onTargetChange, onRun }: TestRunnerProps) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        onRun();
      }
    },
    [onRun],
  );

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/40 flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-primary" />
            Test Runner
          </CardTitle>
          {state.status === "success" && state.result && (
            <StatusBadge passed={state.result.passed} />
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3 flex-1">
        <div className="flex items-center gap-2">
          <Input
            value={state.target}
            onChange={e => onTargetChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="src/lib/mcp/server/tools/qa-studio.ts"
            className="text-xs font-mono h-8 bg-black/20 border-border/30 flex-1"
            aria-label="Test file or directory path"
          />
          <Button
            size="sm"
            onClick={onRun}
            disabled={state.status === "loading" || !state.target.trim()}
            className="h-8 shrink-0"
          >
            {state.status === "loading"
              ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              : <Play className="h-3.5 w-3.5 mr-1.5" />}
            Run
          </Button>
        </div>

        {state.status === "loading" && (
          <div className="space-y-2 py-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
            <p className="text-xs text-muted-foreground text-center pt-2">
              Running tests... this may take up to 2 minutes
            </p>
          </div>
        )}

        {state.status === "error" && state.error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            {state.error}
          </div>
        )}

        {state.status === "success" && state.result && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Target:</span>
              <span className="font-mono text-foreground/80 truncate">
                {state.result.target}
              </span>
            </div>
            <ScrollArea className="h-[260px]">
              <pre className="rounded-lg border border-border/30 bg-black/30 p-3 text-xs font-mono text-foreground/80 whitespace-pre-wrap break-all">
                {state.result.output}
              </pre>
            </ScrollArea>
          </div>
        )}

        {state.status === "idle" && (
          <div className="flex items-center justify-center h-20 rounded-lg border border-dashed border-border/30 text-muted-foreground text-xs">
            Enter a test file path or directory, then press Run
          </div>
        )}

        {state.history.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-border/20">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Recent Runs
            </p>
            <div className="space-y-1">
              {state.history.map(entry => (
                <HistoryItem
                  key={`${entry.target}-${entry.timestamp}`}
                  entry={entry}
                  onRerun={onTargetChange}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
