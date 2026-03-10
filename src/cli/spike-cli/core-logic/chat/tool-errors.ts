/**
 * Structured error reporting for tool execution.
 * Provides "did you mean?" suggestions and error classification.
 */

import type { NamespacedTool } from "../multiplexer/server-manager.js";
import { fuzzyFilter } from "../util/fuzzy.js";

export interface StructuredToolError {
  code: string;
  message: string;
  suggestions: string[];
  retryable: boolean;
  hint?: string;
  originalStack?: string;
}

/**
 * Build a helpful error when a tool is not found, with fuzzy "did you mean?" suggestions.
 */
export function buildNotFoundError(name: string, allTools: NamespacedTool[]): StructuredToolError {
  const suggestions = fuzzyFilter(name, allTools, (t) => t.namespacedName)
    .slice(0, 3)
    .map((t) => t.namespacedName);

  const hint =
    suggestions.length > 0
      ? `Did you mean: ${suggestions.join(", ")}?`
      : "Use tool_search to find available tools.";

  return {
    code: "TOOL_NOT_FOUND",
    message: `Tool not found: "${name}"`,
    suggestions,
    retryable: false,
    hint,
  };
}

/**
 * Classify an upstream tool error and return structured information.
 */
export function buildUpstreamError(name: string, error: unknown): StructuredToolError {
  const message = error instanceof Error ? error.message : String(error);
  const originalStack = error instanceof Error ? error.stack : undefined;
  const classification = classifyError(message);

  return {
    code: classification.code,
    message: `Tool "${name}" failed: ${message}`,
    suggestions: classification.suggestions,
    retryable: classification.retryable,
    hint: classification.hint,
    originalStack,
  };
}

interface ErrorClassification {
  code: string;
  retryable: boolean;
  suggestions: string[];
  hint?: string;
}

function classifyError(message: string): ErrorClassification {
  const lower = message.toLowerCase();

  // Timeout errors
  if (lower.includes("timeout") || lower.includes("timed out") || lower.includes("etimedout")) {
    return {
      code: "TIMEOUT",
      retryable: true,
      suggestions: ["Retry with a longer timeout", "Check if the MCP server is responding"],
      hint: "The tool execution exceeded the time limit. This may be a transient issue.",
    };
  }

  // Connection errors
  if (
    lower.includes("disconnected") ||
    lower.includes("econnrefused") ||
    lower.includes("econnreset") ||
    lower.includes("connection") ||
    lower.includes("socket hang up")
  ) {
    return {
      code: "SERVER_DISCONNECTED",
      retryable: true,
      suggestions: ["Check server status with /servers", "The server may need to be restarted"],
      hint: "The MCP server connection was lost. Automatic reconnection may resolve this.",
    };
  }

  // Rate limiting
  if (
    lower.includes("rate limit") ||
    lower.includes("429") ||
    lower.includes("too many requests")
  ) {
    return {
      code: "RATE_LIMITED",
      retryable: true,
      suggestions: ["Wait a moment before retrying", "Reduce request frequency"],
      hint: "The server is rate-limiting requests. Backoff and retry.",
    };
  }

  // Validation / bad input
  if (
    lower.includes("validation") ||
    lower.includes("invalid") ||
    lower.includes("required") ||
    lower.includes("missing")
  ) {
    return {
      code: "VALIDATION_ERROR",
      retryable: false,
      suggestions: ["Check the tool's input schema", "Ensure all required parameters are provided"],
      hint: "The input did not match the expected format.",
    };
  }

  // Auth errors
  if (
    lower.includes("unauthorized") ||
    lower.includes("forbidden") ||
    lower.includes("401") ||
    lower.includes("403")
  ) {
    return {
      code: "AUTH_ERROR",
      retryable: false,
      suggestions: ["Check authentication credentials", "Re-authenticate with /auth"],
      hint: "The request was rejected due to authentication or authorization issues.",
    };
  }

  // Server errors
  if (
    lower.includes("500") ||
    lower.includes("internal server") ||
    lower.includes("internal error")
  ) {
    return {
      code: "SERVER_ERROR",
      retryable: true,
      suggestions: ["Retry the operation", "Check the MCP server logs"],
      hint: "The server encountered an internal error.",
    };
  }

  // Generic / unknown
  return {
    code: "UNKNOWN_ERROR",
    retryable: false,
    suggestions: [],
    hint: undefined,
  };
}

/**
 * Format a StructuredToolError into a string suitable for tool_result content.
 */
export function formatToolError(error: StructuredToolError): string {
  return JSON.stringify({
    code: error.code,
    message: error.message,
    suggestions: error.suggestions,
    retryable: error.retryable,
    ...(error.hint ? { hint: error.hint } : {}),
  });
}
