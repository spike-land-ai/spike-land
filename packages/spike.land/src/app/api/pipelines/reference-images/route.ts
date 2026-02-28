import { auth } from "@/lib/auth";
import type { ReferenceImage } from "@/lib/ai/pipeline-types";
import {
  detectMimeType,
  getImageDimensionsFromBuffer,
} from "@/lib/images/image-dimensions";
import prisma from "@/lib/prisma";
import { deleteFromR2, uploadToR2 } from "@/lib/storage/r2-client";
import type { Prisma } from "@prisma/client";
import crypto from "crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB per file
const MAX_REFERENCE_IMAGES = 3; // Maximum reference images per pipeline
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export interface ReferenceImageUploadResult {
  success: boolean;
  referenceImage?: {
    url: string;
    r2Key: string;
    description?: string;
  };
  error?: string;
}

/**
 * POST /api/pipelines/reference-images
 * Upload a reference image for a pipeline's prompt configuration
 *
 * FormData:
 * - file: File (required) - The image file to upload
 * - pipelineId: string (required) - The pipeline to associate with
 * - description: string (optional) - Description of the reference image
 */
import { tryCatch } from "@/lib/try-catch";
import { logger } from "@/lib/logger";

export async function POST(
  request: NextRequest,
): Promise<NextResponse<ReferenceImageUploadResult>> {
  const { data: session, error: authError } = await tryCatch(auth());
  if (authError || !session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 },
    );
  }

  const { data: formData, error: formDataError } = await tryCatch(
    request.formData(),
  );

  if (formDataError) {
    return NextResponse.json(
      { success: false, error: "Failed to read form data" },
      { status: 400 },
    );
  }

  const file = formData.get("file") as File | null;
  const pipelineId = formData.get("pipelineId") as string | null;
  const description = formData.get("description") as string | null;

  // Validate required fields
  if (!file) {
    return NextResponse.json(
      { success: false, error: "File is required" },
      { status: 400 },
    );
  }

  if (!pipelineId) {
    return NextResponse.json(
      { success: false, error: "Pipeline ID is required" },
      { status: 400 },
    );
  }

  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      {
        success: false,
        error: `Invalid file type. Allowed: ${ALLOWED_TYPES.join(", ")}`,
      },
      { status: 400 },
    );
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      {
        success: false,
        error: `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      },
      { status: 400 },
    );
  }

  // Check pipeline exists and user owns it
  const { data: pipeline, error: dbError } = await tryCatch(
    prisma.enhancementPipeline.findUnique({
      where: { id: pipelineId },
      select: {
        id: true,
        userId: true,
        promptConfig: true,
      },
    }),
  );

  if (dbError) {
    logger.error("Database error:", dbError);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }

  if (!pipeline) {
    return NextResponse.json(
      { success: false, error: "Pipeline not found" },
      { status: 404 },
    );
  }

  if (pipeline.userId !== session.user.id) {
    return NextResponse.json(
      {
        success: false,
        error: "You can only upload reference images to your own pipelines",
      },
      { status: 403 },
    );
  }

  // Check current reference image count
  const promptConfig = (pipeline.promptConfig as Record<string, unknown>)
    || {};
  const existingRefs = (promptConfig.referenceImages as ReferenceImage[])
    || [];

  if (existingRefs.length >= MAX_REFERENCE_IMAGES) {
    return NextResponse.json(
      {
        success: false,
        error: `Maximum ${MAX_REFERENCE_IMAGES} reference images allowed per pipeline`,
      },
      { status: 400 },
    );
  }

  // Process image
  const { data: arrayBuffer, error: bufferError } = await tryCatch(
    file.arrayBuffer(),
  );
  if (bufferError) {
    return NextResponse.json(
      { success: false, error: "Failed to read file buffer" },
      { status: 500 },
    );
  }
  const buffer = Buffer.from(arrayBuffer);

  // Get image metadata using lightweight header parsing (no native deps)
  // Note: Client should pre-resize images using browser-image-processor.ts
  const dimensions = getImageDimensionsFromBuffer(buffer);

  if (!dimensions || !dimensions.width || !dimensions.height) {
    return NextResponse.json(
      { success: false, error: "Invalid image format" },
      { status: 400 },
    );
  }

  // Use the buffer directly - client should pre-resize before upload
  // Max dimension recommendation is 1024px for reference images
  const processedBuffer: Buffer = buffer;

  // Generate unique ID and R2 key
  const imageId = crypto.randomUUID();
  const extension = dimensions.format === "jpeg" ? "jpg" : dimensions.format;
  const r2Key = `pipelines/${pipelineId}/references/${imageId}.${extension}`;
  const contentType = detectMimeType(buffer);

  // Upload to R2
  const { data: uploadResult, error: uploadError } = await tryCatch(
    uploadToR2({
      key: r2Key,
      buffer: processedBuffer,
      contentType,
      metadata: {
        pipelineId,
        userId: session.user.id,
        description: description || "",
      },
    }),
  );

  if (uploadError || !uploadResult?.success) {
    return NextResponse.json(
      {
        success: false,
        error: uploadResult?.error || "Failed to upload image",
      },
      { status: 500 },
    );
  }

  // Update pipeline's promptConfig with new reference image
  const newReferenceImage: ReferenceImage = {
    url: uploadResult.url,
    r2Key,
    ...(description && { description }),
  };

  const updatedReferenceImages: ReferenceImage[] = [
    ...existingRefs,
    newReferenceImage,
  ];

  const { error: updateError } = await tryCatch(
    prisma.enhancementPipeline.update({
      where: { id: pipelineId },
      data: {
        promptConfig: {
          ...promptConfig,
          referenceImages: updatedReferenceImages,
        } as unknown as Prisma.InputJsonValue,
      },
    }),
  );

  if (updateError) {
    logger.error("Database update error:", updateError);
    return NextResponse.json(
      { success: false, error: "Failed to update pipeline" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    referenceImage: newReferenceImage,
  });
}

/**
 * DELETE /api/pipelines/reference-images
 * Remove a reference image from a pipeline
 *
 * Body:
 * - pipelineId: string (required) - The pipeline ID
 * - r2Key: string (required) - The R2 key of the image to remove
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const { data: session, error: authError } = await tryCatch(auth());
  if (authError || !session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 },
    );
  }

  const { data: body, error: jsonError } = await tryCatch(request.json());
  if (jsonError) {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const { pipelineId, r2Key } = body;

  if (!pipelineId || !r2Key) {
    return NextResponse.json(
      { success: false, error: "Pipeline ID and R2 key are required" },
      { status: 400 },
    );
  }

  // Check pipeline exists and user owns it
  const { data: pipeline, error: dbError } = await tryCatch(
    prisma.enhancementPipeline.findUnique({
      where: { id: pipelineId },
      select: {
        id: true,
        userId: true,
        promptConfig: true,
      },
    }),
  );

  if (dbError) {
    logger.error("Database error:", dbError);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }

  if (!pipeline) {
    return NextResponse.json(
      { success: false, error: "Pipeline not found" },
      { status: 404 },
    );
  }

  if (pipeline.userId !== session.user.id) {
    return NextResponse.json(
      {
        success: false,
        error: "You can only delete reference images from your own pipelines",
      },
      { status: 403 },
    );
  }

  // Remove from R2
  const { data: deleteResult, error: deleteError } = await tryCatch(
    deleteFromR2(r2Key),
  );

  if (deleteError) {
    logger.error("Failed to delete from R2:", deleteError);
    // Continue anyway to clean up database
  } else if (!deleteResult?.success) {
    logger.error("Failed to delete from R2:", deleteResult?.error);
  }

  // Update pipeline's promptConfig to remove the reference image
  const promptConfig = (pipeline.promptConfig as Record<string, unknown>)
    || {};
  const existingRefs = (promptConfig.referenceImages as ReferenceImage[])
    || [];
  const updatedRefs = existingRefs.filter(ref => ref.r2Key !== r2Key);

  const { error: updateError } = await tryCatch(
    prisma.enhancementPipeline.update({
      where: { id: pipelineId },
      data: {
        promptConfig: {
          ...promptConfig,
          referenceImages: updatedRefs,
        } as unknown as Prisma.InputJsonValue,
      },
    }),
  );

  if (updateError) {
    logger.error("Database update error:", updateError);
    return NextResponse.json(
      { success: false, error: "Failed to update pipeline" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
