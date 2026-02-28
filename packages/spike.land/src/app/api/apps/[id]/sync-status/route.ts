import { auth } from "@/lib/auth";
import { tryCatch } from "@/lib/try-catch";
import crypto from "crypto";
import type { NextRequest } from "next/server";
import { z } from "zod";
import {
  broadcastCodeUpdated,
  broadcastSyncInProgress,
} from "../messages/stream/route";

const syncStatusSchema = z.object({
  isSyncing: z.boolean().optional(),
  codeUpdated: z.boolean().optional(),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; }>; },
) {
  const { data: session, error: authError } = await tryCatch(auth());

  // For internal API calls, we check either user auth OR internal API key
  // Use timing-safe comparison to prevent timing attacks (OWASP A2)
  const apiKey = request.headers.get("x-internal-api-key");
  const secret = process.env.INTERNAL_API_KEY;
  const isInternalCall = secret !== undefined
    && apiKey !== null
    && apiKey.length === secret.length
    && crypto.timingSafeEqual(Buffer.from(apiKey), Buffer.from(secret));

  if (!isInternalCall && (authError || !session?.user?.id)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data: params, error: paramsError } = await tryCatch(context.params);

  if (paramsError || !params) {
    return new Response(JSON.stringify({ error: "Invalid parameters" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { id } = params;

  // Parse JSON body with error handling
  const { data: rawBody, error: parseError } = await tryCatch(request.json());
  if (parseError || !rawBody) {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Validate body with Zod schema
  const parseResult = syncStatusSchema.safeParse(rawBody);
  if (!parseResult.success) {
    return new Response(
      JSON.stringify({
        error: "Invalid sync status data",
        details: parseResult.error.flatten(),
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const { isSyncing, codeUpdated } = parseResult.data;

  // Broadcast to connected clients
  if (isSyncing !== undefined) {
    broadcastSyncInProgress(id, isSyncing);
  }

  if (codeUpdated) {
    broadcastCodeUpdated(id);
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
