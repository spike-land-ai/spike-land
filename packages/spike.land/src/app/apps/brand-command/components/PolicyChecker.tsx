"use client";

import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface PolicyIssue {
  severity: "error" | "warning" | "info";
  message: string;
}

interface PolicyCheckResult {
  passed: boolean;
  score: number;
  issues: PolicyIssue[];
}

interface PolicyCheckerProps {
  isLoading: boolean;
  result: unknown;
  onCheck: (args: { content: string; }) => void;
  onReset: () => void;
}

function parsePolicyResult(data: unknown): PolicyCheckResult | null {
  if (!data) return null;
  if (typeof data === "object" && data !== null) {
    const d = data as Record<string, unknown>;
    const passed = typeof d.passed === "boolean"
      ? d.passed
      : typeof d.compliant === "boolean"
      ? d.compliant
      : true;
    const score = typeof d.score === "number"
      ? d.score
      : typeof d.compliance_score === "number"
      ? d.compliance_score
      : passed
      ? 100
      : 40;
    const issues: PolicyIssue[] = [];

    if (Array.isArray(d.issues)) {
      for (const issue of d.issues) {
        if (typeof issue === "string") {
          issues.push({ severity: "warning", message: issue });
        } else if (typeof issue === "object" && issue !== null) {
          const i = issue as Record<string, unknown>;
          issues.push({
            severity: i.severity === "error"
              ? "error"
              : i.severity === "info"
              ? "info"
              : "warning",
            message: typeof i.message === "string"
              ? i.message
              : typeof i.text === "string"
              ? i.text
              : "Policy issue detected",
          });
        }
      }
    }
    return { passed, score, issues };
  }
  return null;
}

const SEVERITY_CONFIG = {
  error: {
    icon: XCircle,
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
  },
  warning: {
    icon: AlertCircle,
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
  },
  info: {
    icon: CheckCircle2,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
} as const;

export function PolicyChecker({
  isLoading,
  result,
  onCheck,
  onReset,
}: PolicyCheckerProps) {
  const [content, setContent] = useState("");
  const parsedResult = parsePolicyResult(result);

  const handleCheck = () => {
    if (!content.trim()) return;
    onCheck({ content });
  };

  const scoreColor = parsedResult && parsedResult.score > 90
    ? "text-green-400"
    : parsedResult && parsedResult.score > 70
    ? "text-orange-400"
    : "text-red-400";

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-green-400" />
        Brand Policy Checker
      </h2>
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-5">
        <p className="text-sm text-zinc-400">
          Paste any content to verify it meets your brand guidelines before publishing.
        </p>

        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Paste your copy, headline, or message here..."
          rows={4}
          className="w-full bg-zinc-800/60 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder-zinc-500 resize-none focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-colors"
        />

        <div className="flex items-center gap-3">
          <Button
            onClick={handleCheck}
            disabled={isLoading || !content.trim()}
            className="gap-2 bg-green-700 hover:bg-green-600 text-white border-0 flex-1"
          >
            {isLoading
              ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Checking...
                </>
              )
              : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Check Policy
                </>
              )}
          </Button>
          {Boolean(result) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="text-zinc-400 hover:text-zinc-200"
            >
              Clear
            </Button>
          )}
        </div>

        {parsedResult && (
          <div className="space-y-4">
            {/* Score summary */}
            <div
              className={`flex items-center justify-between rounded-2xl border p-4 ${
                parsedResult.passed
                  ? "border-green-500/20 bg-green-500/5"
                  : "border-red-500/20 bg-red-500/5"
              }`}
            >
              <div className="flex items-center gap-3">
                {parsedResult.passed
                  ? <CheckCircle2 className="w-5 h-5 text-green-400" />
                  : <ShieldAlert className="w-5 h-5 text-red-400" />}
                <div>
                  <span className="font-semibold text-zinc-200 block text-sm">
                    {parsedResult.passed
                      ? "Policy Compliant"
                      : "Policy Violations Found"}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {parsedResult.issues.length} issue
                    {parsedResult.issues.length !== 1 ? "s" : ""} detected
                  </span>
                </div>
              </div>
              <div className={`text-2xl font-black ${scoreColor}`}>
                {parsedResult.score}%
              </div>
            </div>

            {/* Issues list */}
            {parsedResult.issues.length > 0 && (
              <div className="space-y-2">
                {parsedResult.issues.map((issue, idx) => {
                  const config = SEVERITY_CONFIG[issue.severity];
                  const Icon = config.icon;
                  return (
                    <div
                      key={idx}
                      className={`flex items-start gap-3 rounded-xl border ${config.border} ${config.bg} p-3`}
                    >
                      <Icon
                        className={`w-4 h-4 ${config.color} flex-shrink-0 mt-0.5`}
                      />
                      <span className="text-sm text-zinc-300">
                        {issue.message}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {parsedResult.passed && parsedResult.issues.length === 0 && (
              <p className="text-sm text-green-400 text-center py-2">
                Your content fully meets all brand policy guidelines.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
