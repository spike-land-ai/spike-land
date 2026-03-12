import { z } from "zod";
import { asImageId, errorResult, jsonResult, toolEvent } from "../../mcp/types.js";
import {
  imageProcedure,
  withOwnership,
  withResolves,
} from "../../lazy-imports/image-middleware.js";

export const albumReorderTool = imageProcedure
  .use(withResolves({ album_handle: "album" }))
  .use(withOwnership(["album_handle"]))
  .tool("album_reorder", "Reorder images in an album", {
    album_handle: z.string().describe("Album handle"),
    image_ids: z.array(z.string()).min(1).max(500).describe("Image IDs in desired order"),
  })
  .handler(async ({ input: input, ctx: ctx }) => {
    const { deps } = ctx;

    // 2. Resolve album ownership
    const album = ctx.entities.album_handle;

    // 3. Reorder images
    const imageIds = input.image_ids.map((id) => asImageId(id));
    const reorderResult = await tryCatch(deps.db.albumImageReorder(album.id, imageIds));
    if (!reorderResult.ok) {
      return errorResult("REORDER_FAILED", reorderResult.error.message, true);
    }

    ctx.notify?.(
      toolEvent("album:updated", album.handle, {
        action: "reorder",
        image_count: input.image_ids.length,
      }),
    );

    // 4. Return success
    return jsonResult({
      reordered: true,
      album_handle: album.handle,
      image_count: input.image_ids.length,
    });
  });

export const AlbumReorderInputSchema = z.object(albumReorderTool.inputSchema);
export type AlbumReorderInput = Parameters<typeof albumReorderTool.handler>[0];

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
