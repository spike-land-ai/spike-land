import { z } from "zod";
import { asPipelineId, errorResult, jsonResult, toolEvent } from "../../mcp/types.js";
import { imageProcedure } from "../../lazy-imports/image-middleware.js";

export const pipelineSaveTool = imageProcedure
  .tool("pipeline_save", "Create, update, or fork an enhancement pipeline", {
    pipeline_id: z
      .string()
      .describe("Pipeline ID (omit to create new, include to update/fork)")
      .optional(),
    fork: z
      .boolean()
      .describe("If true and pipeline_id is set, fork this pipeline instead of updating")
      .optional(),
    name: z.string().describe("Pipeline name"),
    description: z.string().describe("Pipeline description").optional(),
    configs: z
      .record(z.string(), z.unknown())
      .describe("Pipeline configuration: analysis, autoCrop, prompt, and generation settings")
      .optional(),
  })
  .handler(async ({ input: input, ctx: ctx }) => {
    const { userId, deps } = ctx;
    const { name, description, configs } = input;
    const castConfigs = configs as Record<string, unknown> | undefined;

    // CREATE: no pipeline_id
    if (!input.pipeline_id) {
      const result = await tryCatch(
        deps.db.pipelineCreate({
          name,
          description: description ?? null,
          userId,
          visibility: "PRIVATE",
          tier: "FREE",
          analysisConfig: castConfigs?.["analysis"] ?? null,
          autoCropConfig: castConfigs?.["autoCrop"] ?? null,
          promptConfig: castConfigs?.["prompt"] ?? null,
          generationConfig: castConfigs?.["generation"] ?? null,
        }),
      );

      if (!result.ok || !result.data) {
        return errorResult("PIPELINE_CREATE_FAILED", "Failed to create pipeline");
      }

      ctx.notify?.(
        toolEvent("pipeline:created", result.data.id, {
          name: result.data.name,
        }),
      );

      return jsonResult({
        id: result.data.id,
        name: result.data.name,
        action: "created",
      });
    }

    const pipelineId = asPipelineId(input.pipeline_id);

    // FORK: pipeline_id + fork flag
    if (input.fork) {
      const sourceResult = await tryCatch(deps.db.pipelineFindById(pipelineId));
      if (!sourceResult.ok || !sourceResult.data) {
        return errorResult("PIPELINE_NOT_FOUND", "Pipeline not found");
      }

      const source = sourceResult.data;
      const isOwner = source.userId === userId;
      const isSystem = source.userId === null;
      const isPublic = source.visibility === "PUBLIC";

      if (!isOwner && !isSystem && !isPublic) {
        return errorResult("PIPELINE_NOT_FOUND", "Pipeline not found");
      }

      const result = await tryCatch(
        deps.db.pipelineCreate({
          name: name || `${source.name} (copy)`,
          description: description ?? source.description,
          userId,
          visibility: "PRIVATE",
          tier: source.tier,
          analysisConfig: castConfigs?.["analysis"] ?? source.analysisConfig,
          autoCropConfig: castConfigs?.["autoCrop"] ?? source.autoCropConfig,
          promptConfig: castConfigs?.["prompt"] ?? source.promptConfig,
          generationConfig: castConfigs?.["generation"] ?? source.generationConfig,
        }),
      );

      if (!result.ok || !result.data) {
        return errorResult("FORK_FAILED", "Failed to fork pipeline");
      }

      ctx.notify?.(
        toolEvent("pipeline:created", result.data.id, {
          name: result.data.name,
          forkedFrom: source.id,
        }),
      );

      return jsonResult({
        id: result.data.id,
        name: result.data.name,
        forkedFrom: source.id,
        action: "forked",
      });
    }

    // UPDATE: pipeline_id without fork
    const resolveRes = await tryCatch(deps.resolvers.resolvePipeline(pipelineId));
    if (!resolveRes.ok || !resolveRes.data) {
      return errorResult("NOT_FOUND", "Pipeline not found or not owned by user");
    }

    const data: Record<string, unknown> = { name };
    if (description !== undefined) data["description"] = description;
    if (castConfigs?.["analysis"] !== undefined) {
      data["analysisConfig"] = castConfigs["analysis"];
    }
    if (castConfigs?.["autoCrop"] !== undefined) {
      data["autoCropConfig"] = castConfigs["autoCrop"];
    }
    if (castConfigs?.["prompt"] !== undefined) {
      data["promptConfig"] = castConfigs["prompt"];
    }
    if (castConfigs?.["generation"] !== undefined) {
      data["generationConfig"] = castConfigs["generation"];
    }

    const result = await tryCatch(deps.db.pipelineUpdate(pipelineId, data));
    if (!result.ok || !result.data) {
      return errorResult("UPDATE_FAILED", "Failed to update pipeline");
    }

    ctx.notify?.(toolEvent("pipeline:updated", result.data.id, { name: result.data.name }));

    return jsonResult({
      id: result.data.id,
      name: result.data.name,
      action: "updated",
    });
  });

export const pipelineSave = pipelineSaveTool.handler;
export const PipelineSaveInputSchema = z.object(pipelineSaveTool.inputSchema);
export type PipelineSaveInput = Parameters<typeof pipelineSave>[0];

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
