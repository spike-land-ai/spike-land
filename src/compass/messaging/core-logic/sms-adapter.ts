/**
 * COMPASS Messaging — SMS Adapter (Twilio-compatible)
 *
 * Implements MessagingAdapter for Twilio's Messaging API
 * (api.twilio.com/2010-04-01/Accounts/{AccountSid}/Messages).
 *
 * SMS constraints:
 *   - A single SMS segment is 160 GSM-7 characters (153 with UDH for multi-part).
 *   - This adapter splits long messages into multiple segments automatically.
 *   - Interactive buttons are NOT supported by SMS. sendButtons falls back to
 *     numbered plain-text options appended to the message body.
 *
 * This module is a pure formatter/parser. Network I/O is delegated to the
 * injected HttpClient so the adapter can be tested without real HTTP calls.
 *
 * Reference: https://www.twilio.com/docs/messaging/api/message-resource
 */

import type {
  Button,
  HttpClient,
  IncomingMessage,
  MessagingAdapter,
  OutgoingMessage,
} from "../types.js";
import { Platform } from "../types.js";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum characters in a single SMS segment (GSM-7). */
const SMS_SEGMENT_LENGTH = 160;

/** Maximum characters per segment when UDH is used for multi-part messages. */
const SMS_MULTIPART_SEGMENT_LENGTH = 153;

// ---------------------------------------------------------------------------
// Wire-format types (internal)
// ---------------------------------------------------------------------------

/**
 * Twilio Messaging API POST body (application/x-www-form-urlencoded fields).
 * We represent it as a plain record for HttpClient serialisation.
 */
interface TwilioSendPayload {
  readonly To: string;
  readonly From: string;
  readonly Body: string;
}

/**
 * Twilio inbound webhook fields delivered as URL-encoded form data.
 * Only the fields we normalise are typed here.
 */
interface TwilioInboundFields {
  readonly From?: string;
  readonly To?: string;
  readonly Body?: string;
  readonly MessageSid?: string;
  readonly NumMedia?: string;
  readonly MediaUrl0?: string;
  readonly MediaContentType0?: string;
  readonly Latitude?: string;
  readonly Longitude?: string;
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class SmsParseError extends Error {
  constructor(
    reason: string,
    public readonly raw: unknown,
  ) {
    super(`SMS webhook parse error: ${reason}`);
    this.name = "SmsParseError";
  }
}

// ---------------------------------------------------------------------------
// Pure utility functions
// ---------------------------------------------------------------------------

/**
 * Split a long string into SMS segments.
 *
 * - If the text fits in one 160-char segment, return it as-is.
 * - Otherwise split at 153 chars (multi-part UDH overhead).
 */
export function splitSmsSegments(text: string): string[] {
  if (text.length <= SMS_SEGMENT_LENGTH) {
    return [text];
  }

  const segments: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    segments.push(remaining.slice(0, SMS_MULTIPART_SEGMENT_LENGTH));
    remaining = remaining.slice(SMS_MULTIPART_SEGMENT_LENGTH);
  }

  return segments;
}

/**
 * Render interactive buttons as numbered plain-text options appended after
 * the message body.
 *
 * Example output:
 *   "Which service do you need?\n\n1. Housing\n2. Food\n3. Healthcare"
 */
export function formatButtonsAsText(text: string, buttons: Button[]): string {
  const options = buttons.map((b, i) => `${i + 1}. ${b.label}`).join("\n");

  return `${text}\n\n${options}`;
}

// ---------------------------------------------------------------------------
// SMSAdapter
// ---------------------------------------------------------------------------

export class SMSAdapter implements MessagingAdapter {
  readonly platform = Platform.SMS;

  /**
   * @param httpClient   Injectable HTTP client.
   * @param accountSid   Twilio Account SID.
   * @param authToken    Twilio Auth Token (used for Basic auth).
   * @param fromNumber   Twilio source phone number in E.164 format.
   */
  constructor(
    private readonly httpClient: HttpClient,
    private readonly accountSid: string,
    private readonly authToken: string,
    private readonly fromNumber: string,
  ) {}

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  async sendMessage(msg: OutgoingMessage): Promise<void> {
    // Buttons fall back to numbered text — delegate to sendButtons.
    if (msg.buttons !== undefined && msg.buttons.length > 0) {
      await this.sendButtons(msg.chatId, msg.text, msg.buttons);
      return;
    }

    // SMS cannot carry media URLs inline in the message body in a meaningful
    // way for accessibility. We append the URL as plain text instead.
    let body = msg.text;
    if (msg.media !== undefined) {
      body = `${body}\n${msg.media.url}`;
    }

    await this._sendSegments(msg.chatId, body);
  }

  async sendButtons(chatId: string, text: string, buttons: Button[]): Promise<void> {
    const body = formatButtonsAsText(text, buttons);
    await this._sendSegments(chatId, body);
  }

  parseWebhook(body: unknown): IncomingMessage {
    // Twilio delivers webhooks as URL-encoded form data. Callers are expected
    // to parse that into a plain Record<string, string> before calling this.
    const fields = body as TwilioInboundFields;

    const from = fields.From;
    const msgBody = fields.Body;

    if (from === undefined || from === "") {
      throw new SmsParseError("missing From field", body);
    }

    return {
      platform: Platform.SMS,
      userId: from,
      chatId: from,
      text: msgBody ?? "",
      timestamp: Date.now(),
      metadata: {
        ...(fields.Latitude !== undefined && fields.Longitude !== undefined
          ? {
              location: {
                latitude: parseFloat(fields.Latitude),
                longitude: parseFloat(fields.Longitude),
              },
            }
          : {}),
        ...(fields.MediaUrl0 !== undefined
          ? {
              media: {
                type: "image" as const,
                url: fields.MediaUrl0,
              },
            }
          : {}),
      },
    };
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private async _sendSegments(to: string, body: string): Promise<void> {
    const segments = splitSmsSegments(body);

    // Send segments sequentially to preserve ordering.
    for (const segment of segments) {
      const payload: TwilioSendPayload = {
        To: to,
        From: this.fromNumber,
        Body: segment,
      };

      await this._post(payload);
    }
  }

  private async _post(payload: TwilioSendPayload): Promise<void> {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;

    // Twilio uses HTTP Basic Auth with AccountSid:AuthToken.
    const credentials = Buffer.from(`${this.accountSid}:${this.authToken}`).toString("base64");

    await this.httpClient.request({
      url,
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: payload,
    });
  }
}
