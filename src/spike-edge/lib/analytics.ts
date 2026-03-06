import type { Env } from "../env.js";

interface AnalyticsEvent {
  readonly index: string;
  readonly blobs?: readonly string[];
  readonly doubles?: readonly number[];
}

/** Write an event to Cloudflare Analytics Engine (fire-and-forget). */
export function writeAnalyticsEvent(env: Env, event: AnalyticsEvent): void {
  if (!env.ANALYTICS) return;
  try {
    env.ANALYTICS.writeDataPoint({
      indexes: [event.index],
      ...(event.blobs ? { blobs: [...event.blobs] } : {}),
      ...(event.doubles ? { doubles: [...event.doubles] } : {}),
    });
  } catch {
    // Analytics is best-effort — never throw
  }
}

/** Track a page view in Analytics Engine. */
export function trackPageView(
  env: Env,
  path: string,
  userAgent: string,
  country: string,
): void {
  writeAnalyticsEvent(env, {
    index: "page_view",
    blobs: [path, userAgent.slice(0, 200), country],
    doubles: [1],
  });
}

/** Track an MCP tool call in Analytics Engine. */
export function trackToolCall(
  env: Env,
  toolName: string,
  durationMs: number,
  success: boolean,
): void {
  writeAnalyticsEvent(env, {
    index: "tool_call",
    blobs: [toolName, success ? "ok" : "error"],
    doubles: [durationMs, success ? 1 : 0],
  });
}
