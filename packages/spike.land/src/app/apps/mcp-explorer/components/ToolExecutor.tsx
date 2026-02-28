"use client";

import { useCallback, useRef } from "react";
import { Loader2, Play, RotateCcw, X } from "lucide-react";
import type { McpToolDef } from "@/components/mcp/mcp-tool-registry";
import { McpToolForm } from "@/components/mcp/McpToolForm";
import { McpResponseViewer } from "@/components/mcp/McpResponseViewer";
import { useRecentTools } from "@/components/mcp/useMcpHistory";
import type { ToolExecutionResult } from "../hooks/useMcpExplorer";
import { useMcpExplorerMcp } from "../hooks/useMcpExplorerMcp";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ToolExecutorProps {
  tool: McpToolDef;
  result: ToolExecutionResult;
  onExecute: (result: ToolExecutionResult) => void;
  onClose?: () => void;
}

export function ToolExecutor({
  tool,
  result,
  onExecute,
  onClose,
}: ToolExecutorProps) {
  const abortRef = useRef<AbortController | null>(null);
  const { addRecent } = useRecentTools();
  const { executeTool } = useMcpExplorerMcp();

  const handleSubmit = useCallback(
    async (params: Record<string, unknown>) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      addRecent(tool.name);

      await executeTool(tool.name, params, onExecute, controller.signal);
    },
    [tool.name, onExecute, addRecent, executeTool],
  );

  const handleAbort = useCallback(() => {
    abortRef.current?.abort();
    onExecute({
      response: result.response,
      error: "Request cancelled",
      isExecuting: false,
      toolName: tool.name,
    });
  }, [tool.name, result.response, onExecute]);

  const handleReset = useCallback(() => {
    abortRef.current?.abort();
    onExecute({
      response: null,
      error: null,
      isExecuting: false,
      toolName: null,
    });
  }, [onExecute]);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2">
          <Play className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">Try it</h3>
          <code className="text-xs text-zinc-500 font-mono">{tool.name}</code>
        </div>
        <div className="flex items-center gap-2">
          {(result.response !== null || result.error) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-7 px-2 text-xs text-zinc-500 hover:text-zinc-300"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Reset
            </Button>
          )}
          {result.isExecuting && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleAbort}
              className="h-7 px-2 text-xs text-red-400 hover:text-red-300"
            >
              <X className="w-3 h-3 mr-1" />
              Cancel
            </Button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close tool executor"
              className="p-1 rounded-lg text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable body */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Status indicator */}
          {result.isExecuting && (
            <div className="flex items-center gap-2 px-3 py-2 bg-cyan-500/5 border border-cyan-500/20 rounded-xl text-xs text-cyan-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Executing {tool.name}...
            </div>
          )}

          <McpToolForm
            tool={tool}
            onSubmit={handleSubmit}
            isExecuting={result.isExecuting}
          />

          <McpResponseViewer
            response={result.response}
            error={result.error}
            isExecuting={result.isExecuting}
            responseType={tool.responseType}
          />
        </div>
      </ScrollArea>
    </div>
  );
}
