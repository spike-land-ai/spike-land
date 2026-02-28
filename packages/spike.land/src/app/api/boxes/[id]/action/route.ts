import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";
import { tryCatch } from "@/lib/try-catch";
import { BoxActionType, BoxStatus } from "@prisma/client";
import { after, NextResponse } from "next/server";
import { z } from "zod";

type RouteContext = { params: Promise<{ id: string; }>; };

const actionSchema = z.object({
  action: z.enum([
    BoxActionType.START,
    BoxActionType.STOP,
    BoxActionType.RESTART,
  ]),
});

type ValidAction = z.infer<typeof actionSchema>["action"];

/** Maps a validated action to the transitional BoxStatus. */
const ACTION_TO_STATUS: Record<ValidAction, BoxStatus> = {
  [BoxActionType.START]: BoxStatus.STARTING,
  [BoxActionType.STOP]: BoxStatus.STOPPING,
  [BoxActionType.RESTART]: BoxStatus.STARTING,
};

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

export async function POST(
  req: Request,
  { params }: RouteContext,
) {
  const { data: session, error: authError } = await tryCatch(auth());
  if (authError || !session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const resolved = await resolveId(params);
  if (resolved instanceof NextResponse) return resolved;
  const { id } = resolved;

  const { data: json, error: jsonError } = await tryCatch(req.json());
  if (jsonError) {
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  const parseResult = actionSchema.safeParse(json);
  if (!parseResult.success) {
    return new NextResponse(JSON.stringify(parseResult.error.flatten()), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { action } = parseResult.data;

  const { data: box, error: boxError } = await tryCatch(
    prisma.box.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
    }),
  );

  if (boxError) {
    logger.error("[BOX_ACTION] Database error (box lookup):", boxError);
    return new NextResponse("Internal Error", { status: 500 });
  }

  if (!box) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // Persist an audit record of the requested action.
  const { error: actionLogError } = await tryCatch(
    prisma.boxAction.create({
      data: {
        boxId: id,
        action,
        status: "PENDING",
      },
    }),
  );

  if (actionLogError) {
    logger.error("[BOX_ACTION] Database error (create action log):", actionLogError);
    return new NextResponse("Internal Error", { status: 500 });
  }

  const newStatus = ACTION_TO_STATUS[action];

  const { data: updatedBox, error: updateError } = await tryCatch(
    prisma.box.update({
      where: { id, userId: session.user.id },
      data: { status: newStatus },
    }),
  );

  if (updateError) {
    logger.error("[BOX_ACTION] Database error (update box status):", updateError);
    return new NextResponse("Internal Error", { status: 500 });
  }

  // Trigger the real EC2 operation in the background so we can respond
  // immediately with the transitional status.  We capture ec2InstanceId into a
  // const so TypeScript narrows the type correctly inside the async callback.
  if (box.ec2InstanceId) {
    const instanceId: string = box.ec2InstanceId;

    after(async () => {
      const {
        startBoxInstance,
        stopBoxInstance,
        restartBoxInstance,
        syncBoxStatus,
      } = await import("@/lib/boxes/ec2-actions");

      let success = false;
      if (action === BoxActionType.START) {
        success = await startBoxInstance(instanceId);
      } else if (action === BoxActionType.STOP) {
        success = await stopBoxInstance(instanceId);
      } else if (action === BoxActionType.RESTART) {
        success = await restartBoxInstance(instanceId);
      }

      if (success) {
        // Allow 10 s for the EC2 state transition to settle before syncing.
        // AWS typically reflects the new state within a few seconds; 10 s is a
        // conservative buffer that avoids polling the API repeatedly.
        await new Promise<void>(resolve => setTimeout(resolve, 10_000));
        await syncBoxStatus(id);
      } else {
        logger.error("[BOX_ACTION] EC2 operation failed", { action, instanceId, boxId: id });
      }
    });
  }

  return NextResponse.json(updatedBox);
}
