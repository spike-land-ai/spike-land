import { auth } from "@/lib/auth";
import { checkRateLimit, rateLimitConfigs } from "@/lib/rate-limiter";
import { tryCatch } from "@/lib/try-catch";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

/**
 * POST /api/images/fetch-base64
 *
 * Fetches an image from a URL and returns it as base64.
 * Used to bypass CORS restrictions when fetching images for blending.
 *
 * Request body:
 * - url: string - URL of the image to fetch
 *
 * Response:
 * - Success: { base64: string, mimeType: string }
 * - Error: JSON with error message
 */
export async function POST(request: NextRequest) {
  // Authenticate user
  const { data: session, error: authError } = await tryCatch(auth());
  if (authError) {
    logger.error("Error in fetch-base64 API:", authError);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 },
    );
  }
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limiting
  const { data: rateLimitResult, error: rateLimitError } = await tryCatch(
    checkRateLimit(`fetch-base64:${session.user.id}`, rateLimitConfigs.general),
  );

  if (rateLimitError) {
    logger.error("Error in fetch-base64 API:", rateLimitError);
    return NextResponse.json(
      { error: "Rate limit check failed" },
      { status: 500 },
    );
  }

  if (rateLimitResult.isLimited) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: {
          "Retry-After": String(
            Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000),
          ),
        },
      },
    );
  }

  // Parse request body
  const { data: body, error: parseError } = await tryCatch(request.json());
  if (parseError) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  const { url } = body as { url: string; };

  if (!url || typeof url !== "string") {
    return NextResponse.json(
      { error: "Missing or invalid url" },
      { status: 400 },
    );
  }

  // Validate URL - only allow our R2 bucket and internal URLs
  const allowedDomains = [
    "pub-cf0adddb5752426a96ef090997e0da95.r2.dev",
    "spike.land",
  ];

  try {
    const parsedUrl = new URL(url);
    // Security: Strict domain check to prevent SSRF
    // Ensure hostname is exactly the domain or a subdomain (ends with .domain)
    // Previous check `hostname.endsWith(domain)` was vulnerable to `evilspike.land`
    if (parsedUrl.protocol !== "https:") {
      return NextResponse.json(
        { error: "Only HTTPS URLs are allowed" },
        { status: 400 },
      );
    }

    if (
      !allowedDomains.some(
        domain =>
          parsedUrl.hostname === domain
          || parsedUrl.hostname.endsWith("." + domain),
      )
    ) {
      return NextResponse.json(
        { error: "URL domain not allowed" },
        { status: 400 },
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Invalid URL format" },
      { status: 400 },
    );
  }

  // Fetch the image
  const { data: response, error: fetchError } = await tryCatch(
    fetch(url, {
      headers: {
        "Accept": "image/*",
      },
    }),
  );

  if (fetchError || !response) {
    logger.error("Error fetching image:", fetchError);
    return NextResponse.json(
      { error: "Failed to fetch image" },
      { status: 500 },
    );
  }

  if (!response.ok) {
    return NextResponse.json(
      { error: `Image fetch failed with status ${response.status}` },
      { status: 502 },
    );
  }

  // Get content type
  const contentType = response.headers.get("content-type") || "image/jpeg";

  // Read as array buffer and convert to base64
  const { data: arrayBuffer, error: bufferError } = await tryCatch(
    response.arrayBuffer(),
  );

  if (bufferError || !arrayBuffer) {
    logger.error("Error reading image buffer:", bufferError);
    return NextResponse.json(
      { error: "Failed to read image data" },
      { status: 500 },
    );
  }

  // Convert to base64
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  return NextResponse.json({
    base64,
    mimeType: contentType,
  });
}
