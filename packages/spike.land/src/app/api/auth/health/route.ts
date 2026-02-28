import { type NextRequest, NextResponse } from "next/server";

interface AuthHealthResponse {
  status: "ok" | "degraded";
  providers: {
    github: boolean;
    google: boolean;
    apple: boolean;
    facebook: boolean;
  };
  checks: {
    database: "connected" | "unreachable" | "timeout";
    redis: "connected" | "unreachable" | "not_configured";
  };
  config: {
    registrationOpen: boolean;
    emailConfigured: boolean;
  };
}

const DB_TIMEOUT_MS = 3000;
const REDIS_TIMEOUT_MS = 2000;

async function checkDatabase(): Promise<"connected" | "unreachable" | "timeout"> {
  try {
    const prisma = (await import("@/lib/prisma")).default;
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), DB_TIMEOUT_MS)
      ),
    ]);
    return "connected";
  } catch (err) {
    if (err instanceof Error && err.message === "timeout") {
      return "timeout";
    }
    return "unreachable";
  }
}

async function checkRedis(): Promise<"connected" | "unreachable" | "not_configured"> {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    return "not_configured";
  }

  try {
    const { redis } = await import("@/lib/upstash/client");
    await Promise.race([
      redis.ping(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), REDIS_TIMEOUT_MS)
      ),
    ]);
    return "connected";
  } catch {
    return "unreachable";
  }
}

/**
 * Auth provider health check endpoint.
 * Public GET — no auth required. Does not expose secrets, only boolean status.
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  const [dbStatus, redisStatus] = await Promise.all([
    checkDatabase(),
    checkRedis(),
  ]);

  const response: AuthHealthResponse = {
    status: dbStatus === "connected" ? "ok" : "degraded",
    providers: {
      github: Boolean(process.env.GITHUB_ID && process.env.GITHUB_SECRET),
      google: Boolean(process.env.GOOGLE_ID && process.env.GOOGLE_SECRET),
      apple: Boolean(process.env.AUTH_APPLE_ID && process.env.AUTH_APPLE_TEAM_ID),
      facebook: Boolean(process.env.AUTH_FACEBOOK_ID && process.env.AUTH_FACEBOOK_SECRET),
    },
    checks: {
      database: dbStatus,
      redis: redisStatus,
    },
    config: {
      registrationOpen: process.env.REGISTRATION_OPEN === "true",
      emailConfigured: Boolean(process.env.EMAIL_FROM),
    },
  };

  const httpStatus = response.status === "ok" ? 200 : 503;
  return NextResponse.json(response, { status: httpStatus });
}
