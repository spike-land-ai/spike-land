import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { checkRateLimit, rateLimitConfigs } from "@/lib/rate-limiter";
import { redis } from "@/lib/upstash/client";
import { triggerGitHubAlert } from "@/lib/404-alert";
import logger from "@/lib/logger";

/** Paths commonly hit by vulnerability scanners — skip logging */
const BOT_PATHS = new Set([
  "/wp-admin",
  "/wp-login.php",
  "/wp-content",
  "/xmlrpc.php",
  "/.env",
  "/.git",
  "/phpmyadmin",
  "/admin.php",
  "/wp-includes",
  "/cgi-bin",
]);

function isBotPath(url: string): boolean {
  const lower = url.toLowerCase();
  return [...BOT_PATHS].some(p => lower.startsWith(p));
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);

  // Rate limit
  const { isLimited } = await checkRateLimit(
    `404log:${ip}`,
    rateLimitConfigs.notFoundLog,
  );
  if (isLimited) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  // Parse body
  let body: { url?: string; referrer?: string; timestamp?: number; };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { url, referrer } = body;

  // Validate
  if (
    !url || typeof url !== "string" || !url.startsWith("/") || url.length > 500
  ) {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  // Skip bot scanner paths
  if (isBotPath(url)) {
    return NextResponse.json({ ok: true });
  }

  // Structured log
  logger.info("404 hit", { route: url, referrer: referrer || "none", ip });

  // Redis increment (fire-and-forget)
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const redisKey = `404:daily:${today}:${encodeURIComponent(url)}`;

  void (async () => {
    try {
      const count = await redis.incr(redisKey);
      // Set TTL only on first increment
      if (count === 1) {
        await redis.expire(redisKey, 48 * 60 * 60); // 48h
      }
      // Trigger alert exactly on count 2
      if (count === 2) {
        await triggerGitHubAlert(url, today);
      }
    } catch (err) {
      logger.error("[404-log] Redis error:", err);
    }
  })();

  return NextResponse.json({ ok: true });
}
