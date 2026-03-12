import { z } from "zod";
import { jsonResult } from "../../mcp/types.js";
import {
  imageProcedure,
  withOwnership,
  withResolves,
} from "../../lazy-imports/image-middleware.js";

export const versionsTool = imageProcedure
  .use(withResolves({ image_id: "image" }))
  .use(withOwnership(["image_id"]))
  .tool("versions", "List all enhancement versions for an image", {
    image_id: z.string().describe("ID of the image to get versions for"),
  })
  .handler(async ({ input: _input, ctx: ctx }) => {
    const { userId, deps } = ctx;
    const image = ctx.entities.image_id;
    const imageId = image.id;

    const jobsResult = await tryCatch(deps.db.jobFindMany({ userId, imageId }));

    if (!jobsResult.ok || !jobsResult.data) {
      return jsonResult({
        imageId: imageId,
        imageName: image.name,
        versions: [],
        count: 0,
      });
    }

    const versionList = jobsResult.data.map((job) => ({
      jobId: job.id,
      status: job.status,
      tier: job.tier,
      creditsCost: job.creditsCost,
      enhancedUrl: job.enhancedUrl,
      enhancedWidth: job.enhancedWidth,
      enhancedHeight: job.enhancedHeight,
      createdAt: job.createdAt,
    }));

    return jsonResult({
      imageId: imageId,
      imageName: image.name,
      versions: versionList,
      count: versionList.length,
    });
  });

export const versions = versionsTool.handler;
export const VersionsInputSchema = z.object(versionsTool.inputSchema);
export type VersionsInput = Parameters<typeof versions>[0];

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
