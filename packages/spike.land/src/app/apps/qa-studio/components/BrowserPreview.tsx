"use client";

import { useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Camera,
  Globe,
  Loader2,
  Monitor,
  Network,
  Smartphone,
  Tablet,
  Terminal,
} from "lucide-react";
import Image from "next/image";
import type { BrowserState, ViewportPreset } from "../hooks/useQaStudio";

interface BrowserPreviewProps {
  state: BrowserState;
  onUrlChange: (url: string) => void;
  onNavigate: () => void;
  onSetViewport: (preset: ViewportPreset) => void;
  onToggleFullPage: () => void;
  onCapture: () => void;
  onFetchNetwork: (includeStatic?: boolean) => void;
  onFetchConsole: (level?: string) => void;
  onSetConsoleLevel: (level: "error" | "warning" | "info" | "debug") => void;
}

const VIEWPORT_OPTIONS: Array<{
  value: ViewportPreset;
  label: string;
  icon: React.ReactNode;
}> = [
  {
    value: "desktop",
    label: "Desktop (1440x900)",
    icon: <Monitor className="h-3.5 w-3.5" />,
  },
  {
    value: "tablet",
    label: "Tablet (768x1024)",
    icon: <Tablet className="h-3.5 w-3.5" />,
  },
  {
    value: "mobile",
    label: "Mobile (375x812)",
    icon: <Smartphone className="h-3.5 w-3.5" />,
  },
];

const CONSOLE_LEVELS = ["error", "warning", "info", "debug"] as const;

function ViewportIcon({ preset }: { preset: ViewportPreset; }) {
  switch (preset) {
    case "mobile":
      return <Smartphone className="h-3.5 w-3.5" />;
    case "tablet":
      return <Tablet className="h-3.5 w-3.5" />;
    default:
      return <Monitor className="h-3.5 w-3.5" />;
  }
}

function ConsoleLevelBadge({ type }: { type: string; }) {
  const colorMap: Record<string, string> = {
    error: "text-red-400 bg-red-400/10 border-red-400/30",
    warn: "text-amber-400 bg-amber-400/10 border-amber-400/30",
    warning: "text-amber-400 bg-amber-400/10 border-amber-400/30",
    info: "text-blue-400 bg-blue-400/10 border-blue-400/30",
    debug: "text-muted-foreground bg-muted/10 border-border/30",
    log: "text-foreground/70 bg-white/5 border-border/20",
  };
  const colorClass = colorMap[type.toLowerCase()] ?? colorMap.log;

  return (
    <span
      className={`text-[10px] px-1 py-0 rounded border font-mono uppercase ${colorClass}`}
    >
      {type}
    </span>
  );
}

