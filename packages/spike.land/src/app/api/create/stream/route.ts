import { auth } from "@/lib/auth";
import {
  getCircuitState,
  recordCircuitFailure,
  recordCircuitSuccess,
} from "@/lib/create/circuit-breaker";
import {
  generateCodespaceId,
  updateCodespace,
} from "@/lib/create/codespace-service";
import {
  attemptCodeCorrection,
  generateAppContent,
} from "@/lib/create/content-generator";
import {
  getCreatedApp,
  markAsGenerating,
  updateAppContent,
  updateAppStatus,
} from "@/lib/create/content-service";
import {
  type CreateGenerationResult,
  type StreamEvent,
} from "@/lib/create/types";
import { agentGenerateApp } from "@/lib/create/agent-loop";
import { isClaudeConfigured } from "@/lib/ai/claude-client";
import logger from "@/lib/logger";
import { checkGenerationRateLimit, getClientIp } from "@/lib/rate-limit-presets";
import { CreatedAppStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

export const maxDuration = 120; // 120s for agent loop (was 60s)
export const dynamic = "force-dynamic";

const CREATE_AGENT_URL = process.env.CREATE_AGENT_URL; // e.g. https://create-agent.your-tunnel.com
const CREATE_AGENT_SECRET = process.env.CREATE_AGENT_SECRET;
const AGENT_TIMEOUT_MS = 3000; // 3s to connect, fallback if unreachable

const CreateRequestSchema = z.object({
  path: z.array(z.string()),
  imageUrls: z.array(z.string().url()).max(4).optional(),
});

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

  const parsed = CreateRequestSchema.safeParse(json);
  if (!parsed.success) {
    return new NextResponse("Invalid request body", { status: 400 });
  }

  const { path, imageUrls } = parsed.data;
  if (path.length === 0) {
    return new NextResponse("Path cannot be empty", { status: 400 });
  }

  const slug = path.join("/").toLowerCase();

  // Check if app already exists and is published
  const existing = await getCreatedApp(slug);
  if (existing?.status === CreatedAppStatus.PUBLISHED) {
    return NextResponse.json({
      success: true,
      codeSpace: existing.slug,
      status: "PUBLISHED",
      url: existing.codespaceUrl,
      slug: existing.slug,
    });
  }

  // Check if already generating or in review
  if (
    existing?.status === CreatedAppStatus.GENERATING
    || existing?.status === CreatedAppStatus.AUTO_REVIEW
    || existing?.status === CreatedAppStatus.AI_REVIEW
  ) {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    // If generating for more than 2 mins, assume stuck and allow retry
    if (existing.generatedAt > twoMinutesAgo) {
      return new NextResponse(
        JSON.stringify({
          status: existing.status,
          message: "App is already being generated or under review",
        }),
        { status: 202 },
      );
    }
  }

  // Try local agent first, fall back to direct generation
  const agentAvailable = await isAgentAvailable();

  if (agentAvailable) {
    logger.info("Create: using local agent", { slug });
    return consumeAgentProxy(slug, path, userId);
  }

  logger.info("Create: falling back to direct generation", { slug });
  return consumeGenerator(generateStream(slug, path, userId, imageUrls), slug);
}

/**
 * Check if the local Create agent is reachable.
 */
export async function isAgentAvailable(): Promise<boolean> {
  if (!CREATE_AGENT_URL || !CREATE_AGENT_SECRET) return false;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), AGENT_TIMEOUT_MS);
    const res = await fetch(`${CREATE_AGENT_URL}/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Proxy the request to the local agent, collect SSE events, return JSON.
 * Falls back to direct generation on error.
 */
async function consumeAgentProxy(
  slug: string,
  path: string[],
  userId: string | undefined,
): Promise<NextResponse<CreateGenerationResult>> {
  try {
    const res = await fetch(`${CREATE_AGENT_URL}/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CREATE_AGENT_SECRET}`,
      },
      body: JSON.stringify({ path }),
    });

    if (!res.ok || !res.body) {
      throw new Error(`Agent returned ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let result: CreateGenerationResult = { success: false, codeSpace: slug };
    const buildLog: string[] = [];

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
          const event = JSON.parse(data) as Record<string, unknown>;

          if (event.type === "error") {
            result = {
              success: false,
              codeSpace: slug,
              error: String(event.message || "Agent generation failed"),
              code: event.generatedCode
                ? String(event.generatedCode)
                : undefined,
              buildLog,
            };
            return NextResponse.json(result, { status: 500 });
          }

          if (event.type === "status" || event.type === "phase") {
            buildLog.push(String(event.message || ""));
          }

          if (event.type === "complete") {
            result = {
              success: true,
              codeSpace: slug,
              title: String(event.title || ""),
              description: String(event.description || ""),
              buildLog,
            };
          }
        } catch (parseError) {
          if (parseError instanceof SyntaxError) continue;
          throw parseError;
        }
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    logger.info(
      "Create agent proxy failed, falling back to direct generation",
      {
        slug,
        error: error instanceof Error ? error.message : String(error),
      },
    );

    return consumeGenerator(generateStream(slug, path, userId), slug);
  }
}

/**
 * Main generation stream — delegates to the Claude agent loop,
 * with automatic fallback to Gemini if Claude is unavailable or circuit is open.
 */
