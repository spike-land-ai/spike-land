import { z } from "zod";
import { errorResult, jsonResult } from "../../mcp/types.js";
import { imageProcedure } from "../../lazy-imports/image-middleware.js";

export const subjectListTool = imageProcedure
  .tool("subject_list", "List all your registered subjects for consistent generation", {
    limit: z
      .number()
      .max(100)
      .describe("Maximum number of subjects to return. Defaults to 20")
      .optional(),
  })
  .handler(async ({ input: input, ctx: ctx }) => {
    const { userId, deps } = ctx;

    if (!deps.db.subjectFindMany) {
      return errorResult("NOT_SUPPORTED", "Subject listing not supported in this environment");
    }

    const result = await tryCatch(deps.db.subjectFindMany({ userId }));

    if (!result.ok) {
      return errorResult("SUBJECT_LIST_FAILED", "Failed to list subjects");
    }

    const list = (result.data ?? []).map((s) => ({
      id: s.id,
      label: s.label,
      type: s.type,
      description: s.description,
      created_at: s.createdAt.toISOString(),
    }));

    return jsonResult({ subjects: list.slice(0, input.limit ?? 20) });
  });

export const subjectList = subjectListTool.handler;
export const SubjectListInputSchema = z.object(subjectListTool.inputSchema);
export type SubjectListInput = Parameters<typeof subjectList>[0];

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
