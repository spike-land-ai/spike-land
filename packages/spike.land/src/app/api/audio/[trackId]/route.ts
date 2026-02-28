import logger from "@/lib/logger";

/**
 * Audio Track API Route - GET and DELETE operations
 * Resolves #332
 */

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  deleteAudioFromR2,
  downloadAudioFromR2,
  generateAudioKey,
  getAudioMetadata,
  isAudioStorageConfigured,
} from "@/lib/storage/audio-r2-client";
import { tryCatch } from "@/lib/try-catch";
import { NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ trackId: string; }>;
}

/**
 * GET /api/audio/[trackId]
 * Download an audio file
 */
export async function GET(request: Request, { params }: RouteParams) {
  // Check authentication
  const { data: session, error: authError } = await tryCatch(auth());
  if (authError) {
    logger.error("Error downloading audio:", authError);
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

  const { data: resolvedParams, error: paramsError } = await tryCatch(params);
  if (paramsError) {
    logger.error("Error downloading audio:", paramsError);
    return NextResponse.json(
      {
        error: paramsError instanceof Error
          ? paramsError.message
          : "Internal server error",
      },
      { status: 500 },
    );
  }
  const { trackId } = resolvedParams;
  const url = new URL(request.url);
  const projectId = url.searchParams.get("projectId");
  const format = url.searchParams.get("format") || "wav";

  if (!projectId) {
    return NextResponse.json(
      { error: "Missing required parameter: projectId" },
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
    logger.error("Error downloading audio:", projectError);
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

  // Generate R2 key
  const key = generateAudioKey(session.user.id, projectId, trackId, format);

  // Download from R2
  const { data: buffer, error: downloadError } = await tryCatch(
    downloadAudioFromR2(key),
  );
  if (downloadError) {
    logger.error("Error downloading audio:", downloadError);
    return NextResponse.json(
      {
        error: downloadError instanceof Error
          ? downloadError.message
          : "Internal server error",
      },
      { status: 500 },
    );
  }
  if (!buffer) {
    return NextResponse.json(
      { error: "Audio file not found" },
      { status: 404 },
    );
  }

  // Return the audio file - convert Buffer to Uint8Array for BodyInit compatibility
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": `audio/${format}`,
      "Content-Length": buffer.length.toString(),
      "Content-Disposition": `attachment; filename="${trackId}.${format}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}

/**
 * DELETE /api/audio/[trackId]
 * Delete an audio file
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  // Check authentication
  const { data: session, error: authError } = await tryCatch(auth());
  if (authError) {
    logger.error("Error deleting audio:", authError);
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

  const { data: resolvedParams, error: paramsError } = await tryCatch(params);
  if (paramsError) {
    logger.error("Error deleting audio:", paramsError);
    return NextResponse.json(
      {
        error: paramsError instanceof Error
          ? paramsError.message
          : "Internal server error",
      },
      { status: 500 },
    );
  }
  const { trackId } = resolvedParams;
  const url = new URL(request.url);
  const projectId = url.searchParams.get("projectId");
  const format = url.searchParams.get("format") || "wav";

  if (!projectId) {
    return NextResponse.json(
      { error: "Missing required parameter: projectId" },
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
    logger.error("Error deleting audio:", projectError);
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

  // Generate R2 key
  const key = generateAudioKey(session.user.id, projectId, trackId, format);

  // Delete from R2
  const { data: result, error: deleteError } = await tryCatch(
    deleteAudioFromR2(key),
  );
  if (deleteError) {
    logger.error("Error deleting audio:", deleteError);
    return NextResponse.json(
      {
        error: deleteError instanceof Error
          ? deleteError.message
          : "Internal server error",
      },
      { status: 500 },
    );
  }
  if (!result.success) {
    return NextResponse.json(
      { error: result.error || "Delete failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    key: result.key,
  });
}

/**
 * HEAD /api/audio/[trackId]
 * Get metadata for an audio file
 */
export async function HEAD(request: Request, { params }: RouteParams) {
  // Check authentication
  const { data: session, error: authError } = await tryCatch(auth());
  if (authError) {
    return new NextResponse(null, { status: 500 });
  }
  if (!session?.user?.id) {
    return new NextResponse(null, { status: 401 });
  }

  // Check R2 configuration
  if (!isAudioStorageConfigured()) {
    return new NextResponse(null, { status: 503 });
  }

  const { data: resolvedParams, error: paramsError } = await tryCatch(params);
  if (paramsError) {
    return new NextResponse(null, { status: 500 });
  }
  const { trackId } = resolvedParams;
  const url = new URL(request.url);
  const projectId = url.searchParams.get("projectId");
  const format = url.searchParams.get("format") || "wav";

  if (!projectId) {
    return new NextResponse(null, { status: 400 });
  }

  // Validate project ownership
  const { data: project, error: projectError } = await tryCatch(
    prisma.audioMixerProject.findFirst({
      where: { id: projectId, userId: session.user.id },
    }),
  );
  if (projectError) {
    return new NextResponse(null, { status: 500 });
  }
  if (!project) {
    return new NextResponse(null, { status: 404 });
  }

  // Generate R2 key
  const key = generateAudioKey(session.user.id, projectId, trackId, format);

  // Get metadata from R2
  const { data: metadata, error: metadataError } = await tryCatch(
    getAudioMetadata(key),
  );
  if (metadataError) {
    return new NextResponse(null, { status: 500 });
  }
  if (!metadata) {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(null, {
    headers: {
      "Content-Length": metadata.size.toString(),
      "Content-Type": metadata.contentType || `audio/${format}`,
      "Last-Modified": metadata.lastModified?.toUTCString() || "",
    },
  });
}
