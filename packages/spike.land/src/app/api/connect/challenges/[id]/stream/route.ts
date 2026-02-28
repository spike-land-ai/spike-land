export const maxDuration = 300;

/**
 * GET /api/connect/challenges/[id]/stream?submissionId=xxx
 * SSE endpoint for arena submission progress
 *
 * Follows the pattern from src/app/api/apps/[id]/messages/stream/route.ts
 */

import { getArenaEvents, isSubmissionWorking } from "@/lib/arena/redis";
import type { ArenaSSEEvent } from "@/lib/arena/types";
import prisma from "@/lib/prisma";
import { tryCatch } from "@/lib/try-catch";
import type { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string; }>; },
) {
  const { data: params, error: paramsError } = await tryCatch(context.params);
  if (paramsError) {
    return new Response(JSON.stringify({ error: "Invalid parameters" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const submissionId = request.nextUrl.searchParams.get("submissionId");
  if (!submissionId) {
    return new Response(JSON.stringify({ error: "submissionId required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Verify submission belongs to this challenge
  const { data: submission, error: subError } = await tryCatch(
    prisma.arenaSubmission.findFirst({
      where: { id: submissionId, challengeId: params.id },
      select: { id: true, status: true },
    }),
  );

  if (subError || !submission) {
    return new Response(JSON.stringify({ error: "Submission not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let lastProcessedTimestamp = Date.now();

      // Send connected event
      const connectedEvent: ArenaSSEEvent = {
        type: "connected",
        data: { submissionId, status: submission.status },
        timestamp: Date.now(),
      };
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify(connectedEvent)}\n\n`),
      );

      // Check working status
      isSubmissionWorking(submissionId).then(working => {
        if (working) {
          try {
            const event: ArenaSSEEvent = {
              type: "phase_update",
              data: {
                phase: "GENERATING",
                message: "Generation in progress...",
              },
              timestamp: Date.now(),
            };
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
            );
          } catch {
            // Client disconnected
          }
        }
      });

      // Heartbeat every 30s
      const heartbeatInterval = setInterval(() => {
        try {
          const heartbeat: ArenaSSEEvent = {
            type: "heartbeat",
            data: null,
            timestamp: Date.now(),
          };
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(heartbeat)}\n\n`),
          );
        } catch {
          clearInterval(heartbeatInterval);
        }
      }, 30000);

      // Poll Redis every 2s
      const redisInterval = setInterval(() => {
        getArenaEvents(submissionId, lastProcessedTimestamp)
          .then(events => {
            for (const event of events) {
              try {
                if (event.timestamp <= lastProcessedTimestamp) continue;
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
                );
                lastProcessedTimestamp = Math.max(
                  lastProcessedTimestamp,
                  event.timestamp,
                );

                // Close stream if terminal state
                const eventData = event.data as { phase?: string; } | undefined;
                if (
                  event.type === "scored"
                  || event.type === "failed"
                  || eventData?.phase === "SCORED"
                  || eventData?.phase === "FAILED"
                ) {
                  clearInterval(heartbeatInterval);
                  clearInterval(redisInterval);
                  controller.close();
                }
              } catch {
                // Connection closed
              }
            }
          })
          .catch(() => {
            // Redis polling error - don't stop
          });
      }, 2000);

      const cleanup = () => {
        clearInterval(heartbeatInterval);
        clearInterval(redisInterval);
      };

      (controller as unknown as { cleanup: () => void; }).cleanup = cleanup;
    },

    cancel(controller) {
      const cleanup = (controller as unknown as { cleanup?: () => void; }).cleanup;
      if (cleanup) cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
