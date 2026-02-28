"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, BarChart3, FlaskConical, Globe } from "lucide-react";
import { useQaStudio } from "../hooks/useQaStudio";
import { BrowserPreview } from "./BrowserPreview";
import { TestRunner } from "./TestRunner";
import { CoverageReport } from "./CoverageReport";
import { A11yAuditPanel } from "./A11yAuditPanel";

export function QaStudioDashboard() {
  const qa = useQaStudio();

  return (
    <div className="space-y-6">
      {/* Dashboard header summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Browser"
          value={qa.state.browser.currentTitle || "No page"}
          subtext={qa.state.browser.navigationStatus === "success"
            ? "Connected"
            : "Idle"}
          icon={<Globe className="h-4 w-4" />}
          variant={qa.state.browser.navigationStatus === "success"
            ? "success"
            : "muted"}
        />
        <StatCard
          label="Last Test"
          value={qa.state.testRunner.result
            ? qa.state.testRunner.result.passed ? "PASSED" : "FAILED"
            : "No runs"}
          subtext={`${qa.state.testRunner.history.length} run${
            qa.state.testRunner.history.length !== 1 ? "s" : ""
          } this session`}
          icon={<FlaskConical className="h-4 w-4" />}
          variant={qa.state.testRunner.result
            ? qa.state.testRunner.result.passed ? "success" : "error"
            : "muted"}
        />
        <StatCard
          label="A11y Score"
          value={qa.state.a11y.result
            ? `${qa.state.a11y.result.score}/100`
            : "Not scanned"}
          subtext={qa.state.a11y.result
            ? `${qa.state.a11y.result.violations.length} violation${
              qa.state.a11y.result.violations.length !== 1 ? "s" : ""
            }`
            : "Run a scan"}
          icon={<Activity className="h-4 w-4" />}
          variant={qa.state.a11y.result
            ? qa.state.a11y.result.score >= 80 ? "success" : "error"
            : "muted"}
        />
        <StatCard
          label="Coverage"
          value={qa.state.coverage.result?.lines != null
            ? `${qa.state.coverage.result.lines.toFixed(1)}%`
            : "Not analyzed"}
          subtext={qa.state.coverage.result?.target ?? "Run analysis"}
          icon={<BarChart3 className="h-4 w-4" />}
          variant={qa.state.coverage.result?.lines != null
            ? qa.state.coverage.result.lines >= 80 ? "success" : "error"
            : "muted"}
        />
      </div>

      {/* Main workspace */}
      <Tabs defaultValue="browser">
        <TabsList>
          <TabsTrigger value="browser" className="gap-1.5">
            <Globe className="h-3.5 w-3.5" />
            Browser
          </TabsTrigger>
          <TabsTrigger value="testing" className="gap-1.5">
            <FlaskConical className="h-3.5 w-3.5" />
            Testing
          </TabsTrigger>
          <TabsTrigger value="a11y" className="gap-1.5">
            <Activity className="h-3.5 w-3.5" />
            Accessibility
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browser" className="mt-4">
          <BrowserPreview
            state={qa.state.browser}
            onUrlChange={qa.setUrl}
            onNavigate={qa.navigate}
            onSetViewport={qa.setViewport}
            onToggleFullPage={qa.toggleFullPage}
            onCapture={qa.captureScreenshot}
            onFetchNetwork={qa.fetchNetwork}
            onFetchConsole={qa.fetchConsole}
            onSetConsoleLevel={qa.setConsoleLevel}
          />
        </TabsContent>

        <TabsContent value="testing" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <TestRunner
              state={qa.state.testRunner}
              onTargetChange={qa.setTestTarget}
              onRun={qa.runTests}
            />
            <CoverageReport
              state={qa.state.coverage}
              onTargetChange={qa.setCoverageTarget}
              onAnalyze={qa.analyzeCoverage}
            />
          </div>
        </TabsContent>

        <TabsContent value="a11y" className="mt-4">
          <div className="max-w-2xl">
            <A11yAuditPanel
              state={qa.state.a11y}
              onStandardChange={qa.setA11yStandard}
              onScan={qa.runA11yScan}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

type StatVariant = "success" | "error" | "muted";

interface StatCardProps {
  label: string;
  value: string;
  subtext: string;
  icon: React.ReactNode;
  variant: StatVariant;
}

function StatCard({ label, value, subtext, icon, variant }: StatCardProps) {
  const iconColorMap: Record<StatVariant, string> = {
    success: "text-green-400",
    error: "text-red-400",
    muted: "text-muted-foreground",
  };
  const valueColorMap: Record<StatVariant, string> = {
    success: "text-green-400",
    error: "text-red-400",
    muted: "text-foreground/80",
  };

  return (
    <div className="rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
          {label}
        </p>
        <span className={iconColorMap[variant]}>{icon}</span>
      </div>
      <p className={`text-sm font-bold truncate ${valueColorMap[variant]}`}>
        {value}
      </p>
      <p className="text-[10px] text-muted-foreground truncate">{subtext}</p>
    </div>
  );
}
