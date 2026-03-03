import { Hono } from "hono";
import type { Env } from "../env.js";
import { getClientId, sendGA4Events } from "../lib/ga4.js";
import type { GA4Event } from "../lib/ga4.js";

const analytics = new Hono<{ Bindings: Env }>();

// Simple in-memory rate limiter — no Durable Object overhead.
// Map<clientIp, { count, windowStart }>
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX_REQUESTS = 10; // 10 analytics POSTs per minute per IP

function isRateLimited(clientIp: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(clientIp);

  if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
    rateLimitMap.set(clientIp, { count: 1, windowStart: now });
    return false;
  }

  entry.count++;
  if (entry.count > RATE_MAX_REQUESTS) {
    return true;
  }
  return false;
}

// Periodically clean stale entries to prevent unbounded growth
let lastCleanup = Date.now();
function maybeCleanup() {
  const now = Date.now();
  if (now - lastCleanup < RATE_WINDOW_MS * 2) return;
  lastCleanup = now;
  for (const [ip, entry] of rateLimitMap) {
    if (now - entry.windowStart > RATE_WINDOW_MS * 2) {
      rateLimitMap.delete(ip);
    }
  }
}

interface AnalyticsEvent {
  source: string;
  eventType: string;
  metadata?: Record<string, unknown>;
}

function isValidEvent(event: unknown): event is AnalyticsEvent {
  if (typeof event !== "object" || event === null) return false;
  const e = event as Record<string, unknown>;
  return typeof e.source === "string" && typeof e.eventType === "string";
}

analytics.post("/analytics/ingest", async (c) => {
  const clientIp = c.req.header("cf-connecting-ip") ?? "unknown";

  maybeCleanup();

  if (isRateLimited(clientIp)) {
    return c.json({ error: "Rate limited", retryAfter: 60 }, 429);
  }

  const body = await c.req.json<unknown>();
  if (!Array.isArray(body)) {
    return c.json({ error: "Request body must be an array of events" }, 400);
  }

  const events = body.filter(isValidEvent);
  if (events.length === 0) {
    return c.json({ error: "No valid events in batch" }, 400);
  }

  // Convert to GA4 events and forward in background
  const ga4Events: GA4Event[] = events.map((event) => {
    const params: Record<string, string | number | boolean> = {
      event_source: event.source,
    };
    if (event.metadata) {
      for (const [key, value] of Object.entries(event.metadata)) {
        if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
          params[key] = value;
        }
      }
    }
    return { name: event.eventType, params };
  });

  const ga4Promise = getClientId(c.req.raw).then((clientId) =>
    sendGA4Events(c.env, clientId, ga4Events)
  );
  c.executionCtx.waitUntil(ga4Promise);

  return c.json({ accepted: events.length });
});

export { analytics };
