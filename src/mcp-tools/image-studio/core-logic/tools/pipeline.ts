import { z } from "zod";
import { tryCatch } from "../../mcp/try-catch.js";
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
