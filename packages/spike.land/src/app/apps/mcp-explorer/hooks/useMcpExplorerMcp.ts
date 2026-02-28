"use client";

import { useMcpMutation } from "@/lib/mcp/client/hooks/use-mcp-mutation";
import { useCallback, useRef } from "react";
import type { ToolExecutionResult } from "./useMcpExplorer";

export interface UseMcpExplorerMcpOptions {
  onSuccess?: (result: ToolExecutionResult) => void;
  onError?: (result: ToolExecutionResult) => void;
}

/**
 * MCP wrapper for executing MCP tools in the explorer.
 * Replaces direct fetch("/api/mcp/proxy", ...) calls.
 */
export function useMcpExplorerMcp(options: UseMcpExplorerMcpOptions = {}) {
  const mutation = useMcpMutation<unknown>("mcp_proxy_execute", {
    onSuccess: () => {
      // handled via executeTool return
    },
    onError: () => {
      // handled via executeTool return
    },
  });

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const executeTool = useCallback(
    async (
      toolName: string,
      params: Record<string, unknown>,
      onResult: (result: ToolExecutionResult) => void,
      signal?: AbortSignal,
    ) => {
      if (signal?.aborted) return;

      onResult({
        response: null,
        error: null,
        isExecuting: true,
        toolName,
      });

      try {
        const data = await mutation.mutateAsync({ tool: toolName, params });

        if (signal?.aborted) return;

        onResult({
          response: data,
          error: null,
          isExecuting: false,
          toolName,
        });

        optionsRef.current.onSuccess?.({
          response: data,
          error: null,
          isExecuting: false,
          toolName,
        });
      } catch (err) {
        if (signal?.aborted) return;

        const errorMsg = err instanceof Error ? err.message : "Unknown error";

        const errorResult: ToolExecutionResult = {
          response: null,
          error: errorMsg,
          isExecuting: false,
          toolName,
        };

        onResult(errorResult);
        optionsRef.current.onError?.(errorResult);
      }
    },
    [mutation],
  );

  return {
    executeTool,
    isLoading: mutation.isLoading,
    reset: mutation.reset,
  };
}
