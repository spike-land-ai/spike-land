import * as Sentry from "@sentry/browser";

const TRACE_PROPAGATION_TARGETS = [
  "localhost",
  /^https:\/\/(spike\.land|www\.spike\.land|edge\.spike\.land|api\.spike\.land|auth-mcp\.spike\.land|mcp\.spike\.land)(\/|$)/,
] as const;

export function initBrowserSentry(): void {
  const dsn = import.meta.env.PUBLIC_SENTRY_DSN;
  if (!dsn || Sentry.isEnabled()) {
    return;
  }

  Sentry.init({
    dsn,
    environment:
      import.meta.env.PUBLIC_SENTRY_ENVIRONMENT ??
      (import.meta.env.PROD ? "production" : "development"),
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 0.1,
    tracePropagationTargets: [...TRACE_PROPAGATION_TARGETS],
    ignoreErrors: [
      /^ResizeObserver loop limit exceeded$/i,
      /^ResizeObserver loop completed with undelivered notifications$/i,
    ],
  });
}
