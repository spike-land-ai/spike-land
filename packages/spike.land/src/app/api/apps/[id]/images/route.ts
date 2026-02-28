import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  processAndUploadImage,
  validateImageFile,
} from "@/lib/storage/upload-handler";
import { tryCatch } from "@/lib/try-catch";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

const MAX_IMAGES_PER_REQUEST = 10;

/**
 * GET /api/apps/[id]/images
 * Get all images uploaded for this app
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string; }>; },
) {
  const { data: session, error: authError } = await tryCatch(auth());

  if (authError || !session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: params, error: paramsError } = await tryCatch(context.params);
  if (paramsError) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }
  const { id } = params;

  // Verify user owns this app
  const { data: app, error: appError } = await tryCatch(
    prisma.app.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      select: { id: true },
    }),
  );

  if (appError) {
    logger.error("Error fetching app:", appError);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }

  if (!app) {
    return NextResponse.json({ error: "App not found" }, { status: 404 });
  }

  const { data: images, error: imagesError } = await tryCatch(
    prisma.appImage.findMany({
      where: { appId: id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        originalUrl: true,
        width: true,
        height: true,
        format: true,
        tags: true,
        aiDescription: true,
        createdAt: true,
      },
    }),
  );

  if (imagesError) {
    logger.error("Error fetching images:", imagesError);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }

  return NextResponse.json({ images });
}

/**
 * POST /api/apps/[id]/images
 * Upload image(s) to an app
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; }>; },
) {
  const { data: session, error: authError } = await tryCatch(auth());

  if (authError || !session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: params, error: paramsError } = await tryCatch(context.params);
  if (paramsError) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }
  const { id } = params;

  // Verify user owns this app
  const { data: app, error: appError } = await tryCatch(
    prisma.app.findFirst({
      where: {
        id,
        userId: session.user.id,
        status: { not: "ARCHIVED" },
      },
      select: { id: true },
    }),
  );

  if (appError) {
    logger.error("Error fetching app:", appError);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }

  if (!app) {
    return NextResponse.json({ error: "App not found" }, { status: 404 });
  }

  const { data: formData, error: formError } = await tryCatch(
    request.formData(),
  );

  if (formError) {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const files = formData.getAll("images") as File[];

  if (!files || files.length === 0) {
    return NextResponse.json({ error: "No images provided" }, { status: 400 });
  }

  if (files.length > MAX_IMAGES_PER_REQUEST) {
    return NextResponse.json(
      { error: `Maximum ${MAX_IMAGES_PER_REQUEST} images per upload` },
      { status: 400 },
    );
  }

  const results = [];
  const errors = [];

  for (const file of files) {
    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      errors.push({ filename: file.name, error: validation.error });
      continue;
    }

    // Get buffer from file
    const { data: arrayBuffer, error: bufferError } = await tryCatch(
      file.arrayBuffer(),
    );

    if (bufferError) {
      errors.push({ filename: file.name, error: "Failed to read file" });
      continue;
    }

    const buffer = Buffer.from(arrayBuffer);

    // Process and upload
    const uploadResult = await processAndUploadImage({
      buffer,
      originalFilename: file.name,
      userId: session.user.id,
    });

    if (!uploadResult.success) {
      errors.push({
        filename: file.name,
        error: uploadResult.error || "Upload failed",
      });
      continue;
    }

    // Store in database
    const { data: appImage, error: dbError } = await tryCatch(
      prisma.appImage.create({
        data: {
          appId: id,
          originalUrl: uploadResult.url,
          r2Key: uploadResult.r2Key,
          width: uploadResult.width,
          height: uploadResult.height,
          sizeBytes: uploadResult.sizeBytes,
          format: uploadResult.format,
        },
        select: {
          id: true,
          originalUrl: true,
          width: true,
          height: true,
          format: true,
          createdAt: true,
        },
      }),
    );

    if (dbError) {
      logger.error("Error saving image to database:", dbError);
      errors.push({ filename: file.name, error: "Failed to save to database" });
      continue;
    }

    results.push(appImage);
  }

  return NextResponse.json(
    {
      images: results,
      errors: errors.length > 0 ? errors : undefined,
    },
    { status: results.length > 0 ? 201 : 400 },
  );
}
