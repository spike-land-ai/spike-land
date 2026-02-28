import logger from "@/lib/logger";

export const maxDuration = 300;

import {
  addConnection,
  getCodespaceSSEEvents,
  getConnections,
  removeConnection,
} from "@/lib/codespace/broadcast";
import type { CodespaceSSEEvent } from "@/lib/codespace/broadcast";
import { getOrCreateSession } from "@/lib/codespace/session-service";
import { tryCatch } from "@/lib/try-catch";
import type { NextRequest } from "next/server";

/**
 * GET /api/codespace/[codeSpace]/stream
 *
 * SSE endpoint for real-time codespace updates.
 * Public (no auth) to match the original Cloudflare Worker behavior.
 *
 * Event types:
 * - connected:       Initial connection with current session hash
 * - session_update:  Code/transpiled/html/css changed
 * - version_created: A new immutable version was saved
 * - heartbeat:       Keep-alive ping (every 30s)
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ codeSpace: string; }>; },
) {
  const { data: params, error: paramsError } = await tryCatch(context.params);
  if (paramsError) {
    return new Response(JSON.stringify({ error: "Invalid parameters" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { codeSpace } = params;

  // Get or create the session to send initial state
  const { data: session, error: sessionError } = await tryCatch(
    getOrCreateSession(codeSpace),
  );

  if (sessionError) {
    logger.error(
      `[Codespace SSE] Failed to get session for "${codeSpace}":`,
      sessionError,
    );
    return new Response(
      JSON.stringify({ error: "Failed to retrieve session" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const encoder = new TextEncoder();
  let controllerRef: ReadableStreamDefaultController<Uint8Array> | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controllerRef = controller;

      // Register this connection
      addConnection(codeSpace, controller);
      const connectionCount = getConnections(codeSpace)?.size ?? 0;
      logger.info(
        `[Codespace SSE] Client connected to "${codeSpace}". Total connections: ${connectionCount}`,
      );

      // Track last processed timestamp for Redis event deduplication
      let lastProcessedTimestamp = Date.now();

      // Send initial "connected" event with current hash
      const connectedEvent: CodespaceSSEEvent = {
        type: "connected",
        data: { codeSpace, hash: session.hash },
        timestamp: Date.now(),
      };
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify(connectedEvent)}\n\n`),
      );

      // Heartbeat every 30 seconds
      const heartbeatInterval = setInterval(() => {
        try {
          const heartbeat: CodespaceSSEEvent = {
            type: "heartbeat",
            data: null,
            timestamp: Date.now(),
          };
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(heartbeat)}\n\n`),
          );
        } catch {
          // Intentionally silent: Client disconnected - clean up heartbeat.
          clearInterval(heartbeatInterval);
        }
      }, 30000);

      // Poll Redis every 2 seconds for events from other instances
      const redisInterval = setInterval(() => {
        getCodespaceSSEEvents(codeSpace, lastProcessedTimestamp)
          .then(events => {
            for (const event of events) {
              try {
                if (event.timestamp <= lastProcessedTimestamp) continue;

                const eventString = `data: ${JSON.stringify(event)}\n\n`;
                controller.enqueue(encoder.encode(eventString));

                lastProcessedTimestamp = Math.max(
                  lastProcessedTimestamp,
                  event.timestamp,
                );
              } catch {
                // Intentionally silent: Connection closed
              }
            }
          })
          .catch(error => {
            logger.error(
              `[Codespace SSE] Failed to poll Redis events for "${codeSpace}":`,
              error,
            );
          });
      }, 2000);

      // Cleanup function for disconnect
      const cleanup = () => {
        clearInterval(heartbeatInterval);
        clearInterval(redisInterval);
        removeConnection(codeSpace, controller);
        logger.info(
          `[Codespace SSE] Client disconnected from "${codeSpace}". Remaining: ${
            getConnections(codeSpace)?.size ?? 0
          }`,
        );
      };

      (controller as unknown as { cleanup: () => void; }).cleanup = cleanup;
    },

    cancel() {
      if (controllerRef) {
        const cleanup = (controllerRef as unknown as { cleanup?: () => void; })
          .cleanup;
        if (cleanup) cleanup();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
