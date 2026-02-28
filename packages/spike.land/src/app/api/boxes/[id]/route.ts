import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";
import { tryCatch } from "@/lib/try-catch";
import { BoxStatus } from "@prisma/client";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string; }>; };

/**
 * Resolves and validates the `id` route param.
 * Returns a 400 response if the param cannot be resolved.
 */
async function resolveId(
  params: Promise<{ id: string; }>,
): Promise<{ id: string; } | NextResponse> {
  const { data: paramsData, error: paramsError } = await tryCatch(params);
  if (paramsError || !paramsData) {
    return new NextResponse("Invalid parameters", { status: 400 });
  }
  const { id } = paramsData;
  if (!id || typeof id !== "string" || id.trim() === "") {
    return new NextResponse("Invalid box id", { status: 400 });
  }
  return { id: id.trim() };
}

export async function GET(
  _req: Request,
  { params }: RouteContext,
) {
  const { data: session, error: authError } = await tryCatch(auth());
  if (authError || !session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const resolved = await resolveId(params);
  if (resolved instanceof NextResponse) return resolved;
  const { id } = resolved;

  const { data: box, error: boxError } = await tryCatch(
    prisma.box.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        tier: true,
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    }),
  );

  if (boxError) {
    logger.error("[BOX_GET] Database error:", boxError);
    return new NextResponse("Internal Error", { status: 500 });
  }

  if (!box) {
    return new NextResponse("Not Found", { status: 404 });
  }

  return NextResponse.json(box);
}

export async function DELETE(
  _req: Request,
  { params }: RouteContext,
) {
  const { data: session, error: authError } = await tryCatch(auth());
  if (authError || !session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const resolved = await resolveId(params);
  if (resolved instanceof NextResponse) return resolved;
  const { id } = resolved;

  const { data: box, error: boxError } = await tryCatch(
    prisma.box.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
    }),
  );

  if (boxError) {
    logger.error("[BOX_DELETE] findUnique error:", boxError);
    return new NextResponse("Internal Error", { status: 500 });
  }

  if (!box) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // Terminate the EC2 instance if one is associated.
  // A failed termination is logged but does not block the soft-delete so the
  // record is always marked TERMINATED from our side; manual cleanup of orphan
  // EC2 instances is handled by the cron job at /api/cron/sync-box-status.
  if (box.ec2InstanceId) {
    const { terminateBoxInstance } = await import("@/lib/boxes/ec2-actions");
    const terminated = await terminateBoxInstance(box.ec2InstanceId);
    if (!terminated) {
      logger.warn("[BOX_DELETE] EC2 termination failed; proceeding with soft-delete", {
        boxId: id,
        ec2InstanceId: box.ec2InstanceId,
      });
    }
  }

  const { data: updatedBox, error: updateError } = await tryCatch(
    // Re-assert ownership in the WHERE clause as a defence-in-depth measure.
    prisma.box.update({
      where: { id, userId: session.user.id },
      data: {
        deletedAt: new Date(),
        status: BoxStatus.TERMINATED,
      },
    }),
  );

  if (updateError) {
    logger.error("[BOX_DELETE] update error:", updateError);
    return new NextResponse("Internal Error", { status: 500 });
  }

  return NextResponse.json(updatedBox);
}
