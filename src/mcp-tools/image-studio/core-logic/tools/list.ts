import { z } from "zod";
import { errorResult, jsonResult } from "../../mcp/types.js";
import { imageProcedure } from "../../lazy-imports/image-middleware.js";

export const listTool = imageProcedure
  .tool("list", "List or search images in the user's library", {
    query: z.string().describe("Optional search query to filter images by name/tags").optional(),
    limit: z
      .number()
      .max(100)
      .describe("Maximum number of images to return (max 100). Defaults to 20")
      .optional(),
    cursor: z.string().describe("Pointer for pagination (e.g. last item id)").optional(),
  })
  .handler(async ({ input: input, ctx: ctx }) => {
    const { userId, deps } = ctx;
    const { query, limit = 20, cursor } = input;

    const result = await tryCatch(
      deps.db.imageFindMany({
        userId,
        limit,
        cursor: query ? undefined : cursor,
        search: query,
      }),
    );

    if (!result.ok) {
      return errorResult("LIST_FAILED", "Failed to list library images");
    }

    const images = result.data ?? [];
    return jsonResult({
      ...(query ? { query } : {}),
      count: images.length,
      ...(!query ? { cursor } : {}),
      images: images.map((img) => ({
        id: img.id,
        name: img.name,
        url: img.originalUrl,
        width: img.originalWidth,
        height: img.originalHeight,
        tags: img.tags,
        createdAt: img.createdAt,
      })),
    });
  });

export const list = listTool.handler;
export const ListInputSchema = z.object(listTool.inputSchema);
export type ListInput = Parameters<typeof list>[0];

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
