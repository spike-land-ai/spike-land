import { auth } from "@/lib/auth";
import { getScriptedResponse, isBot } from "@/lib/chat/bot-detection";
import { createClaudeChatStream } from "@/lib/chat/claude-chat-stream";
import { createGeminiChatStream } from "@/lib/chat/gemini-chat-stream";
import { getAgentChatConfig } from "@/lib/chat/agent-system-prompt";
import { isClaudeConfigured } from "@/lib/ai/claude-client";
import { isGeminiConfigured } from "@/lib/ai/gemini-client";
import { getClientIp } from "@/lib/rate-limit-presets";
import { checkRateLimit } from "@/lib/rate-limiter";
import {
  createGatewayTransport,
  isGatewayConfigured,
} from "@/lib/openclaw/http-transport";
import { tryCatch } from "@/lib/try-catch";
import logger from "@/lib/logger";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const maxDuration = 60;

const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  Connection: "keep-alive",
} as const;

export async function POST(request: NextRequest) {
  const userAgent = request.headers.get("user-agent");

  // Bot detection: return scripted response
  if (isBot(userAgent)) {
    const { data: body } = await tryCatch(request.json());
    const route = (body as { route?: string; })?.route || "/";
    return NextResponse.json({
      type: "scripted",
      content: getScriptedResponse(route),
    });
  }

  // Auth check (optional — anonymous users allowed)
  const session = await auth();
  const isAuthenticated = !!session;

  // Rate limit by IP — higher limits for authenticated users
  const ip = getClientIp(request);
  const rateLimitConfig = isAuthenticated
    ? { maxRequests: 30, windowMs: 60000 }
    : { maxRequests: 10, windowMs: 60000 };

  const { isLimited } = await checkRateLimit(
    `agent-chat:${ip}`,
    rateLimitConfig,
  );

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

  const { question, sessionId, route, pageTitle } = body as {
    question?: string;
    sessionId?: string;
    route?: string;
    pageTitle?: string;
  };

  if (
    !question
    || typeof question !== "string"
    || question.trim().length === 0
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

  // Check if MCP agent is active for agent-chat
  const { isMcpAgentActive } = await import("@/lib/upstash/client");
  const mcpActive = await isMcpAgentActive("site-chat");

  if (mcpActive) {
    // Save the question with null answer for the MCP agent to pick up
    const prisma = (await import("@/lib/prisma")).default;
    await prisma.bazdmegChatMessage.create({
      data: {
        sessionId: sessionId || "anonymous",
        question: question.trim(),
        answer: null,
        model: "pending",
        inputTokens: 0,
        outputTokens: 0,
        route: route || "/",
      },
    });

    // Return an SSE response indicating the agent will respond
    const encoder = new TextEncoder();
    const mcpStream = new ReadableStream({
      start(controller) {
        const textEvent = JSON.stringify({
          type: "text",
          text: "Your message has been received. The agent will respond shortly.",
        });
        controller.enqueue(encoder.encode(`data: ${textEvent}\n\n`));
        const doneEvent = JSON.stringify({
          type: "done",
          usage: { input_tokens: 0, output_tokens: 0 },
        });
        controller.enqueue(encoder.encode(`data: ${doneEvent}\n\n`));
        controller.close();
      },
    });

    return new Response(mcpStream, { headers: SSE_HEADERS });
  }

  const chatConfig = getAgentChatConfig(route || "/", isAuthenticated);
  const trimmedQuestion = question.trim();
  const sid = sessionId || "anonymous";
  const routeStr = route || "/";

  // Try OpenClaw gateway first, fall back to Claude, then Gemini
  if (isGatewayConfigured() && sid !== "anonymous") {
    const gatewayStream = await tryGatewayStream({
      question: trimmedQuestion,
      sessionId: sid,
      route: routeStr,
      pageTitle,
      isAuthenticated,
      userName: session?.user?.name || undefined,
    });

    if (gatewayStream) {
      return new Response(gatewayStream, { headers: SSE_HEADERS });
    }
    logger.warn("OpenClaw gateway failed, falling back to Claude/Gemini");
  }

  // Try Gemini first (more reliable), then Claude as fallback
  const geminiAvailable = await isGeminiConfigured();
  if (geminiAvailable) {
    const stream = createGeminiChatStream({
      question: trimmedQuestion,
      systemPrompt: chatConfig.systemPrompt,
      onComplete: fullAnswer => {
        saveMessage({
          sessionId: sid,
          question: trimmedQuestion,
          answer: fullAnswer,
          inputTokens: 0,
          outputTokens: 0,
          route: routeStr,
          agentModel: "gemini-flash",
        }).catch((err: unknown) => logger.error("Failed to save chat message:", err));
      },
    });

    return new Response(stream, { headers: SSE_HEADERS });
  }

  // Claude fallback when Gemini is not configured
  const claudeAvailable = await isClaudeConfigured();
  if (claudeAvailable) {
    const stream = createClaudeChatStream({
      question: trimmedQuestion,
      systemPrompt: chatConfig.systemPrompt,
      onComplete: (fullAnswer, usage) => {
        saveMessage({
          sessionId: sid,
          question: trimmedQuestion,
          answer: fullAnswer,
          inputTokens: usage.input_tokens,
          outputTokens: usage.output_tokens,
          route: routeStr,
          agentModel: null,
        }).catch((err: unknown) => logger.error("Failed to save chat message:", err));
      },
    });

    return new Response(stream, { headers: SSE_HEADERS });
  }

  // No AI provider available at all
  logger.error("No AI provider configured for agent-chat");
  return NextResponse.json(
    { error: "Chat is temporarily unavailable. Please try again later." },
    { status: 503 },
  );
}

interface GatewayStreamParams {
  question: string;
  sessionId: string;
  route: string;
  pageTitle?: string;
  isAuthenticated: boolean;
  userName?: string;
}

type ChatSendResult = {
  message?: { content?: Array<{ type: string; text?: string; }>; };
};

async function tryGatewayStream(
  params: GatewayStreamParams,
): Promise<ReadableStream | null> {
  try {
    const transport = createGatewayTransport();

    // Call the gateway's chat.send method directly via JSON-RPC
    const result = await transport.request<ChatSendResult>("chat.send", {
      sessionKey: `chat:${params.sessionId}`,
      message: params.question,
    });

    const text = result.message?.content?.find(c => c.type === "text")?.text
      || "(no response)";

    // Detect OpenClaw-formatted error messages and fall back
    if (
      text.includes("API rate limit reached")
      || text.includes("rate limit")
      || text.includes("billing error")
      || text.includes("temporarily overloaded")
      || text.startsWith("⚠️")
    ) {
      logger.warn("OpenClaw returned error text, falling back", {
        text: text.slice(0, 100),
      });
      return null;
    }

    // Convert to SSE stream format for compatibility with useChatStream
    const encoder = new TextEncoder();
    return new ReadableStream({
      start(controller) {
        const textEvent = JSON.stringify({ type: "text", text });
        controller.enqueue(encoder.encode(`data: ${textEvent}\n\n`));

        const doneEvent = JSON.stringify({
          type: "done",
          usage: { input_tokens: 0, output_tokens: 0 },
        });
        controller.enqueue(encoder.encode(`data: ${doneEvent}\n\n`));
        controller.close();

        // Save the message asynchronously
        saveMessage({
          sessionId: params.sessionId,
          question: params.question,
          answer: text,
          inputTokens: 0,
          outputTokens: 0,
          route: params.route,
          agentModel: "openclaw-gateway",
        }).catch((err: unknown) => logger.error("Failed to save agent chat message:", err));
      },
    });
  } catch (error) {
    logger.error("Gateway stream failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

async function saveMessage(data: {
  sessionId: string;
  question: string;
  answer: string;
  inputTokens: number;
  outputTokens: number;
  route: string;
  agentModel: string | null;
}) {
  const prisma = (await import("@/lib/prisma")).default;

  await prisma.bazdmegChatMessage.create({
    data: {
      sessionId: data.sessionId,
      question: data.question,
      answer: data.answer,
      model: data.agentModel ? "agent" : "claude-haiku-4-5",
      agentModel: data.agentModel,
      inputTokens: data.inputTokens,
      outputTokens: data.outputTokens,
      route: data.route,
    },
  });
}
