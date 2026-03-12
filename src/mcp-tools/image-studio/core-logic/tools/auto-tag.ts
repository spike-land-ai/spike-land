import { z } from "zod";
import { errorResult, jsonResult, toolEvent } from "../../mcp/types.js";
import {
  imageProcedure,
  withCredits,
  withOwnership,
  withResolves,
} from "../../lazy-imports/image-middleware.js";

export const autoTagTool = imageProcedure
  .use(withResolves({ image_id: "image" }))
  .use(withOwnership(["image_id"]))
  .use(
    withCredits({
      cost: (_input, deps) => 1 + (deps.generation.extractPalette ? 1 : 0),
      source: "auto_tag",
      sourceIdField: "image_id",
    }),
  )
  .tool("auto_tag", "AI-analyze an image and persist tags/description to the image record.", {
    image_id: z.string().describe("Image ID to auto-tag"),
    overwrite: z
      .boolean()
      .describe(
        "If true, replace existing tags/description. If false (default), merge with existing",
      )
      .optional(),
  })
  .handler(async ({ input: input, ctx: ctx }) => {
    const { userId, deps } = ctx;
    const overwrite = input.overwrite ?? false;

    // 1. Check AI describe availability
    if (!deps.generation.describeImage) {
      return errorResult(
        "UNSUPPORTED",
        "AI image description is not available in this environment",
      );
    }

    // 2. Resolve image and verify ownership
    const image = ctx.entities.image_id;
    const imageId = image.id;

    // 5. Call describeImage
    const descResult = await tryCatch(deps.generation.describeImage({ userId, imageId }));
    if (!descResult.ok) {
      return errorResult("DESCRIPTION_FAILED", descResult.error.message, true);
    }
    if (!descResult.data || descResult.data.error) {
      return errorResult(
        "DESCRIPTION_FAILED",
        descResult.data?.error ?? "Description failed",
        true,
      );
    }

    // 6. Optionally extract palette
    let palette: string[] | undefined;
    if (deps.generation.extractPalette) {
      const paletteResult = await tryCatch(deps.generation.extractPalette({ userId, imageId }));
      if (paletteResult.ok && paletteResult.data && !paletteResult.data.error) {
        palette = paletteResult.data.palette;
      }
    }

    // 8. Build tags — merge or overwrite
    const newTags = descResult.data.tags;
    let mergedTags: string[];
    if (overwrite) {
      mergedTags = newTags;
    } else {
      const existingSet = new Set(image.tags ?? []);
      const addedTags = newTags.filter((t) => !existingSet.has(t));
      mergedTags = [...(image.tags ?? []), ...addedTags];
    }

    // 9. Persist to DB
    await tryCatch(
      deps.db.imageUpdate(imageId, {
        tags: mergedTags,
        description: descResult.data.description,
      }),
    );

    // 10. Calculate tags_added count
    const existingTagCount = (image.tags ?? []).length;
    const tagsAdded = overwrite ? newTags.length : mergedTags.length - existingTagCount;

    ctx.notify?.(
      toolEvent("image:updated", imageId, {
        tags: mergedTags,
        description: descResult.data.description,
      }),
    );

    return jsonResult({
      image_id: imageId,
      tags_added: tagsAdded,
      total_tags: mergedTags.length,
      tags: mergedTags,
      description_updated: true,
      description: descResult.data.description,
      palette: palette ?? null,
      credits_cost: ctx.billing.creditsCost,
      overwrite,
    });
  });

export const autoTag = autoTagTool.handler;
export const AutoTagInputSchema = z.object(autoTagTool.inputSchema);
export type AutoTagInput = Parameters<typeof autoTag>[0];

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
