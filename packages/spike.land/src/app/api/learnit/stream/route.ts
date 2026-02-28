export const maxDuration = 90; // Allow 90s for Claude primary + Gemini fallback
export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { isClaudeConfigured } from "@/lib/ai/claude-client";
import { getGeminiClient } from "@/lib/ai/gemini-client";
import {
  getCircuitState,
  recordCircuitFailure,
  recordCircuitSuccess,
} from "@/lib/create/circuit-breaker";
import {
  agentGenerateLearnIt,
  buildLearnItPrompt,
  type StreamEvent,
} from "@/lib/learnit/agent-loop";
import {
  createOrUpdateContent,
  getLearnItContent,
  markAsFailed,
  markAsGenerating,
} from "@/lib/learnit/content-service";
import { generateTopicSchema } from "@/lib/learnit/validations";
import { parseWikiLinks } from "@/lib/learnit/wiki-links";
import logger from "@/lib/logger";
import { checkGenerationRateLimit, getClientIp } from "@/lib/rate-limit-presets";
import { NextResponse } from "next/server";

const AGENT_URL = process.env.LEARNIT_AGENT_URL; // e.g. https://learnit-agent.your-tunnel.com
const AGENT_SECRET = process.env.LEARNIT_AGENT_SECRET;
const AGENT_TIMEOUT_MS = 3000; // 3s to connect, fallback if unreachable

/**
 * Streaming endpoint for LearnIt content generation.
 * Tries local OpenClaw agent first, falls back to direct Gemini.
 */
export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  const ip = getClientIp(req);

  const { allowed, retryAfterSeconds } = await checkGenerationRateLimit(
    ip,
    !!userId,
  );
  if (!allowed) {
    return new NextResponse(
      JSON.stringify({ error: "Rate limit exceeded", retryAfterSeconds }),
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  const parsed = generateTopicSchema.safeParse(json);
  if (!parsed.success) {
    return new NextResponse("Invalid path", { status: 400 });
  }

  const { path } = parsed.data;
  const slug = path.join("/").toLowerCase();

  // Check if content already exists (gracefully handle DB timeout)
  let existing;
  try {
    existing = await getLearnItContent(slug);
  } catch (dbError) {
    logger.warn("LearnIt: DB lookup failed, proceeding to generate", {
      slug,
      error: dbError instanceof Error ? dbError.message : String(dbError),
    });
  }
  if (existing && existing.status === "PUBLISHED") {
    const existingContent = existing;
    async function* existingContentGenerator(): AsyncGenerator<StreamEvent> {
      yield {
        type: "complete",
        content: existingContent.content,
        title: existingContent.title,
        description: existingContent.description,
        agent: "cache",
      };
    }
    return createSSEResponse(existingContentGenerator());
  }

  // Check if already generating
  if (existing?.status === "GENERATING") {
    // Clean up stale GENERATING records older than 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    if (existing.generatedAt && existing.generatedAt < fiveMinutesAgo) {
      await markAsFailed(slug);
      // Continue to re-generate below
    } else {
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
      if (existing.generatedAt > twoMinutesAgo) {
        return new NextResponse(
          JSON.stringify({
            status: "GENERATING",
            message: "Content is already being generated",
          }),
          { status: 202 },
        );
      }
    }
  }

  // Mark as generating (non-blocking — generation can proceed even if this fails)
  try {
    await markAsGenerating(slug, path, userId);
  } catch (dbError) {
    logger.warn("LearnIt: failed to mark as generating, proceeding anyway", {
      slug,
      error: dbError instanceof Error ? dbError.message : String(dbError),
    });
  }

  // Try local agent first, fall back to Gemini
  const agentAvailable = await isAgentAvailable();

  if (agentAvailable) {
    logger.info("LearnIt: using local agent (Spike)", { slug });
    return createAgentProxyResponse(path, slug, userId);
  }

  logger.info("LearnIt: using AI generation", { slug });
  return createSSEResponse(generateStream(path, slug, userId));
}

/**
 * Check if the local LearnIt agent is reachable.
 */
async function isAgentAvailable(): Promise<boolean> {
  if (!AGENT_URL || !AGENT_SECRET) return false;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), AGENT_TIMEOUT_MS);
    const res = await fetch(`${AGENT_URL}/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Proxy the request to the local agent and stream back the response.
 * Saves to DB on completion. Falls back to Gemini on error.
 */
function createAgentProxyResponse(
  path: string[],
  slug: string,
  userId: string | undefined,
): Response {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const res = await fetch(`${AGENT_URL}/generate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${AGENT_SECRET}`,
          },
          body: JSON.stringify({ path }),
        });

        if (!res.ok || !res.body) {
          throw new Error(`Agent returned ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let title = "";
        let description = "";
        let agentName = "Spike";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);

            try {
              const event = JSON.parse(data);

              if (event.type === "agent") {
                agentName = event.name ?? "Spike";
                // Forward agent identity to client
                controller.enqueue(
                  encoder.encode(
                    `data: ${
                      JSON.stringify({
                        type: "agent",
                        name: agentName,
                        model: event.model,
                      })
                    }\n\n`,
                  ),
                );
                continue;
              }

              if (event.type === "chunk") {
                controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                continue;
              }

              if (event.type === "complete") {
                title = event.title;
                description = event.description;
                const finalContent = event.content;

                // Process wiki links and save to DB
                const { content: processedContent } = parseWikiLinks(
                  title + "\n" + finalContent,
                );
                const contentOnly = processedContent.substring(
                  processedContent.indexOf("\n") + 1,
                ).trim();

                await createOrUpdateContent({
                  slug,
                  path,
                  parentSlug: path.length > 1
                    ? path.slice(0, -1).join("/")
                    : null,
                  title,
                  description,
                  content: contentOnly,
                  generatedById: userId,
                  aiModel: `agent:${agentName}`,
                });

                controller.enqueue(
                  encoder.encode(
                    `data: ${
                      JSON.stringify({
                        type: "complete",
                        content: contentOnly,
                        title,
                        description,
                        agent: agentName,
                      })
                    }\n\n`,
                  ),
                );
                continue;
              }

              if (event.type === "error") {
                throw new Error(event.message);
              }
            } catch (parseError) {
              // If JSON parse fails, skip this line
              if (parseError instanceof SyntaxError) continue;
              throw parseError;
            }
          }
        }

        controller.close();
      } catch (error) {
        logger.warn("LearnIt agent proxy failed, falling back to Gemini", {
          slug,
          error: error instanceof Error ? error.message : String(error),
        });

        // Fall back to Claude→Gemini pipeline
        try {
          for await (const event of generateStream(path, slug, userId)) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
            );
          }
        } catch (_geminiError) {
          await markAsFailed(slug).catch(err =>
            logger.error("[learnit] Failed to mark as failed:", err)
          );
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", message: "Generation failed" })}\n\n`,
            ),
          );
        }
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

