import { z } from "zod";
import { asPipelineId, errorResult, jsonResult, toolEvent } from "../../mcp/types.js";
import { imageProcedure } from "../../lazy-imports/image-middleware.js";

export const pipelineDeleteTool = imageProcedure
  .tool("pipeline_delete", "Delete an owned pipeline (fails if pipeline has albums)", {
    pipeline_id: z.string().describe("ID of the pipeline to delete"),
  })
  .handler(async ({ input: input, ctx: ctx }) => {
    const { deps } = ctx;
    const pipelineId = asPipelineId(input.pipeline_id);

    const resolveRes = await tryCatch(deps.resolvers.resolvePipeline(pipelineId));
    if (!resolveRes.ok || !resolveRes.data) {
      return errorResult("NOT_FOUND", "Pipeline not found or not owned by user");
    }

    // Check album usage
    const pipelineResult = await tryCatch(deps.db.pipelineFindById(pipelineId));
    if (
      pipelineResult.ok &&
      pipelineResult.data &&
      pipelineResult.data._count &&
      pipelineResult.data._count.albums > 0
    ) {
      return errorResult(
        "PIPELINE_IN_USE",
        `Pipeline is used by ${pipelineResult.data._count.albums} album(s). Remove albums first.`,
      );
    }

    const result = await tryCatch(deps.db.pipelineDelete(pipelineId));
    if (!result.ok) {
      return errorResult("DELETE_FAILED", "Failed to delete pipeline");
    }

    ctx.notify?.(toolEvent("pipeline:deleted", pipelineId));

    return jsonResult({ deleted: true, id: input.pipeline_id });
  });

export const pipelineDelete = pipelineDeleteTool.handler;
export const PipelineDeleteInputSchema = z.object(pipelineDeleteTool.inputSchema);
export type PipelineDeleteInput = Parameters<typeof pipelineDelete>[0];

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
