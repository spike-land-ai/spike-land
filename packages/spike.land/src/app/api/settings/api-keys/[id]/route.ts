import { auth } from "@/lib/auth";
import { getApiKey, revokeApiKey } from "@/lib/mcp/api-key-manager";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string; }>;
}

import { checkRateLimit } from "@/lib/rate-limiter";
import { getClientIp } from "@/lib/security/ip";
import { tryCatch } from "@/lib/try-catch";
import { logger } from "@/lib/logger";

// Rate limit config: 10 requests per minute per IP
const apiKeysRateLimit = {
  maxRequests: 10,
  windowMs: 60 * 1000, // 1 minute
};

// GET /api/settings/api-keys/[id] - Get a single API key
export async function GET(request: NextRequest, { params }: RouteParams) {
  // Rate limiting by IP address
  const clientIP = getClientIp(request);
  const { data: rateLimitResult, error: rateLimitError } = await tryCatch(
    checkRateLimit(`api_keys_get_id:${clientIP}`, apiKeysRateLimit),
  );

  if (rateLimitError) {
    logger.error("API keys rate limit error:", rateLimitError);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }

  if (rateLimitResult.isLimited) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(
            Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000),
          ),
          "X-RateLimit-Remaining": String(rateLimitResult.remaining),
        },
      },
    );
  }

  const { data: session, error: authError } = await tryCatch(auth());

  if (authError || !session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: paramsData, error: paramsError } = await tryCatch(params);
  if (paramsError) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }
  const { id } = paramsData;

  const { data: apiKey, error: fetchError } = await tryCatch(
    getApiKey(session.user.id, id),
  );

  if (fetchError) {
    logger.error("Failed to fetch API key:", fetchError);
    return NextResponse.json(
      { error: "Failed to fetch API key" },
      { status: 500 },
    );
  }

  if (!apiKey) {
    return NextResponse.json({ error: "API key not found" }, { status: 404 });
  }

  return NextResponse.json({
    apiKey: {
      id: apiKey.id,
      name: apiKey.name,
      keyPrefix: apiKey.keyPrefix,
      lastUsedAt: apiKey.lastUsedAt?.toISOString() || null,
      isActive: apiKey.isActive,
      createdAt: apiKey.createdAt.toISOString(),
    },
  });
}

// DELETE /api/settings/api-keys/[id] - Revoke an API key
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  // Rate limiting by IP address
  const clientIP = getClientIp(request);
  const { data: rateLimitResult, error: rateLimitError } = await tryCatch(
    checkRateLimit(`api_keys_delete_id:${clientIP}`, apiKeysRateLimit),
  );

  if (rateLimitError) {
    logger.error("API keys rate limit error:", rateLimitError);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }

  if (rateLimitResult.isLimited) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(
            Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000),
          ),
          "X-RateLimit-Remaining": String(rateLimitResult.remaining),
        },
      },
    );
  }

  const { data: session, error: authError } = await tryCatch(auth());

  if (authError || !session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: paramsData, error: paramsError } = await tryCatch(params);
  if (paramsError) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }
  const { id } = paramsData;

  const { data: result, error: revokeError } = await tryCatch(
    revokeApiKey(session.user.id, id),
  );

  if (revokeError) {
    logger.error("Failed to revoke API key:", revokeError);
    return NextResponse.json(
      { error: "Failed to revoke API key" },
      { status: 500 },
    );
  }

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    message: "API key revoked successfully",
  });
}
