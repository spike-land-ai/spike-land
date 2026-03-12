import { z } from "zod";
import { asPipelineId, errorResult, jsonResult } from "../../mcp/types.js";
import { imageProcedure } from "../../lazy-imports/image-middleware.js";

export const pipelineTool = imageProcedure
  .tool("pipeline", "Get a single pipeline by ID", {
    pipeline_id: z.string().describe("ID of the pipeline to retrieve"),
  })
  .handler(async ({ input: input, ctx: ctx }) => {
    const { userId, deps } = ctx;
    const pipelineId = asPipelineId(input.pipeline_id);

    const result = await tryCatch(deps.db.pipelineFindById(pipelineId));
    if (!result.ok || !result.data) {
      return errorResult("PIPELINE_NOT_FOUND", "Pipeline not found");
    }

    const row = result.data;
    const isOwner = row.userId === userId;
    const isSystem = row.userId === null;
    const isPublic = row.visibility === "PUBLIC";

    if (!isOwner && !isSystem && !isPublic) {
      return errorResult("PIPELINE_NOT_FOUND", "Pipeline not found");
    }

    return jsonResult(row);
  });

export const pipeline = pipelineTool.handler;
export const PipelineInputSchema = z.object(pipelineTool.inputSchema);
export type PipelineInput = Parameters<typeof pipeline>[0];

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
