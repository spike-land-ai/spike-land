import logger from "@/lib/logger";

import { isClaudeConfigured } from "@/lib/ai/claude-client";
import { CORS_HEADERS, corsOptions } from "@/lib/codespace/cors";
import { getOrCreateSession } from "@/lib/codespace/session-service";
import { tryCatch } from "@/lib/try-catch";
import type { NextRequest } from "next/server";

import {
  buildSystemPrompt,
  type ChatRequestBody,
  DEFAULT_MODEL,
  streamCodespaceChat,
  validateMessages,
} from "@/lib/codespace/chat-service";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export const maxDuration = 120; // 2 minutes for streaming responses

// ---------------------------------------------------------------------------
// POST /api/codespace/[codeSpace]/chat
// ---------------------------------------------------------------------------

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ codeSpace: string; }>; },
) {
  const requestId = crypto.randomUUID().slice(0, 8);

  // Resolve route params
  const { data: params, error: paramsError } = await tryCatch(context.params);
  if (paramsError) {
    return Response.json(
      { error: "Invalid route parameters" },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const { codeSpace } = params;

  // Check Claude is configured
  if (!(await isClaudeConfigured())) {
    return Response.json(
      {
        error: "Claude API not configured. Set CLAUDE_CODE_OAUTH_TOKEN.",
      },
      { status: 503, headers: CORS_HEADERS },
    );
  }

  // Parse request body
  const { data: body, error: bodyError } = await tryCatch(
    request.json() as Promise<ChatRequestBody>,
  );
  if (bodyError) {
    return Response.json(
      { error: "Invalid JSON body" },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  // Validate messages
  const validation = validateMessages(body.messages);
  if (!validation.valid) {
    return Response.json(
      { error: validation.error },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const messages = validation.messages;
  const model = body.model || DEFAULT_MODEL;

  // Load the current codespace session for context
  const { data: session, error: sessionError } = await tryCatch(
    getOrCreateSession(codeSpace),
  );
  if (sessionError) {
    logger.error(
      `[chat][${requestId}] Failed to load session for "${codeSpace}":`,
      sessionError,
    );
    return Response.json(
      { error: "Failed to load codespace session" },
      { status: 500, headers: CORS_HEADERS },
    );
  }

  const systemPrompt = buildSystemPrompt(codeSpace, session.code);

  logger.info(
    `[chat][${requestId}] Starting chat for codeSpace="${codeSpace}" model=${model} messages=${messages.length}`,
  );

  // Build the SSE stream utilizing the new extracted service
  const stream = streamCodespaceChat(
    codeSpace,
    model,
    messages,
    requestId,
    systemPrompt,
  );

  return new Response(stream, {
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

// ---------------------------------------------------------------------------
// OPTIONS (CORS preflight)
// ---------------------------------------------------------------------------

export function OPTIONS() {
  return corsOptions();
}
