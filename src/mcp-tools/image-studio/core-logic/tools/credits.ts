import { z } from "zod";
import { errorResult, jsonResult } from "../../mcp/types.js";
import { imageProcedure } from "../../lazy-imports/image-middleware.js";

export const creditsTool = imageProcedure
  .tool("credits", "Check credit balance, optionally with cost estimate for a tier", {
    tier: z
      .enum(["FREE", "TIER_0_5K", "TIER_1K", "TIER_2K", "TIER_4K"])
      .describe("Tier to estimate cost for")
      .optional(),
    count: z.number().describe("Number of operations to estimate").optional(),
  })
  .handler(async ({ input: input, ctx: ctx }) => {
    const { userId, deps } = ctx;

    const balanceResult = await tryCatch(deps.credits.getBalance(userId));
    if (!balanceResult.ok) {
      return errorResult(
        "BALANCE_ERROR",
        balanceResult.error?.message ?? "Could not retrieve credit balance",
      );
    }
    if (!balanceResult.data) {
      return errorResult("BALANCE_NOT_FOUND", "Could not find credit balance");
    }

    const response: Record<string, unknown> = {
      remaining: balanceResult.data.remaining,
    };

    if (input.tier) {
      const count = input.count ?? 1;
      const costPerUnit = deps.credits.calculateGenerationCost({
        tier: input.tier,
        numImages: 1,
      });
      const totalCost = deps.credits.calculateGenerationCost({
        tier: input.tier,
        numImages: count,
      });

      const canAffordResult = await tryCatch(deps.credits.hasEnough(userId, totalCost));

      response["estimate"] = {
        tier: input.tier,
        count,
        costPerUnit,
        totalCost,
        canAfford: canAffordResult.ok ? canAffordResult.data : false,
      };
    }

    return jsonResult(response);
  });

export const credits = creditsTool.handler;
export const CreditsInputSchema = z.object(creditsTool.inputSchema);
export type CreditsInput = Parameters<typeof credits>[0];

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
