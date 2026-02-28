export const maxDuration = 300;

import { GeneratedRouteStatus } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Unified select used for all queries — includes all fields needed for the final response
// so we never need a second findUnique call when we reach a terminal state
const POLL_SELECT = {
  status: true,
  lastError: true,
  slug: true,
  codespaceUrl: true,
  title: true,
  description: true,
} as const;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ generationId: string; }>; },
) {
  const { generationId } = await params;

  const prisma = (await import("@/lib/prisma")).default;
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // First, verify the route exists before entering the polling loop
      const initial = await prisma.generatedRoute.findUnique({
        where: { id: generationId },
        select: POLL_SELECT,
      });

      if (!initial) {
        send({ type: "error", message: "Route not found" });
        controller.close();
        return;
      }

      // If already in a terminal state, return immediately — no polling needed
      if (initial.status === GeneratedRouteStatus.PUBLISHED) {
        send({
          type: "complete",
          slug: initial.slug,
          codespaceUrl: initial.codespaceUrl,
          title: initial.title,
          description: initial.description,
        });
        controller.close();
        return;
      }

      if (initial.status === GeneratedRouteStatus.FAILED) {
        send({
          type: "error",
          message: initial.lastError ?? "Generation failed",
          phase: "FAILED",
        });
        controller.close();
        return;
      }

      let lastStatus: GeneratedRouteStatus = initial.status;
      send({
        type: "status",
        phase: lastStatus,
        message: `Phase: ${lastStatus}`,
      });

      // Reduced max polls (60) with higher base delay to cut total queries
      const maxPolls = 60;

      for (let i = 0; i < maxPolls; i++) {
        // Slower backoff: 1s for first 10, 2s for next 20, 3s after
        const delay = i < 10 ? 1000 : i < 30 ? 2000 : 3000;
        await new Promise(resolve => setTimeout(resolve, delay));

        try {
          const statusRow = await prisma.generatedRoute.findUnique({
            where: { id: generationId },
            select: POLL_SELECT,
          });

          if (!statusRow) {
            send({ type: "error", message: "Route not found" });
            break;
          }

          if (statusRow.status !== lastStatus) {
            lastStatus = statusRow.status;
            send({
              type: "status",
              phase: statusRow.status,
              message: `Phase: ${statusRow.status}`,
            });
          }

          if (statusRow.status === GeneratedRouteStatus.PUBLISHED) {
            send({
              type: "complete",
              slug: statusRow.slug,
              codespaceUrl: statusRow.codespaceUrl,
              title: statusRow.title,
              description: statusRow.description,
            });
            break;
          }

          if (statusRow.status === GeneratedRouteStatus.FAILED) {
            send({
              type: "error",
              message: statusRow.lastError ?? "Generation failed",
              phase: "FAILED",
            });
            break;
          }

          // Heartbeat every 5th poll to reduce SSE traffic
          if (i % 5 === 4) {
            send({ type: "heartbeat", timestamp: Date.now() });
          }
        } catch {
          send({ type: "error", message: "Stream error" });
          break;
        }
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
