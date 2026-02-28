import { auth } from "@/lib/auth";
import {
  getClaudeClient,
  isAuthError,
  isTransientError,
  resetClaudeClient,
} from "@/lib/ai/claude-client";
import type { ClaudeModel } from "@/lib/create/agent-client";
import { tryCatch } from "@/lib/try-catch";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const MODEL_MAP: Record<ClaudeModel, string> = {
  opus: "claude-opus-4-6",
  sonnet: "claude-sonnet-4-6",
  haiku: "claude-haiku-4-5-20251001",
};

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  const { data: session, error: authError } = await tryCatch(auth());

  if (authError || !session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", reason: "session_required" },
      { status: 401 },
    );
  }

  const { data: body, error: jsonError } = await tryCatch(request.json());
  if (jsonError) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { messages, model, system, maxTokens } = body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: "messages must be a non-empty array" },
      { status: 400 },
    );
  }

  const resolvedModel = MODEL_MAP[(model as ClaudeModel) ?? "sonnet"]
    ?? MODEL_MAP.sonnet;
  const anthropic = await getClaudeClient();

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const streamMessages = async (
        client: Awaited<ReturnType<typeof getClaudeClient>>,
      ) => {
        const messageStream = client.messages.stream({
          model: resolvedModel,
          max_tokens: maxTokens ?? 16384,
          ...(system ? { system } : {}),
          messages,
        });

        for await (const event of messageStream) {
          if (
            event.type === "content_block_delta"
            && event.delta.type === "text_delta"
          ) {
            const data = JSON.stringify({
              type: "text",
              text: event.delta.text,
            });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }
        }

        const finalMessage = await messageStream.finalMessage();
        const doneData = JSON.stringify({
          type: "done",
          usage: {
            input_tokens: finalMessage.usage.input_tokens,
            output_tokens: finalMessage.usage.output_tokens,
          },
        });
        controller.enqueue(encoder.encode(`data: ${doneData}\n\n`));
        controller.close();
      };

      try {
        await streamMessages(anthropic);
      } catch (error) {
        // Retry once on auth or transient errors with a fresh client
        if (isAuthError(error) || isTransientError(error)) {
          resetClaudeClient();
          try {
            const freshClient = await getClaudeClient();
            await streamMessages(freshClient);
            return;
          } catch {
            // Fall through to error response
          }
        }
        const errData = JSON.stringify({
          type: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        });
        controller.enqueue(encoder.encode(`data: ${errData}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
