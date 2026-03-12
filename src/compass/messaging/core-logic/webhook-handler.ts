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
  /**
   * Full request URL including scheme, host, path, and query string.
   * Required for Twilio HMAC-SHA1 signature validation.
   * Example: "https://api.example.com/webhook/sms"
   */
  readonly url?: string;
}

export interface WebhookResponse {
  readonly status: number;
  readonly body: unknown;
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class WebhookVerificationError extends Error {
  readonly platform: Platform;
  constructor(platform: Platform, reason: string) {
    super(`Webhook verification failed for ${platform}: ${reason}`);
    this.name = "WebhookVerificationError";
    this.platform = platform;
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
 * Twilio's algorithm (https://www.twilio.com/docs/usage/webhooks/webhooks-security):
 *   1. Take the full request URL (scheme + host + path + query string).
 *   2. For POST requests, sort all POST parameters alphabetically by key and
 *      append each key and value (no separator) to the URL string.
 *   3. Sign the resulting string with HMAC-SHA1 using the Auth Token as the key.
 *   4. Base64-encode the binary digest.
 *   5. Compare the result with the X-Twilio-Signature header value.
 *
 * @param requestUrl     Full URL the webhook was delivered to (required).
 * @param postParams     Parsed POST body fields (Record<string, string>) or
 *                       undefined / non-Record values (treated as no params).
 * @param signatureHeader Value of the X-Twilio-Signature header.
 * @param authToken      Twilio Auth Token used as the HMAC-SHA1 key.
 */
export async function verifyTwilioSignature(
  requestUrl: string,
  postParams: unknown,
  signatureHeader: string | undefined,
  authToken: string,
): Promise<boolean> {
  if (signatureHeader === undefined || signatureHeader.length === 0) {
    return false;
  }

  // Build the string-to-sign: URL followed by sorted POST params.
  let stringToSign = requestUrl;

  if (
    postParams !== null &&
    postParams !== undefined &&
    typeof postParams === "object" &&
    !Array.isArray(postParams)
  ) {
    const params = postParams as Record<string, unknown>;
    const sortedKeys = Object.keys(params).sort();
    for (const key of sortedKeys) {
      stringToSign += key + String(params[key] ?? "");
    }
  }

  const encoder = new TextEncoder();
  const keyData = encoder.encode(authToken);
  const msgData = encoder.encode(stringToSign);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );

  const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, msgData);
  const computedBase64 = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));

  return timingSafeEqual(computedBase64, signatureHeader);
}

// ---------------------------------------------------------------------------
// WebhookHandler
// ---------------------------------------------------------------------------

export class WebhookHandler {
  private readonly router: MessageRouter;
  private readonly configs: Map<Platform, WebhookConfig>;

  constructor(router: MessageRouter, configs: Map<Platform, WebhookConfig>) {
    this.router = router;
    this.configs = configs;
  }

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
      await this._verifySignature(platform, request.headers, config, rawBody, request.url);
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
    requestUrl?: string,
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
      const sig = headers["x-twilio-signature"];

      if (requestUrl === undefined || requestUrl.length === 0) {
        // Without the full URL we cannot compute the expected signature.
        // Reject the request rather than silently skip validation.
        throw new WebhookVerificationError(
          platform,
          "request URL is required for Twilio signature validation but was not provided",
        );
      }

      // body for SMS webhooks is the parsed URL-encoded form fields
      const valid = await verifyTwilioSignature(
        requestUrl,
        this._parseBodyForTwilio(rawBody),
        sig,
        config.secret,
      );
      if (!valid) {
        throw new WebhookVerificationError(platform, "HMAC-SHA1 mismatch");
      }
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

  /**
   * Parse a URL-encoded form body string into a plain Record<string, string>.
   *
   * Twilio delivers POST webhook payloads as application/x-www-form-urlencoded.
   * The signature algorithm requires the individual key/value pairs (not the raw
   * string), sorted alphabetically.
   *
   * Returns an empty object for blank or malformed input so callers always get
   * a consistent type.
   */
  private _parseBodyForTwilio(rawBody: string): Record<string, string> {
    if (rawBody.length === 0) {
      return {};
    }

    const result: Record<string, string> = {};

    for (const pair of rawBody.split("&")) {
      const eqIndex = pair.indexOf("=");
      if (eqIndex === -1) {
        continue;
      }
      const key = decodeURIComponent(pair.slice(0, eqIndex).replace(/\+/g, " "));
      const value = decodeURIComponent(pair.slice(eqIndex + 1).replace(/\+/g, " "));
      result[key] = value;
    }

    return result;
  }
}
