/**
 * Workflow Webhook Endpoint
 *
 * POST /api/workflows/webhook/[token] - Trigger workflow via webhook
 */

import { tryCatch } from "@/lib/try-catch";
import {
  findWebhookByToken,
  markWebhookTriggered,
} from "@/lib/workflows/triggers";
import { executeWorkflow } from "@/lib/workflows/workflow-executor";
import { decryptToken } from "@/lib/crypto/token-encryption";
import crypto from "crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

interface RouteParams {
  params: Promise<{ token: string; }>;
}

/**
 * POST /api/workflows/webhook/[token]
 *
 * Trigger a workflow via webhook.
 *
 * Headers:
 * - X-Webhook-Signature: HMAC signature (required if webhook has a secret)
 * - Content-Type: application/json
 *
 * Body:
 * - Any JSON payload (will be passed to the workflow as trigger data)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { token } = await params;

  // Get raw body for signature verification
  const { data: rawBody, error: bodyError } = await tryCatch(request.text());

  if (bodyError) {
    return NextResponse.json({ error: "Invalid request body" }, {
      status: 400,
    });
  }

  // Find the webhook
  const webhookData = await findWebhookByToken(token);

  if (!webhookData) {
    return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
  }

  if (!webhookData.isActive) {
    return NextResponse.json({ error: "Webhook is disabled" }, { status: 403 });
  }

  if (webhookData.workflowStatus !== "ACTIVE") {
    return NextResponse.json({ error: "Workflow is not active" }, {
      status: 403,
    });
  }

  // Verify signature if secret is configured
  // Note: We prioritize secretEncrypted for proper HMAC verification.
  // Legacy secretHash is invalidated by migration.
  if (webhookData.secretEncrypted) {
    const signature = request.headers.get("X-Webhook-Signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    try {
      const rawSecret = decryptToken(webhookData.secretEncrypted);
      const expectedSig = crypto.createHmac("sha256", rawSecret)
        .update(rawBody || "")
        .digest("hex");

      const sigHex = signature.replace("sha256=", "");

      // Use timing-safe comparison to prevent timing attacks
      const sigBuffer = Buffer.from(sigHex, "hex");
      const expectedBuffer = Buffer.from(expectedSig, "hex");

      if (
        sigBuffer.length !== expectedBuffer.length
        || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
      ) {
        return NextResponse.json({ error: "Invalid signature" }, {
          status: 401,
        });
      }
    } catch (err) {
      logger.error("Webhook signature verification failed:", err);
      return NextResponse.json({ error: "Signature verification failed" }, {
        status: 401,
      });
    }
  } else if (webhookData.secretHash) {
    // This case should be rare after migration as secretHash is nulled.
    // We reject it because we can't verify it properly.
    return NextResponse.json({
      error: "Webhook secret is in legacy format. Please reconfigure.",
    }, { status: 401 });
  }

  // Parse the JSON payload
  let triggerData: Record<string, unknown> = {};
  if (rawBody) {
    const { data: parsed, error: parseError } = await tryCatch(
      Promise.resolve(JSON.parse(rawBody)),
    );
    if (!parseError && typeof parsed === "object" && parsed !== null) {
      triggerData = parsed as Record<string, unknown>;
    }
  }

  // Mark webhook as triggered
  await markWebhookTriggered(webhookData.webhookId);

  // Execute the workflow
  const { data: result, error: execError } = await tryCatch(
    executeWorkflow({
      workflowId: webhookData.workflowId,
      versionId: "", // Will use published version
      triggerType: "webhook",
      triggerId: webhookData.webhookId,
      triggerData,
    }),
  );

  if (execError) {
    logger.error("Webhook workflow execution failed:", execError);
    return NextResponse.json(
      { error: "Workflow execution failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    runId: result.runId,
    status: result.status,
  });
}
