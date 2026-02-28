import { auth } from "@/lib/auth";
import { logger } from "@/lib/errors/structured-logger";
import { checkRateLimit, rateLimitConfigs } from "@/lib/rate-limiter";
import { tryCatch } from "@/lib/try-catch";
import {
  appCreationSchema,
  appPromptCreationSchema,
} from "@/lib/validations/app";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  createAppFromPrompt,
  createLegacyApp,
  ensureUserExists,
  getApps,
} from "@/lib/apps/apps-service";

export async function POST(request: NextRequest) {
  const { data: session, error: authError } = await tryCatch(auth());

  if (authError || !session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { success: userExists, userId } = await ensureUserExists(session);
  if (!userExists) {
    logger.error("Failed to ensure user exists for app creation", undefined, {
      route: "/api/apps",
    });
    return NextResponse.json(
      {
        error: "User account not properly initialized. Please sign out and sign in again.",
      },
      { status: 500 },
    );
  }

  const { data: rateLimit, error: rateLimitError } = await tryCatch(
    checkRateLimit(`app_creation:${userId}`, rateLimitConfigs.appCreation),
  );

  if (rateLimitError) {
    logger.error(
      "Rate limit check failed",
      rateLimitError instanceof Error ? rateLimitError : undefined,
      { route: "/api/apps" },
    );
    return NextResponse.json({ error: "Internal server error" }, {
      status: 500,
    });
  }

  if (rateLimit.isLimited) {
    const retryAfterSeconds = Math.ceil(
      (rateLimit.resetAt - Date.now()) / 1000,
    );
    const retryAfterHours = Math.ceil(retryAfterSeconds / 3600);
    return NextResponse.json(
      {
        error:
          `Daily app creation limit reached (20 apps per day). Try again in ${retryAfterHours} hours.`,
      },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
    );
  }

  const { data: body, error: jsonError } = await tryCatch(request.json());
  if (jsonError) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const promptResult = appPromptCreationSchema.safeParse(body);
  if (promptResult.success) {
    const res = await createAppFromPrompt(userId, promptResult.data);
    if (res.error) {
      return NextResponse.json({ error: res.error }, { status: res.status });
    }
    return NextResponse.json(res.data, { status: 201 });
  }

  const parseResult = appCreationSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json({
      error: "Validation error",
      details: parseResult.error.issues,
    }, { status: 400 });
  }

  const res = await createLegacyApp(userId, parseResult.data);
  if (res.error) {
    return NextResponse.json({ error: res.error }, { status: res.status });
  }

  return NextResponse.json(res.data, { status: 201 });
}

export async function GET(request: NextRequest) {
  const { data: session, error: authError } = await tryCatch(auth());
  if (authError || !session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const showCurated = searchParams.get("curated") === "true";

  const res = await getApps(session.user.id, showCurated);
  if (res.error) {
    return NextResponse.json({ error: res.error }, { status: res.status });
  }
  return NextResponse.json(res.data);
}