/**
 * Main generation stream — tries Claude Opus first (via circuit breaker),
 * falls back to Gemini if Claude is unavailable or fails.
 */
async function* generateStream(
  path: string[],
  slug: string,
  userId: string | undefined,
): AsyncGenerator<StreamEvent> {
  if (await isClaudeConfigured()) {
    const circuitState = await getCircuitState();

    if (circuitState === "OPEN") {
      logger.info("LearnIt: circuit breaker OPEN, skipping Claude", { slug });
      yield* generateWithGemini(path, slug, userId);
      return;
    }

    try {
      yield* agentGenerateLearnIt(path, slug, userId);
      await recordCircuitSuccess();
      return;
    } catch (error) {
      await recordCircuitFailure();
      logger.warn("LearnIt Claude failed, falling back to Gemini", {
        slug,
        error: error instanceof Error ? error.message : String(error),
      });
      // Fall through to Gemini
    }
  }

  yield* generateWithGemini(path, slug, userId);
}

/**
 * Generate content directly with Gemini (fallback path).
 */
async function* generateWithGemini(
  path: string[],
  slug: string,
  userId: string | undefined,
): AsyncGenerator<StreamEvent> {
  const topic = path.join(" > ");

  // Send agent identity
  yield {
    type: "agent",
    name: "Gemini Flash",
    model: "gemini-3-flash-preview",
  } as StreamEvent;

  const prompt = buildLearnItPrompt(topic);

  try {
    const ai = await getGeminiClient();

    const response = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      config: {
        maxOutputTokens: 8192,
        temperature: 0.3,
      },
    });

    let fullContent = "";
    let title = "";
    let description = "";
    let lineCount = 0;

    for await (const chunk of response) {
      const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        fullContent += text;

        if (!title) {
          const lines = fullContent.split("\n");
          const firstLine = lines[0];
          if (firstLine?.trim()) {
            title = firstLine.trim().replace(/^#*\s*/, "");
          }
        }

        if (!description && fullContent.includes("\n\n")) {
          const contentParts = fullContent.split("\n\n");
          const secondPart = contentParts[1];
          if (secondPart?.trim()) {
            description = secondPart.trim().substring(0, 200);
          }
        }

        yield { type: "chunk", content: text };
        lineCount++;

        if (lineCount % 10 === 0) {
          logger.info(`LearnIt streaming: ${lineCount} chunks sent`, { slug });
        }
      }
    }

    if (!title) {
      title = path[path.length - 1]?.replace(/-/g, " ") ?? "Topic";
    }
    if (!description) {
      description = `Learn about ${title}`;
    }

    // Process wiki links and save to database
    logger.info("Generated full content length", {
      length: fullContent.length,
    });
    const { content: processedContent } = parseWikiLinks(fullContent);

    let finalContent = processedContent;
    const firstNewline = processedContent.indexOf("\n");
    if (firstNewline > 0) {
      finalContent = processedContent.substring(firstNewline + 1).trim();
    }

    await createOrUpdateContent({
      slug,
      path,
      parentSlug: path.length > 1 ? path.slice(0, -1).join("/") : null,
      title,
      description,
      content: finalContent,
      generatedById: userId,
      aiModel: "gemini-3-flash-preview",
    });

    yield {
      type: "complete",
      content: finalContent,
      title,
      description,
      agent: "Gemini Flash",
    };
  } catch (error) {
    logger.error("LearnIt streaming error:", { error, slug });
    await markAsFailed(slug);
    // Explicitly use the error to satisfy linter if needed
    const errorMessage = error instanceof Error
      ? error.message
      : "Generation failed";
    logger.error("LearnIt streaming failed", { errorMessage });
    yield { type: "error", message: errorMessage };
  }
}

function createSSEResponse(generator: AsyncGenerator<StreamEvent>): Response {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of generator) {
          const data = JSON.stringify(event);
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        }
        controller.close();
      } catch (error) {
        const errorEvent = JSON.stringify({
          type: "error",
          message: error instanceof Error ? error.message : "Stream error",
        });
        controller.enqueue(encoder.encode(`data: ${errorEvent}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
