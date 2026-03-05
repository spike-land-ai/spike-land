import { Hono } from "hono";
import type { Env } from "../env.js";
import { createRateLimiter } from "../lib/in-memory-rate-limiter.js";

const errors = new Hono<{ Bindings: Env }>();

const isRateLimited = createRateLimiter({ windowMs: 60_000, maxRequests: 10 });

const MAX_STRING = 1024;
const MAX_STACK = 8192;
const MAX_METADATA = 4096;
const MAX_BATCH = 50;

interface ErrorLogEntry {
  service_name: string;
  error_code?: string;
  message: string;
  stack_trace?: string;
  metadata?: Record<string, unknown>;
  severity?: string;
}

function isValidErrorLog(e: unknown): e is ErrorLogEntry {
  if (typeof e !== "object" || e === null) return false;
  const obj = e as Record<string, unknown>;
  return (
    typeof obj.service_name === "string" &&
    obj.service_name.length <= MAX_STRING &&
    typeof obj.message === "string" &&
    obj.message.length <= MAX_STRING &&
    (obj.error_code === undefined || (typeof obj.error_code === "string" && obj.error_code.length <= MAX_STRING)) &&
    (obj.stack_trace === undefined || (typeof obj.stack_trace === "string" && obj.stack_trace.length <= MAX_STACK))
  );
}

function truncate(value: string, max: number): string {
  return value.length > max ? value.slice(0, max) : value;
}

const VALID_SEVERITIES = new Set(["warning", "error", "fatal"]);

/** POST /errors/ingest — batch insert error logs from any service. */
errors.post("/errors/ingest", async (c) => {
  const clientIp = c.req.header("cf-connecting-ip") ?? "unknown";
  if (isRateLimited(clientIp)) {
    return c.json({ error: "Rate limited", retryAfter: 60 }, 429);
  }

  const body = await c.req.json<unknown>();
  if (!Array.isArray(body)) {
    return c.json({ error: "Request body must be an array of error logs" }, 400);
  }

  if (body.length > MAX_BATCH) {
    return c.json({ error: `Batch size exceeds maximum of ${MAX_BATCH}` }, 400);
  }

  const entries = body.filter(isValidErrorLog);
  if (entries.length === 0) {
    return c.json({ error: "No valid error logs in batch" }, 400);
  }

  const stmt = c.env.DB.prepare(
    "INSERT INTO error_logs (service_name, error_code, message, stack_trace, metadata, client_id, severity) VALUES (?, ?, ?, ?, ?, ?, ?)",
  );

  const batch = entries.map((e) => {
    const metadataStr = e.metadata ? truncate(JSON.stringify(e.metadata), MAX_METADATA) : null;
    return stmt.bind(
      truncate(e.service_name, MAX_STRING),
      e.error_code ? truncate(e.error_code, MAX_STRING) : null,
      truncate(e.message, MAX_STRING),
      e.stack_trace ? truncate(e.stack_trace, MAX_STACK) : null,
      metadataStr,
      clientIp,
      VALID_SEVERITIES.has(e.severity ?? "") ? e.severity! : "error",
    );
  });

  const work = c.env.DB.batch(batch);
  try {
    c.executionCtx.waitUntil(work);
  } catch {
    await work;
  }

  return c.json({ accepted: entries.length });
});

/** GET /errors — list recent errors (internal/admin). */
errors.get("/errors", async (c) => {
  const service = c.req.query("service");
  const limit = Math.min(parseInt(c.req.query("limit") ?? "50", 10), 200);
  const range = c.req.query("range") ?? "24h";

  const rangeMs: Record<string, number> = {
    "1h": 3_600_000,
    "24h": 86_400_000,
    "7d": 604_800_000,
  };
  const cutoff = Date.now() - (rangeMs[range] ?? 86_400_000);

  let query = "SELECT * FROM error_logs WHERE created_at >= ?";
  const params: (string | number)[] = [cutoff];

  if (service) {
    query += " AND service_name = ?";
    params.push(service);
  }

  query += " ORDER BY created_at DESC LIMIT ?";
  params.push(limit);

  const result = await c.env.DB.prepare(query).bind(...params).all();
  return c.json(result.results);
});

/** GET /errors/summary — aggregated error stats for cockpit dashboard. */
errors.get("/errors/summary", async (c) => {
  const range = c.req.query("range") ?? "24h";
  const rangeMs: Record<string, number> = {
    "1h": 3_600_000,
    "24h": 86_400_000,
    "7d": 604_800_000,
  };
  const cutoff = Date.now() - (rangeMs[range] ?? 86_400_000);

  const [countResult, topCodes] = await Promise.all([
    c.env.DB.prepare(
      "SELECT COUNT(*) as total FROM error_logs WHERE created_at >= ?",
    ).bind(cutoff).first<{ total: number }>(),
    c.env.DB.prepare(
      "SELECT error_code, COUNT(*) as count FROM error_logs WHERE created_at >= ? GROUP BY error_code ORDER BY count DESC LIMIT 5",
    ).bind(cutoff).all<{ error_code: string; count: number }>(),
  ]);

  return c.json({
    total: countResult?.total ?? 0,
    topCodes: topCodes.results ?? [],
    range,
  });
});

export { errors };