export function BrowserPreview({
  state,
  onUrlChange,
  onNavigate,
  onSetViewport,
  onToggleFullPage,
  onCapture,
  onFetchNetwork,
  onFetchConsole,
  onSetConsoleLevel,
}: BrowserPreviewProps) {
  const handleUrlKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        onNavigate();
      }
    },
    [onNavigate],
  );

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/40 flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" />
          Browser Preview
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 flex-1">
        {/* Navigation Bar */}
        <div className="flex items-center gap-2">
          <Input
            value={state.url}
            onChange={e => onUrlChange(e.target.value)}
            onKeyDown={handleUrlKeyDown}
            placeholder="https://example.com"
            className="text-xs font-mono h-8 bg-black/20 border-border/30 flex-1"
            aria-label="URL to navigate to"
          />
          <Button
            size="sm"
            onClick={onNavigate}
            disabled={state.navigationStatus === "loading" || !state.url.trim()}
            className="h-8 shrink-0 bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            {state.navigationStatus === "loading"
              ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
              : <Globe className="h-3.5 w-3.5 mr-1" />}
            Go
          </Button>
        </div>

        {state.navigationStatus === "error" && state.navigationError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
            {state.navigationError}
          </div>
        )}

        {state.currentTitle && (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
            <p className="text-xs text-muted-foreground truncate">
              <span className="font-medium text-foreground/80">
                {state.currentTitle}
              </span>
              {" — "}
              <span className="font-mono text-[10px]">{state.currentUrl}</span>
            </p>
          </div>
        )}

        <Tabs defaultValue="screenshot">
          <TabsList className="h-8 text-xs">
            <TabsTrigger value="screenshot" className="text-xs gap-1.5">
              <Camera className="h-3 w-3" />
              Screenshot
            </TabsTrigger>
            <TabsTrigger value="network" className="text-xs gap-1.5">
              <Network className="h-3 w-3" />
              Network
            </TabsTrigger>
            <TabsTrigger value="console" className="text-xs gap-1.5">
              <Terminal className="h-3 w-3" />
              Console
            </TabsTrigger>
          </TabsList>

          {/* Screenshot Tab */}
          <TabsContent value="screenshot" className="space-y-3 mt-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Select
                value={state.selectedViewport}
                onValueChange={v => onSetViewport(v as ViewportPreset)}
              >
                <SelectTrigger className="h-7 text-xs flex-1 min-w-[120px]">
                  <div className="flex items-center gap-1.5">
                    <ViewportIcon preset={state.selectedViewport} />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {VIEWPORT_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        {opt.icon}
                        <span className="text-xs">{opt.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <label
                htmlFor="fullpage-switch"
                className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap cursor-pointer"
              >
                <Switch
                  id="fullpage-switch"
                  checked={state.fullPage}
                  onCheckedChange={onToggleFullPage}
                  className="h-4 w-7"
                />
                Full page
              </label>

              <Button
                size="sm"
                onClick={onCapture}
                disabled={state.screenshotStatus === "loading"}
                className="h-7 shrink-0"
              >
                {state.screenshotStatus === "loading"
                  ? <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  : <Camera className="h-3 w-3 mr-1" />}
                Capture
              </Button>
            </div>

            {state.screenshotStatus === "loading" && (
              <Skeleton className="w-full aspect-video rounded-lg" />
            )}

            {state.screenshotStatus === "error" && state.screenshotError && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                {state.screenshotError}
              </div>
            )}

            {state.screenshotStatus === "success" && state.screenshot && (
              <div className="relative rounded-lg overflow-hidden border border-border/30">
                <Image
                  src={`data:image/png;base64,${state.screenshot.base64}`}
                  alt={`Screenshot of ${state.screenshot.url}`}
                  className="w-full h-auto"
                  width={1440}
                  height={900}
                  unoptimized
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm px-2 py-1.5 flex items-center justify-between gap-2">
                  <p className="text-[10px] text-white/70 truncate flex-1">
                    {state.screenshot.url}
                  </p>
                  {state.screenshot.fullPage && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1 border-white/20 text-white/60 shrink-0"
                    >
                      full page
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {state.screenshotStatus === "idle" && (
              <div className="flex flex-col items-center justify-center gap-2 h-36 rounded-lg border border-dashed border-border/30 text-muted-foreground text-xs">
                <Camera className="h-6 w-6 opacity-30" />
                <span>Navigate to a URL, then capture a screenshot</span>
              </div>
            )}
          </TabsContent>

          {/* Network Tab */}
          <TabsContent value="network" className="space-y-3 mt-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                {state.networkResult
                  ? `${state.networkResult.requests.length} requests, ${
                    (state.networkResult.totalSize / 1024).toFixed(1)
                  } KB`
                  : "No requests captured"}
              </p>
              <Button
                size="sm"
                onClick={() => onFetchNetwork(false)}
                disabled={state.networkStatus === "loading"}
                className="h-7 shrink-0"
              >
                {state.networkStatus === "loading"
                  ? <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  : <Network className="h-3 w-3 mr-1" />}
                Capture
              </Button>
            </div>

            {state.networkStatus === "error" && state.networkError && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                {state.networkError}
              </div>
            )}

            {state.networkStatus === "loading" && (
              <div className="space-y-1.5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-7 w-full" />
                ))}
              </div>
            )}

            {state.networkStatus === "success" && state.networkResult && (
              <div className="space-y-2">
                {state.networkResult.errorCount > 0 && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">
                    {state.networkResult.errorCount} error response
                    {state.networkResult.errorCount !== 1 ? "s" : ""} (4xx/5xx)
                  </div>
                )}
                <ScrollArea className="h-[280px]">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border/30">
                        <th className="text-left p-1.5 text-muted-foreground font-medium w-12">
                          Method
                        </th>
                        <th className="text-left p-1.5 text-muted-foreground font-medium w-10">
                          Status
                        </th>
                        <th className="text-left p-1.5 text-muted-foreground font-medium">
                          URL
                        </th>
                        <th className="text-right p-1.5 text-muted-foreground font-medium w-14">
                          Size
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.networkResult.requests.slice(0, 50).map((
                        req,
                        idx,
                      ) => (
                        <tr
                          key={`${req.url}-${idx}`}
                          className="border-b border-border/10 hover:bg-white/5"
                        >
                          <td className="p-1.5">
                            <span className="font-mono text-[10px] text-blue-400">
                              {req.method}
                            </span>
                          </td>
                          <td className="p-1.5">
                            <span
                              className={`font-mono text-[10px] ${
                                req.status >= 400
                                  ? "text-red-400"
                                  : req.status >= 300
                                  ? "text-amber-400"
                                  : "text-green-400"
                              }`}
                            >
                              {req.status}
                            </span>
                          </td>
                          <td className="p-1.5">
                            <span className="font-mono text-[10px] text-foreground/70 truncate block max-w-[200px]">
                              {req.url}
                            </span>
                          </td>
                          <td className="p-1.5 text-right">
                            <span className="font-mono text-[10px] text-muted-foreground">
                              {req.contentLength
                                ? `${
                                  (parseInt(req.contentLength, 10) / 1024)
                                    .toFixed(1)
                                }K`
                                : "-"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ScrollArea>
              </div>
            )}

            {state.networkStatus === "idle" && (
              <div className="flex flex-col items-center justify-center gap-2 h-24 rounded-lg border border-dashed border-border/30 text-muted-foreground text-xs">
                <Network className="h-6 w-6 opacity-30" />
                <span>Navigate to a page, then capture network requests</span>
              </div>
            )}
          </TabsContent>

          {/* Console Tab */}
          <TabsContent value="console" className="space-y-3 mt-3">
            <div className="flex items-center gap-2">
              <Select
                value={state.consoleLevel}
                onValueChange={v => {
                  onSetConsoleLevel(
                    v as "error" | "warning" | "info" | "debug",
                  );
                }}
              >
                <SelectTrigger className="h-7 text-xs flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONSOLE_LEVELS.map(level => (
                    <SelectItem key={level} value={level}>
                      <span className="text-xs capitalize">{level}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                onClick={() => onFetchConsole(state.consoleLevel)}
                disabled={state.consoleStatus === "loading"}
                className="h-7 shrink-0"
              >
                {state.consoleStatus === "loading"
                  ? <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  : <Terminal className="h-3 w-3 mr-1" />}
                Fetch
              </Button>
            </div>

            {state.consoleStatus === "error" && state.consoleError && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                {state.consoleError}
              </div>
            )}

            {state.consoleStatus === "loading" && (
              <div className="space-y-1.5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-7 w-full" />
                ))}
              </div>
            )}

            {state.consoleStatus === "success" && (
              <>
                {state.consoleMessages.length === 0
                  ? (
                    <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-3 text-xs text-green-400 text-center">
                      No console messages at level &quot;{state
                        .consoleLevel}&quot; or above
                    </div>
                  )
                  : (
                    <ScrollArea className="h-[280px]">
                      <div className="space-y-1 font-mono">
                        {state.consoleMessages.map((msg, idx) => (
                          <div
                            key={`${msg.type}-${idx}`}
                            className="flex items-start gap-2 p-1.5 rounded hover:bg-white/5"
                          >
                            <ConsoleLevelBadge type={msg.type} />
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] text-foreground/80 break-words">
                                {msg.text}
                              </p>
                              {msg.url && (
                                <p className="text-[10px] text-muted-foreground truncate">
                                  {msg.url}
                                  {msg.line ? `:${msg.line}` : ""}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
              </>
            )}

            {state.consoleStatus === "idle" && (
              <div className="flex flex-col items-center justify-center gap-2 h-24 rounded-lg border border-dashed border-border/30 text-muted-foreground text-xs">
                <Terminal className="h-6 w-6 opacity-30" />
                <span>Navigate to a page, then fetch console messages</span>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
