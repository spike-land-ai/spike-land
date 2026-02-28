import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { BoxStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

const cloneBoxSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name is too long")
    .optional(),
});

import { tryCatch } from "@/lib/try-catch";
import { logger } from "@/lib/logger";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; }>; },
) {
  const { data: session, error: authError } = await tryCatch(auth());
  if (authError || !session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { data: json, error: jsonError } = await tryCatch(req.json());
  if (jsonError) {
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  const parseResult = cloneBoxSchema.safeParse(json);

  if (!parseResult.success) {
    return new NextResponse(JSON.stringify(parseResult.error.flatten()), {
      status: 400,
    });
  }

  const body = parseResult.data;

  const { data: paramsData, error: paramsError } = await tryCatch(params);
  if (paramsError) {
    return new NextResponse("Invalid parameters", { status: 400 });
  }
  const { id: boxId } = paramsData;

  // Fetch source box
  const { data: sourceBox, error: boxError } = await tryCatch(
    prisma.box.findUnique({
      where: { id: boxId },
      include: { tier: true },
    }),
  );

  if (boxError) {
    logger.error("Database error (box lookup):", boxError);
    return new NextResponse("Internal Error", { status: 500 });
  }

  if (!sourceBox || sourceBox.userId !== session.user.id) {
    return new NextResponse("Box not found", { status: 404 });
  }

  if (!sourceBox.tier) {
    return new NextResponse("Box tier not found", { status: 500 });
  }

  if (sourceBox.deletedAt) {
    return new NextResponse("Cannot clone deleted box", { status: 400 });
  }

  // Lazy import WorkspaceCreditManager
  const { WorkspaceCreditManager } = await import(
    "@/lib/credits/workspace-credit-manager"
  );

  // Cost: Same as new box creation (1 hour of tier price)
  const cost = sourceBox.tier.pricePerHour;

  const { data: hasBalance, error: balanceError } = await tryCatch(
    WorkspaceCreditManager.hasEnoughCredits(session.user.id, cost),
  );

  if (balanceError) {
    logger.error("Credit balance check error:", balanceError);
    return new NextResponse("Internal Error", { status: 500 });
  }

  if (!hasBalance) {
    return new NextResponse("Insufficient Credits", { status: 402 });
  }

  // Consume credits
  const { data: creditResult, error: creditError } = await tryCatch(
    WorkspaceCreditManager.consumeCredits({
      userId: session.user.id,
      amount: cost,
      source: "box_clone",
      sourceId: sourceBox.id,
    }),
  );

  if (creditError || !creditResult?.success) {
    logger.error("Credit consumption error:", creditError);
    return new NextResponse("Failed to process payment", { status: 500 });
  }

  const newName = body.name || `Clone of ${sourceBox.name}`;

  const { data: clonedBox, error: createError } = await tryCatch(
    prisma.box.create({
      data: {
        name: newName,
        userId: session.user.id,
        tierId: sourceBox.tierId, // Same tier
        status: BoxStatus.CREATING,
        connectionUrl: null, // New instance
        // storageVolumeId: sourceBox.storageVolumeId // In real implementation, we'd snapshot the volume first
      },
    }),
  );

  if (createError) {
    // Refund credits
    await tryCatch(
      WorkspaceCreditManager.refundCredits(session.user.id, cost),
    );
    logger.error("Box creation error:", createError);
    return new NextResponse("Failed to create cloned box", { status: 500 });
  }

  // Log action on NEW box
  const { error: logNewError } = await tryCatch(
    prisma.boxAction.create({
      data: {
        boxId: clonedBox.id,
        action: "CREATE",
        status: "COMPLETED",
        metadata: {
          sourceBoxId: sourceBox.id,
          type: "CLONE",
          cost,
        },
      },
    }),
  );

  if (logNewError) {
    logger.error("Failed to log new box action:", logNewError);
    // Non-fatal error
  }

  // Log action on OLD box (optional, maybe "CLONED" action type?)
  const { error: logOldError } = await tryCatch(
    prisma.boxAction.create({
      data: {
        boxId: sourceBox.id,
        action: "CLONE", // Need to ensure this enum value exists
        status: "COMPLETED",
        metadata: {
          newBoxId: clonedBox.id,
        },
      },
    }),
  );

  if (logOldError) {
    logger.error("Failed to log old box action:", logOldError);
    // Non-fatal error
  }

  return NextResponse.json(clonedBox);
}