async function* generateStream(
  slug: string,
  path: string[],
  userId: string | undefined,
  imageUrls?: string[],
): AsyncGenerator<StreamEvent> {
  // Use Claude agent loop when any Anthropic credential is available
  if (await isClaudeConfigured()) {
    const circuitState = await getCircuitState();

    if (circuitState === "OPEN") {
      logger.info("Circuit breaker OPEN, skipping Claude", { slug });
      yield {
        type: "status",
        message: "Claude temporarily unavailable, using fallback...",
      };
      yield* geminiFallbackStream(slug, path, userId);
      return;
    }

    try {
      yield* agentGenerateApp(slug, path, userId, imageUrls);
      await recordCircuitSuccess();
      return;
    } catch (error) {
      await recordCircuitFailure();
      logger.warn("Agent loop failed, falling back to Gemini generation", {
        error: error instanceof Error ? error.message : "Unknown error",
        slug,
        circuitState,
      });
      yield { type: "status", message: "Switching to alternative provider..." };
      // Fall through to Gemini fallback
    }
  }

  // Fallback: Original Gemini-based generation
  yield* geminiFallbackStream(slug, path, userId);
}

/**
 * Original Gemini-based generation flow — kept as circuit breaker fallback.
 */
async function* geminiFallbackStream(
  slug: string,
  path: string[],
  userId: string | undefined,
): AsyncGenerator<StreamEvent> {
  const codespaceId = generateCodespaceId(slug);
  const codespaceUrl = `/api/codespace/${codespaceId}/embed`;

  try {
    yield { type: "agent", name: "Gemini Flash", model: "gemini-3-flash-preview" };
    yield { type: "status", message: "Initializing app generation..." };

    const placeholderTitle = path[path.length - 1]?.replace(/-/g, " ")
      || "New App";
    await markAsGenerating(
      slug,
      path,
      placeholderTitle,
      "Generating app...",
      codespaceId,
      codespaceUrl,
      `Create app from path: ${slug}`,
      userId,
    );

    yield { type: "status", message: "Designing application logic..." };

    const { content, rawCode, error: genError } = await generateAppContent(
      path,
    );

    const codeToPush = content?.code ?? rawCode;

    if (!codeToPush) {
      throw new Error(genError || "Failed to generate content from AI");
    }

    yield { type: "status", message: "Writing code..." };

    let updateResult = await updateCodespace(codespaceId, codeToPush);

    if (!updateResult.success && updateResult.error) {
      yield { type: "status", message: "Fixing transpilation error..." };

      const correctedCode = await attemptCodeCorrection(
        codeToPush,
        updateResult.error,
        slug,
      );

      if (correctedCode) {
        updateResult = await updateCodespace(codespaceId, correctedCode);

        if (updateResult.success && content) {
          content.code = correctedCode;
        }
      }
    }

    if (!updateResult.success) {
      throw new Error(updateResult.error || "Failed to update codespace");
    }

    if (!content) {
      logger.error(`App generation partially failed for ${slug}: ${genError}`);
      try {
        await updateAppStatus(slug, CreatedAppStatus.FAILED);
      } catch (updateError) {
        logger.error(`Failed to mark app ${slug} as FAILED:`, { updateError });
      }
      yield {
        type: "error",
        message: genError || "Generated content failed validation",
        codespaceUrl,
        generatedCode: codeToPush ?? undefined,
      };
      return;
    }

    yield { type: "status", message: "Finalizing..." };

    const relatedLinks = content.relatedApps || [];

    await updateAppContent(slug, content.title, content.description);
    await updateAppStatus(slug, CreatedAppStatus.PUBLISHED, relatedLinks);

    yield {
      type: "complete",
      slug,
      url: codespaceUrl,
      title: content.title,
      description: content.description,
      relatedApps: relatedLinks,
      agent: "Gemini Flash",
    };
  } catch (error) {
    logger.error(`App generation failed for ${slug}:`, { error });
    try {
      await updateAppStatus(slug, CreatedAppStatus.FAILED);
    } catch (updateError) {
      logger.error(`Failed to mark app ${slug} as FAILED:`, { updateError });
    }

    yield {
      type: "error",
      message: error instanceof Error ? error.message : "Generation failed",
      codespaceUrl,
    };
  }
}

/**
 * Drain the async generator, collect the final result, and return JSON.
 */
async function consumeGenerator(
  generator: AsyncGenerator<StreamEvent>,
  slug: string,
): Promise<NextResponse<CreateGenerationResult>> {
  const buildLog: string[] = [];
  let result: CreateGenerationResult = { success: false, codeSpace: slug };

  try {
    for await (const event of generator) {
      switch (event.type) {
        case "status":
          buildLog.push(event.message);
          break;
        case "phase":
          buildLog.push(event.message);
          break;
        case "error_detected":
          buildLog.push(`Error: ${event.error}`);
          break;
        case "error_fixed":
          buildLog.push(`Fixed (attempt ${event.iteration + 1})`);
          break;
        case "review_started":
          buildLog.push(`Starting ${event.phase} review...`);
          break;
        case "review_complete":
          buildLog.push(
            `${event.phase}: ${event.approved ? "approved" : "rejected"} (score: ${
              event.score.toFixed(2)
            })`,
          );
          break;
        case "complete":
          result = {
            success: true,
            codeSpace: slug,
            title: event.title,
            description: event.description,
            buildLog,
          };
          break;
        case "error":
          result = {
            success: false,
            codeSpace: slug,
            error: event.message,
            code: event.generatedCode,
            buildLog,
          };
          break;
      }
    }
  } catch (error) {
    result = {
      success: false,
      codeSpace: slug,
      error: error instanceof Error ? error.message : "Generation failed",
      buildLog,
    };
  }

  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}
