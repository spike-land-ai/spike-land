import { z } from "zod";
import { AVATAR_STYLE_VALUES, errorResult, jsonResult, toolEvent } from "../../mcp/types.js";
import { imageProcedure } from "../../lazy-imports/image-middleware.js";
import { consumeCreditsOrError } from "../define-tool.js";

export const avatarTool = imageProcedure
  .tool(
    "avatar",
    "Generates a customized profile avatar image for a user based on a prompt and visual style.",
    {
      prompt: z.string().describe("Description of the desired avatar"),
      style: z
        .enum(AVATAR_STYLE_VALUES)
        .describe("Avatar style: photo, cartoon, abstract, or pixel")
        .optional(),
      tier: z
        .enum(["FREE", "TIER_0_5K", "TIER_1K", "TIER_2K", "TIER_4K"])
        .describe("Enhancement tier for generation quality")
        .optional(),
    },
  )
  .handler(async ({ input: input, ctx: ctx }) => {
    const { userId, deps } = ctx;
    const tier = input.tier ?? "TIER_1K";
    const style = input.style ?? "photo";
    const cost = deps.credits.calculateGenerationCost({ tier });

    const fullPrompt = `A profile avatar, face-centered composition. Style: ${style}. ${input.prompt}`;

    const jobRes = await tryCatch(
      deps.generation.createGenerationJob({
        userId,
        prompt: fullPrompt,
        tier,
        aspectRatio: "1:1",
      }),
    );

    if (!jobRes.ok) {
      return errorResult("GENERATION_FAILED", jobRes.error.message, true);
    }
    /* v8 ignore next */
    if (!jobRes.data?.success) {
      return errorResult(
        "GENERATION_FAILED",
        jobRes.data?.error ?? "Failed to create avatar job",
        true,
      );
    }

    const { error } = await consumeCreditsOrError(
      deps,
      userId,
      cost,
      "avatar",
      jobRes.data.jobId,
      ctx,
    );
    if (error) return error;

    ctx.notify?.(toolEvent("job:created", jobRes.data.jobId, { tier, status: "PENDING" }));
    return jsonResult({
      jobId: jobRes.data.jobId,
      creditsCost: jobRes.data.creditsCost ?? cost,
      aspect_ratio: "1:1",
    });
  });

export const avatar = avatarTool.handler;
export const AvatarInputSchema = z.object(avatarTool.inputSchema);
export type AvatarInput = Parameters<typeof avatar>[0];

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
