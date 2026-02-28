import { handlers } from "@/auth";
import { logger } from "@/lib/errors/structured-logger";
import { type NextRequest, NextResponse } from "next/server";

export const { GET } = handlers;

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";

  // NextAuth expects form-encoded data (application/x-www-form-urlencoded).
  // Reject other content types early to avoid FormData parse errors.
  if (
    !contentType.includes("application/x-www-form-urlencoded")
    && !contentType.includes("multipart/form-data")
  ) {
    return NextResponse.json(
      { error: "Unsupported Content-Type" },
      { status: 415 },
    );
  }

  try {
    return await handlers.POST(request);
  } catch (error: unknown) {
    // Catch FormData parse errors from malformed request bodies.
    // This prevents unhandled exceptions from reaching error tracking for
    // requests where the Content-Type header claims form data but
    // the body is malformed or missing the multipart boundary.
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("FormData") || message.includes("boundary")) {
      logger.warn("Malformed form body in auth POST", {
        route: "/api/auth",
        contentType,
        error: message,
      });
      return NextResponse.json(
        { error: "Malformed request body" },
        { status: 400 },
      );
    }
    throw error;
  }
}
