export const maxDuration = 300;

/**
 * Agent SSE Stream API
 *
 * GET /api/agents/stream
 * Server-Sent Events endpoint for real-time agent status updates.
 */

import { auth } from "@/lib/auth";
import { getAgentSSEEvents } from "@/lib/agents/redis-client";
import { tryCatch } from "@/lib/try-catch";
import { type NextRequest } from "next/server";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  // Authenticate the request
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;

  // Get last event timestamp from query params
  const { searchParams } = new URL(req.url);
  const lastEventId = searchParams.get("lastEventId");
  let lastTimestamp = lastEventId ? parseInt(lastEventId, 10) : Date.now();

  // Create an SSE stream backed by ReadableStream to avoid TransformStream
  // runtime compatibility issues in CI.
  const encoder = new TextEncoder();

  // Function to send SSE event
  const sendEvent = async (
    controller: ReadableStreamDefaultController<Uint8Array>,
    event: string,
    data: unknown,
    id?: string,
  ) => {
    const eventStr = `event: ${event}\ndata: ${JSON.stringify(data)}\n${id ? `id: ${id}\n` : ""}\n`;
    controller.enqueue(encoder.encode(eventStr));
  };

  // Function to send heartbeat
  const sendHeartbeat = async (
    controller: ReadableStreamDefaultController<Uint8Array>,
  ) => {
    await sendEvent(controller, "heartbeat", { timestamp: Date.now() });
  };

  // Polling interval (check for new events every 2 seconds)
  const pollInterval = 2000;
  let isActive = true;

  // Maximum connection duration to prevent memory leaks (5 minutes)
  const MAX_CONNECTION_DURATION = 5 * 60 * 1000;
  const connectionStart = Date.now();

  // Start polling for events
  const pollForEvents = async (
    controller: ReadableStreamDefaultController<Uint8Array>,
  ) => {
    while (isActive) {
      // Check if connection has exceeded maximum duration
      if (Date.now() - connectionStart > MAX_CONNECTION_DURATION) {
        isActive = false;
        break;
      }
      try {
        const { data: events, error } = await tryCatch(
          getAgentSSEEvents(userId, lastTimestamp),
        );

        if (error) {
          logger.error("Error fetching SSE events:", error);
        } else if (events && events.length > 0) {
          for (const event of events) {
            await sendEvent(
              controller,
              event.type,
              event,
              event.timestamp.toString(),
            );
            lastTimestamp = Math.max(lastTimestamp, event.timestamp);
          }
        }

        // Send heartbeat every poll
        await sendHeartbeat(controller);

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      } catch (err) {
        logger.error("SSE poll error:", err);
        // If stream writes fail, connection is closed
        if (
          err instanceof Error
          && (err.message.includes("ReadableStream")
            || err.message.includes("Controller is already closed"))
        ) {
          isActive = false;
          break;
        }
        // Otherwise, wait and retry
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }

    // Close stream when done
    try {
      controller.close();
    } catch {
      // Ignore close errors
    }
  };

  // Handle client disconnect
  req.signal.addEventListener("abort", () => {
    isActive = false;
  });

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      void pollForEvents(controller).catch(err => {
        logger.error("SSE polling failed:", err);
        isActive = false;
      });
    },
    cancel() {
      isActive = false;
    },
  });

  // Return SSE response
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
