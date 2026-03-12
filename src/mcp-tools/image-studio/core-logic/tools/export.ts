import { z } from "zod";

import { errorResult, EXPORT_FORMAT_VALUES, IMG_DEFAULTS, jsonResult } from "../../mcp/types.js";
import { imageProcedure, withResolves } from "../../lazy-imports/image-middleware.js";

export const exportTool = imageProcedure
  .use(withResolves({ image_id: "image" }))
  .tool("export", "Export an image in a specific format and quality", {
    image_id: z.string().describe("ID of the image to export"),
    format: z
      .enum(EXPORT_FORMAT_VALUES)
      .describe("Output format: jpeg, png, webp, or pdf")
      .optional(),
    quality: z.number().describe("Quality level 1-100 (for lossy formats)").optional(),
  })
  .handler(async ({ input: input, ctx: ctx }) => {
    const { deps } = ctx;
    const { format = IMG_DEFAULTS.exportFormat as "jpeg", quality = IMG_DEFAULTS.exportQuality } =
      input;

    const image = ctx.entities.image_id;

    // Verify storage access
    const downloadResult = await tryCatch(deps.storage.download(image.originalR2Key));
    if (!downloadResult.ok) {
      return errorResult("EXPORT_FAILED", "Could not access original image file");
    }

    // For png, quality is not applicable
    const effectiveQuality = format === "png" ? undefined : quality;

    return jsonResult({
      image_id: image.id,
      name: image.name,
      url: image.originalUrl,
      format,
      quality: effectiveQuality,
      originalWidth: image.originalWidth,
      originalHeight: image.originalHeight,
    });
  });

export const exportImage = exportTool.handler;
export const ExportInputSchema = z.object(exportTool.inputSchema);
export type ExportInput = Parameters<typeof exportImage>[0];

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
