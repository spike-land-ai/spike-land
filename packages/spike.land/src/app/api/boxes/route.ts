import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { BoxStatus } from "@prisma/client";
import { after, NextResponse } from "next/server";
import { z } from "zod";

const createBoxSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name is too long"),
  tierId: z.string().min(1, "Tier ID is required"),
});

import { tryCatch } from "@/lib/try-catch";
import { logger } from "@/lib/logger";

export async function GET() {
  const { data: session, error: authError } = await tryCatch(auth());
  if (authError || !session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { data: boxes, error: boxesError } = await tryCatch(
    prisma.box.findMany({
      where: {
        userId: session.user.id,
        deletedAt: null,
      },
      include: {
        tier: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
  );

  if (boxesError) {
    logger.error("[BOXES_GET]", boxesError);
    return new NextResponse("Internal Error", { status: 500 });
  }

  return NextResponse.json(boxes);
}

export async function POST(req: Request) {
  const { data: session, error: authError } = await tryCatch(auth());
  if (authError || !session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { data: json, error: jsonError } = await tryCatch(req.json());
  if (jsonError) {
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  const parseResult = createBoxSchema.safeParse(json);

  if (!parseResult.success) {
    return new NextResponse(JSON.stringify(parseResult.error.flatten()), {
      status: 400,
    });
  }

  const body = parseResult.data;

  // Verify tier exists
  const { data: tier, error: tierError } = await tryCatch(
    prisma.boxTier.findUnique({
      where: { id: body.tierId },
    }),
  );

  if (tierError) {
    logger.error("Database error (tier lookup):", tierError);
    return new NextResponse("Internal Error", { status: 500 });
  }

  if (!tier) {
    return new NextResponse("Invalid Tier", { status: 400 });
  }

  // Check user balance and consume credits
  const cost = tier.pricePerHour; // Charge 1 hour upfront

  // Lazy import to avoid circular dependencies if any
  const { WorkspaceCreditManager } = await import(
    "@/lib/credits/workspace-credit-manager"
  );

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

  // Container provisioning is handled asynchronously. The box is created with status CREATING,
  // and a background worker (or cloud function) triggers the actual provisioning.
  // We use `after` to ensure the response is sent immediately while provisioning starts.

  const { data: creditResult, error: creditError } = await tryCatch(
    WorkspaceCreditManager.consumeCredits({
      userId: session.user.id,
      amount: cost,
      source: "box_creation",
      sourceId: "pending",
    }),
  );

  if (creditError || !creditResult?.success) {
    logger.error("Credit consumption error:", creditError);
    return new NextResponse("Failed to process payment", { status: 500 });
  }

  const { data: box, error: createError } = await tryCatch(
    prisma.box.create({
      data: {
        name: body.name,
        userId: session.user.id,
        tierId: body.tierId,
        status: BoxStatus.CREATING,
        connectionUrl: null,
      },
    }),
  );

  if (createError) {
    // Refund if creation fails
    await tryCatch(
      WorkspaceCreditManager.refundCredits(session.user.id, cost),
    );
    logger.error("Box creation failed:", createError);
    return new NextResponse("Internal Error", { status: 500 });
  }

  // Create action log
  const { error: actionError } = await tryCatch(
    prisma.boxAction.create({
      data: {
        boxId: box.id,
        action: "CREATE",
        status: "COMPLETED",
        metadata: { cost },
      },
    }),
  );

  if (actionError) {
    logger.error("Failed to log box action:", actionError);
    // Non-fatal error
  }

  // Trigger provisioning asynchronously
  after(async () => {
    // Dynamic import to avoid loading heavy dependencies (workflow engine) during route initialization
    // and to isolate the provisioning logic from the main response path.
    const { triggerBoxProvisioning } = await import("@/lib/boxes/provisioning");
    await triggerBoxProvisioning(box.id);
  });

  return NextResponse.json(box);
}
