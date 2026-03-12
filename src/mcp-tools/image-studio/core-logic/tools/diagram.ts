import { z } from "zod";
import type { AspectRatio, EnhancementTier } from "../../mcp/types.js";
import {
  DIAGRAM_STYLE_VALUES,
  DIAGRAM_TYPE_VALUES,
  errorResult,
  jsonResult,
  toolEvent,
} from "../../mcp/types.js";
import { imageProcedure, withCredits } from "../../lazy-imports/image-middleware.js";

export const diagramTool = imageProcedure
  .use(
    withCredits({
      cost: (input, deps) =>
        deps.credits.calculateGenerationCost({
          tier: ((input as Record<string, unknown>)["tier"] as EnhancementTier) ?? "TIER_1K",
        }),
      source: "diagram",
    }),
  )
  .tool("diagram", "Description of the diagram to generate", {
    prompt: z.string().describe("Description of the diagram to generate"),
    type: z
      .enum(DIAGRAM_TYPE_VALUES)
      .describe("Diagram type: architecture, flowchart, sequence, er, or network")
      .optional(),
    style: z
      .enum(DIAGRAM_STYLE_VALUES)
      .describe("Visual style: technical, hand_drawn, or minimal")
      .optional(),
    tier: z
      .enum(["FREE", "TIER_0_5K", "TIER_1K", "TIER_2K", "TIER_4K"])
      .describe("Enhancement tier for output quality")
      .optional(),
  })
  .handler(async ({ input: input, ctx: ctx }) => {
    const { userId, deps } = ctx;
    const tier = input.tier ?? "TIER_1K";
    const diagramType = input.type ?? "architecture";
    const style = input.style ?? "technical";
    const cost = ctx.billing.creditsCost;
    const aspectRatio: AspectRatio = diagramType === "sequence" ? "3:4" : "16:9";

    const fullPrompt = `A clear, readable ${diagramType} diagram. Style: ${style}. ${input.prompt}`;

    if (deps.generation.createAdvancedGenerationJob) {
      const jobRes = await tryCatch(
        deps.generation.createAdvancedGenerationJob({
          userId,
          prompt: fullPrompt,
          tier,
          options: { thinkingMode: true },
        }),
      );

      if (!jobRes.ok) {
        return errorResult("GENERATION_FAILED", jobRes.error.message, true);
      }
      if (!jobRes.data?.success) {
        return errorResult(
          "GENERATION_FAILED",
          jobRes.data?.error ?? "Failed to create diagram job",
          true,
        );
      }

      ctx.notify?.(
        toolEvent("job:created", jobRes.data.jobId, {
          tier,
          diagram_type: diagramType,
          status: "PENDING",
        }),
      );
      return jsonResult({
        jobId: jobRes.data.jobId,
        creditsCost: jobRes.data.creditsCost ?? cost,
        diagram_type: diagramType,
        aspect_ratio: aspectRatio,
      });
    }

    const jobRes = await tryCatch(
      deps.generation.createGenerationJob({
        userId,
        prompt: fullPrompt,
        tier,
        aspectRatio,
      }),
    );

    if (!jobRes.ok) {
      return errorResult("GENERATION_FAILED", jobRes.error.message, true);
    }
    if (!jobRes.data?.success) {
      return errorResult(
        "GENERATION_FAILED",
        jobRes.data?.error ?? "Failed to create diagram job",
        true,
      );
    }

    ctx.notify?.(
      toolEvent("job:created", jobRes.data.jobId, {
        tier,
        diagram_type: diagramType,
        status: "PENDING",
      }),
    );
    return jsonResult({
      jobId: jobRes.data.jobId,
      creditsCost: jobRes.data.creditsCost ?? cost,
      diagram_type: diagramType,
      aspect_ratio: aspectRatio,
    });
  });

export const diagram = diagramTool.handler;
export const DiagramInputSchema = z.object(diagramTool.inputSchema);
export type DiagramInput = Parameters<typeof diagram>[0];

// --- Inlined Result and tryCatch ---
type Result<T> =
  | {
      ok: true;
      data: T;
      error?: never;
      unwrap(): T;
      map<U>(fn: (val: T) => U): Result<U>;
      flatMap<U>(fn: (val: T) => Result<U>): Result<U>;
    }
  | {
      ok: false;
      data?: never;
      error: Error;
      unwrap(): never;
      map<U>(fn: (val: T) => U): Result<U>;
      flatMap<U>(fn: (val: T) => Result<U>): Result<U>;
    };

function ok<T>(data: T): Result<T> {
  return {
    ok: true,
    data,
    unwrap: () => data,
    map: <U>(fn: (val: T) => U) => ok(fn(data)),
    flatMap: <U>(fn: (val: T) => Result<U>) => fn(data),
  };
}

function fail<T = never>(error: Error): Result<T> {
  return {
    ok: false,
    error,
    unwrap: () => {
      throw error;
    },
    map: () => fail(error),
    flatMap: () => fail(error),
  };
}

async function tryCatch<T>(promise: Promise<T>): Promise<Result<T>> {
  try {
    const data = await promise;
    return ok(data);
  } catch (err) {
    return fail(err instanceof Error ? err : new Error(String(err)));
  }
}
