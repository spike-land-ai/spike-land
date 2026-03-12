import { z } from "zod";
import { errorResult, IMG_DEFAULTS, jsonResult } from "../../mcp/types.js";
import { imageProcedure } from "../../lazy-imports/image-middleware.js";

export const pipelineListTool = imageProcedure
  .tool("pipeline_list", "List pipelines for the current user.", {
    limit: z.number().max(100).describe("Maximum number of pipelines to return").optional(),
  })
  .handler(async ({ input: input, ctx: ctx }) => {
    const { userId, deps } = ctx;
    const { limit = IMG_DEFAULTS.pipelineListLimit } = input;
    const result = await tryCatch(deps.db.pipelineFindMany({ userId, limit }));

    if (!result.ok) {
      return errorResult("LIST_PIPELINES_FAILED", "Failed to list pipelines");
    }

    const pipelines = result.data ?? [];
    return jsonResult({ pipelines, count: pipelines.length });
  });

export const pipelineList = pipelineListTool.handler;
export const PipelineListInputSchema = z.object(pipelineListTool.inputSchema);
export type PipelineListInput = Parameters<typeof pipelineList>[0];

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
