import { classifyInput, validateSlug } from "@/lib/create/slug-classifier";
import { checkRateLimit, rateLimitConfigs } from "@/lib/rate-limiter";
import { tryCatch } from "@/lib/try-catch";
import { NextResponse } from "next/server";

function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  return `classify:${ip}`;
}

function naiveFallbackSlug(input: string): string {
  const slug = input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-/]/g, "");
  return validateSlug(slug);
}

export async function POST(request: Request) {
  // Rate limiting
  const identifier = getClientIdentifier(request);
  const { data: rateResult, error: rateError } = await tryCatch(
    checkRateLimit(identifier, rateLimitConfigs.slugClassify),
  );

  if (rateError) {
    // Rate limit check failed — don't block the user
  } else if (rateResult.isLimited) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(
            Math.ceil((rateResult.resetAt - Date.now()) / 1000),
          ),
        },
      },
    );
  }

  // Parse request body
  const { data: body, error: parseError } = await tryCatch(request.json());

  if (parseError || !body || typeof body.input !== "string") {
    return NextResponse.json(
      { error: "Request body must include an 'input' string field" },
      { status: 400 },
    );
  }

  const input = body.input as string;

  if (input.length > 2000) {
    return NextResponse.json(
      { error: "Input must be 2000 characters or fewer" },
      { status: 400 },
    );
  }

  // Classify
  const { data: result, error: classifyError } = await tryCatch(
    classifyInput(input),
  );

  if (classifyError) {
    // Never block the user due to classification errors — return naive fallback
    return NextResponse.json({
      status: "ok",
      slug: naiveFallbackSlug(input),
      category: "",
      reason: null,
    });
  }

  return NextResponse.json(result);
}
