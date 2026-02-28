import logger from "@/lib/logger";

export const maxDuration = 300;

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { checkRateLimit, rateLimitConfigs } from "@/lib/rate-limiter";
import { tryCatch } from "@/lib/try-catch";
import type { NextRequest } from "next/server";

interface JobStreamData {
  type: "status" | "error" | "connected";
  status?: string;
  currentStage?: string | null;
  enhancedUrl?: string | null;
  enhancedWidth?: number | null;
  enhancedHeight?: number | null;
  errorMessage?: string | null;
  message?: string;
}

// Polling intervals based on job status (reduced from 1s to reduce DB load)
const PENDING_POLL_INTERVAL = 5000; // 5 seconds for pending jobs (in queue)
const PROCESSING_POLL_INTERVAL = 3000; // 3 seconds for processing jobs
const MAX_POLL_INTERVAL = 5000; // Maximum interval with backoff
const BACKOFF_THRESHOLD = 5; // Start backoff after this many polls

// SSE connection rate limiting per user/IP
const MAX_SSE_CONNECTIONS_PER_USER = 5;
const activeConnections = new Map<string, number>();

/**
 * Get client IP address from request headers.
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const firstIP = forwarded.split(",")[0];
    if (firstIP) {
      return firstIP.trim();
    }
  }
  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }
  return "unknown";
}

/**
 * Get current active connection count for a user
 */
function getConnectionCount(userId: string): number {
  return activeConnections.get(userId) ?? 0;
}

/**
 * Increment connection count for a user
 * Returns false if limit would be exceeded
 */
function acquireConnection(userId: string): boolean {
  const current = getConnectionCount(userId);
  if (current >= MAX_SSE_CONNECTIONS_PER_USER) {
    return false;
  }
  activeConnections.set(userId, current + 1);
  return true;
}

/**
 * Decrement connection count for a user
 */
function releaseConnection(userId: string): void {
  const current = getConnectionCount(userId);
  if (current <= 1) {
    activeConnections.delete(userId);
  } else {
    activeConnections.set(userId, current - 1);
  }
}

/**
 * SSE endpoint for real-time job status updates
 *
 * Streams job status changes to the client without requiring polling.
 * The server polls the database internally and pushes updates.
 *
 * Anonymous jobs are accessible without authentication.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string; }>; },
) {
  const { jobId } = await params;

  // Verify job exists first
  const job = await prisma.imageEnhancementJob.findUnique({
    where: { id: jobId },
    select: { isAnonymous: true, userId: true },
  });

  if (!job) {
    return new Response(JSON.stringify({ error: "Job not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Connection identifier for rate limiting
  let connectionId: string;

  if (job.isAnonymous) {
    // For anonymous jobs, use IP-based rate limiting
    const clientIP = getClientIP(request);
    connectionId = `anon:${clientIP}`;

    // Check rate limit for anonymous connections
    const rateLimitResult = await checkRateLimit(
      `anonymous-stream:${clientIP}`,
      rateLimitConfigs.anonymousStream,
    );
    if (rateLimitResult.isLimited) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded" }),
        {
          status: 429,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  } else {
    // For non-anonymous jobs, require authentication and ownership
    const session = await auth();
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (job.userId !== session.user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    connectionId = session.user.id;
  }

  // Check SSE connection rate limit
  if (!acquireConnection(connectionId)) {
    return new Response(
      JSON.stringify({
        error: "Too many active connections",
        message: `Maximum ${MAX_SSE_CONNECTIONS_PER_USER} concurrent SSE connections allowed`,
      }),
      {
        status: 429,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
  const encoder = new TextEncoder();
  let isStreamClosed = false;
  let timeoutId: NodeJS.Timeout | null = null;
  let pollCount = 0;
  let lastSentStage: string | null = null; // Track stage for transition logging

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: JobStreamData) => {
        if (isStreamClosed) return;
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`),
          );
        } catch {
          // Stream was closed
          isStreamClosed = true;
        }
      };

      // Calculate next poll interval based on job status and poll count
      const getNextPollInterval = (status: string): number => {
        // Base interval depends on job status
        let baseInterval = status === "PENDING"
          ? PENDING_POLL_INTERVAL
          : PROCESSING_POLL_INTERVAL;

        // Apply exponential backoff after threshold
        if (pollCount > BACKOFF_THRESHOLD) {
          const backoffMultiplier = Math.min(
            Math.pow(1.2, pollCount - BACKOFF_THRESHOLD),
            MAX_POLL_INTERVAL / baseInterval,
          );
          baseInterval = Math.min(
            baseInterval * backoffMultiplier,
            MAX_POLL_INTERVAL,
          );
        }

        return Math.round(baseInterval);
      };

      // Send initial connected event
      sendEvent({ type: "connected", message: "Connected to job stream" });

      const checkStatus = async () => {
        if (isStreamClosed) return;
        pollCount++;

        const { data: currentJob, error } = await tryCatch(
          prisma.imageEnhancementJob.findUnique({
            where: { id: jobId },
          }),
        );

        if (error) {
          logger.error("Error checking job status:", error);
          sendEvent({
            type: "error",
            message: "Failed to check job status",
          });
          // Don't close stream on transient errors, retry with backoff
          const nextInterval = getNextPollInterval("PROCESSING");
          timeoutId = setTimeout(checkStatus, nextInterval);
          return;
        }

        if (!currentJob) {
          sendEvent({ type: "error", message: "Job not found" });
          controller.close();
          isStreamClosed = true;
          releaseConnection(connectionId);
          return;
        }

        // Log stage transitions for debugging
        if (currentJob.currentStage !== lastSentStage) {
          logger.info(
            `[JobStream ${jobId}] Stage transition: ${lastSentStage || "none"} → ${
              currentJob.currentStage || "none"
            }`,
          );
          lastSentStage = currentJob.currentStage;
        }

        sendEvent({
          type: "status",
          status: currentJob.status,
          currentStage: currentJob.currentStage,
          enhancedUrl: currentJob.enhancedUrl,
          enhancedWidth: currentJob.enhancedWidth,
          enhancedHeight: currentJob.enhancedHeight,
          errorMessage: currentJob.errorMessage,
        });

        // Close stream on terminal states
        if (
          currentJob.status === "COMPLETED"
          || currentJob.status === "FAILED"
          || currentJob.status === "CANCELLED"
          || currentJob.status === "REFUNDED"
        ) {
          controller.close();
          isStreamClosed = true;
          releaseConnection(connectionId);
          return;
        }

        // Calculate next poll interval based on status and poll count
        const nextInterval = getNextPollInterval(currentJob.status);
        timeoutId = setTimeout(checkStatus, nextInterval);
      };

      // Start polling
      await checkStatus();
    },

    cancel() {
      isStreamClosed = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      releaseConnection(connectionId);
    },
  });

  // Handle client disconnect
  request.signal.addEventListener("abort", () => {
    if (!isStreamClosed) {
      isStreamClosed = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      releaseConnection(connectionId);
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable nginx buffering
    },
  });
}
