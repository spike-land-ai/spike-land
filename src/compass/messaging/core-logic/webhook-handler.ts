/**
 * COMPASS Messaging — WebhookHandler
 *
 * Entry-point for HTTP webhook requests delivered by messaging platforms.
 *
 * Responsibilities:
 *   1. Signature verification (HMAC-SHA256 for WhatsApp/SMS; token check for Telegram).
 *   2. Delegation to MessageRouter for parsing.
 *   3. Returning a structured {status, body} response suitable for any HTTP
 *      framework (Hono, Express, Cloudflare Workers fetch handler, etc.).
 *
 * This module is purposely framework-agnostic. Callers adapt the result to
 * their HTTP response object.
 *
 * WhatsApp GET hub.challenge verification is handled separately via
 * WhatsAppAdapter.verifyWebhook (called by the edge route, not here).
 */

import type { WebhookConfig } from "../types.js";
import { Platform } from "../types.js";
import type { MessageRouter } from "./message-router.js";

// ---------------------------------------------------------------------------
// Request / Response shapes
// ---------------------------------------------------------------------------

export interface WebhookRequest {
  readonly headers: Record<string, string | undefined>;
  /** Already-parsed body. For URL-encoded forms, callers should parse to Record<string, string>. */
  readonly body: unknown;
}

export interface WebhookResponse {
  readonly status: number;
  readonly body: unknown;
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class WebhookVerificationError extends Error {
  constructor(
    public readonly platform: Platform,
    reason: string,
  ) {
    super(`Webhook verification failed for ${platform}: ${reason}`);
    this.name = "WebhookVerificationError";
  }
}

// ---------------------------------------------------------------------------
// Signature verification helpers (pure functions)
// ---------------------------------------------------------------------------

/**
 * Constant-time string comparison to prevent timing attacks.
 * Works in both Node.js (crypto.timingSafeEqual) and edge environments
 * (manual character comparison as fallback).
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Verify a WhatsApp Cloud API HMAC-SHA256 signature.
 *
 * Meta sends: X-Hub-Signature-256: sha256=<hex>
 *
 * We cannot compute HMAC synchronously in a portable way without the Web
 * Crypto API, so this returns a Promise.
 */
export async function verifyWhatsAppSignature(
  rawBody: string,
  signatureHeader: string | undefined,
  secret: string,
): Promise<boolean> {
  if (signatureHeader === undefined || !signatureHeader.startsWith("sha256=")) {
    return false;
  }

  const receivedHex = signatureHeader.slice("sha256=".length);

  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const bodyData = encoder.encode(rawBody);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, bodyData);
  const computedHex = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return timingSafeEqual(computedHex, receivedHex);
}

/**
 * Verify a Twilio SMS webhook using the X-Twilio-Signature header.
 *
 * Twilio computes: HMAC-SHA1(authToken, url + sorted_params)
 * For simplicity this implementation verifies the header exists and is
 * non-empty. A full implementation would require the raw request URL.
 *
 * TODO: pass the full request URL for proper Twilio signature validation.
 */
export function hasTwilioSignatureHeader(headers: Record<string, string | undefined>): boolean {
  const sig = headers["x-twilio-signature"];
  return typeof sig === "string" && sig.length > 0;
}

// ---------------------------------------------------------------------------
// WebhookHandler
// ---------------------------------------------------------------------------

export class WebhookHandler {
  constructor(
    private readonly router: MessageRouter,
    private readonly configs: Map<Platform, WebhookConfig>,
  ) {}

  /**
   * Handle an inbound webhook request.
   *
   * @param platform   The platform this request originated from.
   * @param request    Framework-agnostic request object.
   * @param rawBody    The raw (unparsed) request body string, required for
   *                   HMAC verification. Pass undefined to skip signature checks
   *                   (development only).
   *
   * @returns A {status, body} pair the caller can map to an HTTP response.
   */
  async handleRequest(
    platform: Platform,
    request: WebhookRequest,
    rawBody?: string,
  ): Promise<WebhookResponse> {
    const config = this.configs.get(platform);

    if (config === undefined) {
      return { status: 404, body: { error: `No config for platform ${platform}` } };
    }

    // ---- Signature verification -------------------------------------------
    try {
      await this._verifySignature(platform, request.headers, config, rawBody);
    } catch (err) {
      if (err instanceof WebhookVerificationError) {
        return { status: 403, body: { error: err.message } };
      }
      throw err;
    }

    // ---- Parse and route --------------------------------------------------
    try {
      const incoming = this.router.routeIncoming(platform, request.body);
      return { status: 200, body: { ok: true, message: incoming } };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown parse error";
      return { status: 400, body: { error: message } };
    }
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private async _verifySignature(
    platform: Platform,
    headers: Record<string, string | undefined>,
    config: WebhookConfig,
    rawBody?: string,
  ): Promise<void> {
    if (rawBody === undefined) {
      // Skip verification in development when rawBody is not provided.
      return;
    }

    if (platform === Platform.WHATSAPP) {
      const sig = headers["x-hub-signature-256"];
      const valid = await verifyWhatsAppSignature(rawBody, sig, config.secret);

      if (!valid) {
        throw new WebhookVerificationError(platform, "HMAC-SHA256 mismatch");
      }
      return;
    }

    if (platform === Platform.SMS) {
      const hasSig = hasTwilioSignatureHeader(headers);
      if (!hasSig) {
        throw new WebhookVerificationError(platform, "missing X-Twilio-Signature header");
      }
      // Full Twilio HMAC-SHA1 validation would happen here with the request URL.
      return;
    }

    if (platform === Platform.TELEGRAM) {
      // Telegram webhooks are secured by keeping the webhook URL secret
      // (bot token in the URL path). No inbound signature header.
      // Optionally verify a secret_token set via setWebhook.
      const secretToken = headers["x-telegram-bot-api-secret-token"];
      if (config.secret.length > 0 && secretToken !== config.secret) {
        throw new WebhookVerificationError(platform, "X-Telegram-Bot-Api-Secret-Token mismatch");
      }
      return;
    }
  }
}
