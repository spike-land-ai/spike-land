import { z } from "zod";
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
