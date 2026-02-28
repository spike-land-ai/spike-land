import { BAZDMEG_SYSTEM_PROMPT } from "@/lib/bazdmeg/system-prompt";
import { extractAndSaveInsight } from "@/lib/bazdmeg/extract-insight";
import { createClaudeChatStream } from "@/lib/chat/claude-chat-stream";
import { getClientIp } from "@/lib/rate-limit-presets";
import { checkRateLimit } from "@/lib/rate-limiter";
import { tryCatch } from "@/lib/try-catch";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  // Rate limit by IP (public endpoint, no auth required)
  const ip = getClientIp(request);
  const { isLimited } = await checkRateLimit(`bazdmeg:chat:${ip}`, {
    maxRequests: 10,
    windowMs: 60000,
  });

  if (isLimited) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429 },
    );
  }

  const { data: body, error: jsonError } = await tryCatch(request.json());
  if (jsonError) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { question, sessionId } = body as {
    question?: string;
    sessionId?: string;
  };

  if (
    !question || typeof question !== "string" || question.trim().length === 0
  ) {
    return NextResponse.json(
      { error: "question is required" },
      { status: 400 },
    );
  }

  if (question.length > 2000) {
    return NextResponse.json(
      { error: "Question too long (max 2000 characters)" },
      { status: 400 },
    );
  }

  const stream = createClaudeChatStream({
    question: question.trim(),
    systemPrompt: BAZDMEG_SYSTEM_PROMPT,
    onComplete: (fullAnswer, usage) => {
      saveMessage({
        sessionId: sessionId || "anonymous",
        question: question.trim(),
        answer: fullAnswer,
        inputTokens: usage.input_tokens,
        outputTokens: usage.output_tokens,
      }).catch((err: unknown) => logger.error("Failed to save chat message:", err));

      extractAndSaveInsight({
        question: question.trim(),
        answer: fullAnswer,
      }).catch((err: unknown) => logger.error("Failed to extract insight:", err));
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

/** Fire-and-forget: persist chat message to database */
async function saveMessage(data: {
  sessionId: string;
  question: string;
  answer: string;
  inputTokens: number;
  outputTokens: number;
}) {
  const prisma = (await import("@/lib/prisma")).default;

  await prisma.bazdmegChatMessage.create({
    data: {
      sessionId: data.sessionId,
      question: data.question,
      answer: data.answer,
      model: "claude-haiku-4-5",
      inputTokens: data.inputTokens,
      outputTokens: data.outputTokens,
    },
  });
}

/** GET: return chat stats (message count) */
export async function GET() {
  const prisma = (await import("@/lib/prisma")).default;
  const count = await prisma.bazdmegChatMessage.count();
  return NextResponse.json({ totalQuestions: count });
}
