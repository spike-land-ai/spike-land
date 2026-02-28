import { broadcastToCodespace } from "@/lib/codespace/broadcast";
import { CORS_HEADERS, corsOptions } from "@/lib/codespace/cors";
import { getSession, updateSession } from "@/lib/codespace/session-service";

import { tryCatch } from "@/lib/try-catch";
import { type NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

interface UpdateRequestBody {
  code: string;
  transpiled?: string;
  html?: string;
  css?: string;
  expectedHash: string;
}

/**
 * POST /api/codespace/[codeSpace]/update
 *
 * Accept a session update with optimistic locking.
 * On success, broadcasts the change to all SSE clients.
 * On hash mismatch, returns 409 with the current hash.
 *
 * Public (no auth) to match the original Cloudflare Worker behavior.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ codeSpace: string; }>; },
) {
  const { data: params, error: paramsError } = await tryCatch(context.params);
  if (paramsError) {
    return NextResponse.json(
      { error: "Invalid parameters" },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const { codeSpace } = params;

  // Parse request body
  const { data: body, error: bodyError } = await tryCatch(
    request.json() as Promise<UpdateRequestBody>,
  );

  if (bodyError || !body) {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  // Validate required fields
  if (!body.code || !body.expectedHash) {
    return NextResponse.json(
      { error: "Missing required fields: code, expectedHash" },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  // Get current session to fill in optional fields
  const { data: currentSession, error: getError } = await tryCatch(
    getSession(codeSpace),
  );

  if (getError) {
    logger.error(
      `[Codespace Update] Failed to get session for "${codeSpace}":`,
      getError,
    );
    return NextResponse.json(
      { error: "Failed to retrieve current session" },
      { status: 500, headers: CORS_HEADERS },
    );
  }

  // Build the update data, using current values as fallbacks for optional fields
  const updateData = {
    codeSpace,
    code: body.code,
    transpiled: body.transpiled ?? currentSession?.transpiled ?? "",
    html: body.html ?? currentSession?.html ?? "",
    css: body.css ?? currentSession?.css ?? "",
    messages: currentSession?.messages || [],
    requiresReRender: currentSession?.requiresReRender,
  };

  // Attempt optimistic lock update
  const { data: updateResult, error: unexpectedError } = await tryCatch(
    updateSession(codeSpace, updateData, body.expectedHash),
  );

  if (unexpectedError) {
    logger.error(
      `[Codespace Update] Unexpected error for "${codeSpace}":`,
      unexpectedError,
    );
    return NextResponse.json(
      { error: "Failed to update session" },
      { status: 500, headers: CORS_HEADERS },
    );
  }

  if (!updateResult.success) {
    // Handle optimistic lock conflict
    if (updateResult.error === "Conflict: Hash mismatch") {
      const session = updateResult.session;
      return NextResponse.json(
        {
          error: "Conflict: session was modified by another client",
          currentHash: session?.hash,
          expectedHash: body.expectedHash,
        },
        { status: 409, headers: CORS_HEADERS },
      );
    }

    return NextResponse.json(
      { error: updateResult.error || "Failed to update session" },
      { status: 500, headers: CORS_HEADERS },
    );
  }

  const updatedSession = updateResult.session!;

  // Broadcast the update to all SSE clients (local + Redis)
  broadcastToCodespace(codeSpace, {
    type: "session_update",
    data: {
      hash: updatedSession.hash,
      code: updatedSession.code,
      transpiled: updatedSession.transpiled,
      html: updatedSession.html,
      css: updatedSession.css,
    },
  }).catch(err => {
    logger.error(
      `[Codespace Update] Failed to broadcast update for "${codeSpace}":`,
      err,
    );
  });

  return NextResponse.json(
    { success: true, hash: updatedSession.hash },
    { headers: CORS_HEADERS },
  );
}

export function OPTIONS() {
  return corsOptions();
}
