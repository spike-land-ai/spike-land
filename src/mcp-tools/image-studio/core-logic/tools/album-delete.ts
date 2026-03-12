import { z } from "zod";
import { errorResult, jsonResult, toolEvent } from "../../mcp/types.js";
import {
  imageProcedure,
  withOwnership,
  withResolves,
} from "../../lazy-imports/image-middleware.js";

export const albumDeleteTool = imageProcedure
  .use(withResolves({ album_handle: "album" }))
  .use(withOwnership(["album_handle"]))
  .tool("album_delete", "Delete an album (images are NOT deleted, only removed from album)", {
    album_handle: z.string().describe("Handle of the album to delete"),
    confirm: z.coerce.boolean().describe("Must be true to confirm permanent deletion"),
  })
  .handler(async ({ input: input, ctx: ctx }) => {
    const { deps } = ctx;
    const { confirm } = input;

    if (!confirm) {
      return errorResult("CONFIRMATION_REQUIRED", "Set confirm=true to delete the album");
    }

    const album = ctx.entities.album_handle;
    const handle = album.handle;

    const deleteResult = await tryCatch(deps.db.albumDelete(handle));
    if (!deleteResult.ok) {
      return errorResult("DELETE_FAILED", "Failed to delete album");
    }

    ctx.notify?.(toolEvent("album:deleted", album.handle, { name: album.name }));

    return jsonResult({
      deleted: true,
      album_handle: album.handle,
      name: album.name,
    });
  });

export const albumDelete = albumDeleteTool.handler;
export const AlbumDeleteInputSchema = z.object(albumDeleteTool.inputSchema);
export type AlbumDeleteInput = Parameters<typeof albumDelete>[0];

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
