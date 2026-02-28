import logger from "@/lib/logger";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { tryCatch } from "@/lib/try-catch";
import { nanoid } from "nanoid";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; }>; },
) {
  const { data: session, error: sessionError } = await tryCatch(auth());
  if (sessionError) {
    logger.error("Error in POST share API:", sessionError);
    return NextResponse.json(
      {
        error: sessionError instanceof Error
          ? sessionError.message
          : "Failed to generate share link",
      },
      { status: 500 },
    );
  }

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: resolvedParams, error: paramsError } = await tryCatch(params);
  if (paramsError) {
    logger.error("Error in POST share API:", paramsError);
    return NextResponse.json(
      {
        error: paramsError instanceof Error
          ? paramsError.message
          : "Failed to generate share link",
      },
      { status: 500 },
    );
  }

  const { id } = resolvedParams;

  const { data: image, error: findError } = await tryCatch(
    prisma.enhancedImage.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        shareToken: true,
      },
    }),
  );

  if (findError) {
    logger.error("Error in POST share API:", findError);
    return NextResponse.json(
      {
        error: findError instanceof Error
          ? findError.message
          : "Failed to generate share link",
      },
      { status: 500 },
    );
  }

  if (!image) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  if (image.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (image.shareToken) {
    return NextResponse.json({
      shareToken: image.shareToken,
      shareUrl: `https://spike.land/share/${image.shareToken}`,
    });
  }

  const shareToken = nanoid(12);

  const { error: updateError } = await tryCatch(
    prisma.enhancedImage.update({
      where: { id },
      data: { shareToken },
    }),
  );

  if (updateError) {
    logger.error("Error in POST share API:", updateError);
    return NextResponse.json(
      {
        error: updateError instanceof Error
          ? updateError.message
          : "Failed to generate share link",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    shareToken,
    shareUrl: `https://spike.land/share/${shareToken}`,
  });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; }>; },
) {
  const { data: session, error: sessionError } = await tryCatch(auth());
  if (sessionError) {
    logger.error("Error in GET share API:", sessionError);
    return NextResponse.json(
      {
        error: sessionError instanceof Error
          ? sessionError.message
          : "Failed to get share link",
      },
      { status: 500 },
    );
  }

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: resolvedParams, error: paramsError } = await tryCatch(params);
  if (paramsError) {
    logger.error("Error in GET share API:", paramsError);
    return NextResponse.json(
      {
        error: paramsError instanceof Error
          ? paramsError.message
          : "Failed to get share link",
      },
      { status: 500 },
    );
  }

  const { id } = resolvedParams;

  const { data: image, error: findError } = await tryCatch(
    prisma.enhancedImage.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        shareToken: true,
      },
    }),
  );

  if (findError) {
    logger.error("Error in GET share API:", findError);
    return NextResponse.json(
      {
        error: findError instanceof Error
          ? findError.message
          : "Failed to get share link",
      },
      { status: 500 },
    );
  }

  if (!image) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  if (image.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!image.shareToken) {
    return NextResponse.json({ shareToken: null, shareUrl: null });
  }

  return NextResponse.json({
    shareToken: image.shareToken,
    shareUrl: `https://spike.land/share/${image.shareToken}`,
  });
}
