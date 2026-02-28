"use server";

import { logger } from "@/lib/errors/structured-logger";
import { tryCatch } from "@/lib/try-catch";
import { headers } from "next/headers";

/**
 * Server action to log authentication errors.
 * Called from the client-side error page to capture error details.
 */
export async function logAuthError(errorCode: string | null): Promise<void> {
  const { data: headersList, error } = await tryCatch(headers());

  // Log with defaults if headers unavailable (E2E/Docker environments)
  const userAgent = error || !headersList
    ? "unavailable"
    : (headersList.get("user-agent") || "unknown");
  const referer = error || !headersList
    ? "unavailable"
    : (headersList.get("referer") || "unknown");

  logger.error("Auth error displayed to user", undefined, {
    errorCode: errorCode || "unknown",
    route: "/auth/error",
    userAgent,
    referer,
  });
}
