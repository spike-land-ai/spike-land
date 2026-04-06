import { z } from "zod";
import { tryCatch } from "../../mcp/try-catch.js";
import { errorResult, jsonResult, toolEvent } from "../../mcp/types.js";
import { imageProcedure } from "../../lazy-imports/image-middleware.js";

export const subjectDeleteTool = imageProcedure
  .tool("subject_delete", "Delete a registered subject by ID", {
    subject_id: z.string().describe("ID of the subject to delete"),
    confirm: z.coerce.boolean().describe("Must be true to confirm deletion"),
  })
  .handler(async ({ input: input, ctx: ctx }) => {
    if (!input.confirm) {
      return errorResult("CONFIRMATION_REQUIRED", "Set confirm to true to delete this subject");
    }
    const { userId, deps } = ctx;
    const { subject_id } = input;

    if (!deps.db.subjectDelete) {
      return errorResult("NOT_SUPPORTED", "Subject deletion not supported in this environment");
    }

    // Verify subject exists and belongs to user
    if (deps.db.subjectFindMany) {
      const listResult = await tryCatch(deps.db.subjectFindMany({ userId }));
      if (!listResult.ok) {
        return errorResult("LOOKUP_FAILED", listResult.error.message);
      }
      const subject = listResult.data.find((s) => s.id === subject_id);
      if (!subject) {
        return errorResult(
          "SUBJECT_NOT_FOUND",
          `Subject ${subject_id} not found or not owned by user`,
        );
      }
    }

    const deleteResult = await tryCatch(deps.db.subjectDelete(subject_id));
    if (!deleteResult.ok) {
      return errorResult("DELETE_FAILED", deleteResult.error.message);
    }

    ctx.notify?.(toolEvent("subject:deleted", subject_id));

    return jsonResult({
      deleted: true,
      subject_id,
    });
  });

export const subjectDelete = subjectDeleteTool.handler;
export const SubjectDeleteInputSchema = z.object(subjectDeleteTool.inputSchema);
export type SubjectDeleteInput = Parameters<typeof subjectDelete>[0];
