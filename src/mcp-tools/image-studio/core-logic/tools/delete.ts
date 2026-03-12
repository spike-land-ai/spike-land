import { z } from "zod";
import { errorResult, jsonResult, toolEvent } from "../../mcp/types.js";
import type { ImageRow, ImageStudioDeps, ToolEvent } from "../../mcp/types.js";
import {
  createImageProcedure,
  imageProcedure,
  withOwnership,
  withResolves,
} from "../../lazy-imports/image-middleware.js";

function createHandler() {
  return async ({
    ctx,
  }: {
    input: { image_id: string; confirm: boolean };
    ctx: {
      deps: ImageStudioDeps;
      entities: { image_id: ImageRow };
      notify?: ((event: ToolEvent) => void) | undefined;
    };
  }) => {
    const image = ctx.entities.image_id;
    const imageId = image.id;

    const storageResult = await tryCatch(ctx.deps.storage.delete(image.originalR2Key));
    if (!storageResult.ok) {
      return errorResult("STORAGE_ERROR", "Failed to delete image from storage");
    }

    const dbResult = await tryCatch(ctx.deps.db.imageDelete(imageId));
    if (!dbResult.ok) {
      return errorResult("DELETE_FAILED", "Failed to delete image from database");
    }

    ctx.notify?.(toolEvent("image:deleted", image.id, { name: image.name }));

    return jsonResult({ deleted: true, image_id: image.id });
  };
}

export const deleteTool = imageProcedure
  .use(withResolves({ image_id: "image" }))
  .use(withOwnership(["image_id"]))
  .tool("delete", "Delete an image from the library", {
    image_id: z.string().describe("ID of the image to delete"),
    confirm: z.coerce
      .boolean()
      .refine((val) => val === true, "Set confirm=true to delete the image permanently")
      .describe("Must be true to confirm permanent deletion"),
  })
  .output(z.object({ deleted: z.boolean(), image_id: z.string() }))
  .handler(createHandler());

export const deleteImage = deleteTool.handler;
export const DeleteInputSchema = z.object(deleteTool.inputSchema);
export type DeleteInput = Parameters<typeof deleteImage>[0];

export function createDeleteTool(
  userId: string,
  deps: ImageStudioDeps,
  notify?: ((event: ToolEvent) => void) | undefined,
) {
  return createImageProcedure(userId, deps, notify)
    .use(withResolves({ image_id: "image" }))
    .use(withOwnership(["image_id"]))
    .tool("delete", "Delete an image from the library", {
      image_id: z.string().describe("ID of the image to delete"),
      confirm: z.coerce
        .boolean()
        .refine((val) => val === true, "Set confirm=true to delete the image permanently")
        .describe("Must be true to confirm permanent deletion"),
    })
    .output(z.object({ deleted: z.boolean(), image_id: z.string() }))
    .handler(createHandler());
}

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
