/**
 * Audio Upload API Route
 * Resolves #332
 */

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  generateAudioKey,
  isAudioStorageConfigured,
  uploadAudioToR2,
} from "@/lib/storage/audio-r2-client";
import { tryCatch } from "@/lib/try-catch";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

const MAX_AUDIO_SIZE = 500 * 1024 * 1024; // 500MB

export async function POST(request: Request) {
  // Check authentication
  const { data: session, error: authError } = await tryCatch(auth());
  if (authError) {
    logger.error("Error in audio upload:", authError);
    return NextResponse.json(
      {
        error: authError instanceof Error
          ? authError.message
          : "Internal server error",
      },
      { status: 500 },
    );
  }
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  // Check R2 configuration
  if (!isAudioStorageConfigured()) {
    return NextResponse.json(
      { error: "Audio storage is not configured" },
      { status: 503 },
    );
  }

  // Parse form data
  const { data: formData, error: formDataError } = await tryCatch(
    request.formData(),
  );
  if (formDataError) {
    logger.error("Error in audio upload:", formDataError);
    return NextResponse.json(
      {
        error: formDataError instanceof Error
          ? formDataError.message
          : "Internal server error",
      },
      { status: 500 },
    );
  }

  const file = formData.get("file") as File | null;
  const projectId = formData.get("projectId") as string | null;
  const trackId = formData.get("trackId") as string | null;
  const format = formData.get("format") as string | null;
  const durationStr = formData.get("duration") as string | null;

  if (!file) {
    return NextResponse.json(
      { error: "No file provided" },
      { status: 400 },
    );
  }

  if (!projectId || !trackId || !format) {
    return NextResponse.json(
      { error: "Missing required fields: projectId, trackId, format" },
      { status: 400 },
    );
  }

  // Validate audio format
  const ALLOWED_FORMATS = ["wav", "mp3", "webm", "ogg", "flac", "aac", "m4a"];
  if (!ALLOWED_FORMATS.includes(format.toLowerCase())) {
    return NextResponse.json(
      { error: `Invalid audio format. Allowed: ${ALLOWED_FORMATS.join(", ")}` },
      { status: 400 },
    );
  }

  // Validate project ownership
  const { data: project, error: projectError } = await tryCatch(
    prisma.audioMixerProject.findFirst({
      where: { id: projectId, userId: session.user.id },
    }),
  );
  if (projectError) {
    logger.error("Error in audio upload:", projectError);
    return NextResponse.json(
      {
        error: projectError instanceof Error
          ? projectError.message
          : "Internal server error",
      },
      { status: 500 },
    );
  }
  if (!project) {
    return NextResponse.json(
      { error: "Project not found or access denied" },
      { status: 404 },
    );
  }

  // Validate file size
  if (file.size > MAX_AUDIO_SIZE) {
    return NextResponse.json(
      { error: `File size exceeds maximum allowed size of 500MB` },
      { status: 400 },
    );
  }

  // Convert file to buffer
  const { data: arrayBuffer, error: bufferError } = await tryCatch(
    file.arrayBuffer(),
  );
  if (bufferError) {
    logger.error("Error in audio upload:", bufferError);
    return NextResponse.json(
      {
        error: bufferError instanceof Error
          ? bufferError.message
          : "Internal server error",
      },
      { status: 500 },
    );
  }
  const buffer = Buffer.from(arrayBuffer);

  // Generate R2 key
  const key = generateAudioKey(session.user.id, projectId, trackId, format);

  // Upload to R2
  const { data: result, error: uploadError } = await tryCatch(
    uploadAudioToR2({
      key,
      buffer,
      contentType: file.type || `audio/${format}`,
      metadata: {
        projectId,
        trackId,
        duration: durationStr || "0",
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
      },
    }),
  );

  if (uploadError) {
    logger.error("Error in audio upload:", uploadError);
    return NextResponse.json(
      {
        error: uploadError instanceof Error
          ? uploadError.message
          : "Internal server error",
      },
      { status: 500 },
    );
  }

  if (!result.success) {
    return NextResponse.json(
      { error: result.error || "Upload failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    key: result.key,
    url: result.url,
    sizeBytes: result.sizeBytes,
  });
}
