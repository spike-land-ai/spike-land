import { z } from "zod";
import { errorResult, IMG_DEFAULTS, jsonResult } from "../../mcp/types.js";
import { imageProcedure } from "../../lazy-imports/image-middleware.js";

export const albumListTool = imageProcedure
  .tool("album_list", "List your albums with image counts", {
    limit: z.number().max(100).describe("Maximum number of albums to return (max 100)").optional(),
  })
  .handler(async ({ input: input, ctx: ctx }) => {
    const { userId, deps } = ctx;
    const limit = input.limit ?? IMG_DEFAULTS.listLimit;

    const albumsResult = await tryCatch(deps.db.albumFindMany({ userId, limit }));
    if (!albumsResult.ok) {
      return errorResult("LIST_ALBUMS_FAILED", "Failed to list albums");
    }

    const list = (albumsResult.data ?? []).map((a) => ({
      album_handle: a.handle,
      name: a.name,
      privacy: a.privacy,
      default_tier: a.defaultTier,
      image_count: a._count?.albumImages ?? 0,
      created_at: a.createdAt,
    }));

    return jsonResult({ albums: list, count: list.length });
  });

export const albumList = albumListTool.handler;
export const AlbumListInputSchema = z.object(albumListTool.inputSchema);
export type AlbumListInput = Parameters<typeof albumList>[0];

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
