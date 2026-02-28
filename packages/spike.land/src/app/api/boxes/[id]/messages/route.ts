import { auth } from "@/lib/auth";
import {
  generateAgentResponse,
  isGeminiConfigured,
} from "@/lib/ai/gemini-client";
import prisma from "@/lib/prisma";
import { checkRateLimit, rateLimitConfigs } from "@/lib/rate-limiter";
import { tryCatch } from "@/lib/try-catch";
import { BoxMessageRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/logger";

const messageSchema = z.object({
  content: z.string().min(1),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; }>; },
) {
  const { data: session, error: authError } = await tryCatch(auth());
  if (authError || !session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Rate limiting check
  const rateLimitResult = await checkRateLimit(
    `box_message:${session.user.id}`,
    rateLimitConfigs.boxMessage,
  );

  if (rateLimitResult.isLimited) {
    const retryAfter = Math.ceil(
      (rateLimitResult.resetAt - Date.now()) / 1000,
    );
    return new NextResponse(
      "Too many messages. Please try again later.",
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Remaining": String(rateLimitResult.remaining),
          "X-RateLimit-Reset": String(rateLimitResult.resetAt),
        },
      },
    );
  }

  const { data: paramsData, error: paramsError } = await tryCatch(params);
  if (paramsError) {
    return new NextResponse("Invalid parameters", { status: 400 });
  }
  const { id } = paramsData;

  const { data: json, error: jsonError } = await tryCatch(req.json());
  if (jsonError) {
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  const parseResult = messageSchema.safeParse(json);

  if (!parseResult.success) {
    return new NextResponse(JSON.stringify(parseResult.error.flatten()), {
      status: 400,
    });
  }

  const body = parseResult.data;

  // Verify box ownership
  const { data: box, error: boxError } = await tryCatch(
    prisma.box.findUnique({
      where: {
        id: id,
        userId: session.user.id,
      },
    }),
  );

  if (boxError) {
    logger.error("Database error (box lookup):", boxError);
    return new NextResponse("Internal Error", { status: 500 });
  }

  if (!box) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // Save user message
  const { data: userMessage, error: userMessageError } = await tryCatch(
    prisma.boxMessage.create({
      data: {
        boxId: id,
        role: BoxMessageRole.USER,
        content: body.content,
      },
    }),
  );

  if (userMessageError || !userMessage) {
    logger.error("Failed to save user message:", userMessageError);
    return new NextResponse("Internal Error", { status: 500 });
  }

  // Generate AI response using Gemini
  let agentResponseContent: string;

  if (!isGeminiConfigured()) {
    // Fallback if Gemini is not configured
    agentResponseContent = "AI agent is currently unavailable. Please try again later.";
  } else {
    // Fetch previous messages for context
    const { data: previousMessages } = await tryCatch(
      prisma.boxMessage.findMany({
        where: {
          boxId: id,
          id: { not: userMessage.id },
        },
        orderBy: { createdAt: "desc" },
        take: 20, // Limit context window
      }),
    );

    // Build chat history for the AI
    // Reverse because we fetched newest first, but LLM needs chronological order
    const chatHistory = (previousMessages || []).reverse().map(msg => ({
      role: msg.role === BoxMessageRole.USER
        ? ("user" as const)
        : ("model" as const),
      content: msg.content,
    }));

    // Add the current message
    chatHistory.push({ role: "user", content: body.content });

    const { data: aiResponse, error: aiError } = await tryCatch(
      generateAgentResponse({ messages: chatHistory }),
    );

    if (aiError) {
      logger.error("[BOX_AGENT] AI generation error:", aiError);
      agentResponseContent = "I encountered an error processing your request. Please try again.";
    } else {
      agentResponseContent = aiResponse || "I couldn't generate a response.";
    }
  }

  const { data: agentMessage, error: agentMessageError } = await tryCatch(
    prisma.boxMessage.create({
      data: {
        boxId: id,
        role: BoxMessageRole.AGENT,
        content: agentResponseContent,
      },
    }),
  );

  if (agentMessageError) {
    logger.error("Failed to save agent message:", agentMessageError);
    // Don't fail the request if agent message fails? Or maybe fail
    // Returning success with userMessage but no agentMessage might be weird.
    return new NextResponse("Internal Error", { status: 500 });
  }

  return NextResponse.json({
    userMessage,
    agentMessage,
  });
}
