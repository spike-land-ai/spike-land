/**
 * COMPASS Messaging — MessageRouter
 *
 * Routes incoming webhook payloads and outgoing messages to the correct
 * platform adapter. Also adapts outgoing messages to platform constraints
 * before dispatching (e.g. SMS button truncation, Telegram markdown).
 */

import type { Button, IncomingMessage, MessagingAdapter, OutgoingMessage } from "../types.js";
import { Platform } from "../types.js";
import { formatButtonsAsText, splitSmsSegments } from "./sms-adapter.js";

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class UnknownPlatformError extends Error {
  constructor(platform: Platform) {
    super(`No adapter registered for platform "${platform}".`);
    this.name = "UnknownPlatformError";
  }
}

// ---------------------------------------------------------------------------
// Platform-specific adaptation rules
// ---------------------------------------------------------------------------

/**
 * WhatsApp Cloud API button constraints:
 *   - Max 3 reply buttons; max 10 list rows.
 *   - Button label max 20 chars.
 */
const WA_BUTTON_LABEL_MAX = 20;
const WA_BUTTON_MAX = 10;

/**
 * Adapt an OutgoingMessage to the constraints of the target platform.
 *
 * This is a pure transformation — it does not call any adapter methods.
 * The result is a new OutgoingMessage (or the same reference if no change
 * was needed).
 */
export function adaptMessage(message: OutgoingMessage, platform: Platform): OutgoingMessage {
  switch (platform) {
    case Platform.WHATSAPP:
      return _adaptForWhatsApp(message);

    case Platform.TELEGRAM:
      // Telegram handles long text natively; no truncation needed.
      return message;

    case Platform.SMS:
      return _adaptForSms(message);
  }
}

function _adaptForWhatsApp(message: OutgoingMessage): OutgoingMessage {
  if (message.buttons === undefined || message.buttons.length === 0) {
    return message;
  }

  // Enforce label length and button count limits.
  const truncatedButtons: Button[] = message.buttons.slice(0, WA_BUTTON_MAX).map((b) => ({
    ...b,
    label: b.label.slice(0, WA_BUTTON_LABEL_MAX),
  }));

  return { ...message, buttons: truncatedButtons };
}

function _adaptForSms(message: OutgoingMessage): OutgoingMessage {
  // Buttons are not supported on SMS; convert them to numbered text options
  // and strip the buttons array so the SMS adapter sends a single text message.
  if (message.buttons !== undefined && message.buttons.length > 0) {
    const bodyWithOptions = formatButtonsAsText(message.text, message.buttons);

    // Respect the 160-char limit: if the combined body fits, keep it as one
    // message. The SMSAdapter will further split if needed, but we can at
    // least normalise the shape here.
    const segments = splitSmsSegments(bodyWithOptions);
    const text = segments.length === 1 ? bodyWithOptions : bodyWithOptions;

    return {
      chatId: message.chatId,
      text,
      // No buttons — they have been folded into text.
      ...(message.media !== undefined ? { media: message.media } : {}),
    };
  }

  return message;
}

// ---------------------------------------------------------------------------
// MessageRouter
// ---------------------------------------------------------------------------

export class MessageRouter {
  private readonly adapters = new Map<Platform, MessagingAdapter>();

  /**
   * Register an adapter for its declared platform.
   * Replaces any previously registered adapter for the same platform.
   */
  registerAdapter(adapter: MessagingAdapter): void {
    this.adapters.set(adapter.platform, adapter);
  }

  /**
   * Parse a raw webhook body from the given platform into a normalised
   * IncomingMessage. Delegates to the registered adapter's parseWebhook.
   */
  routeIncoming(platform: Platform, webhookBody: unknown): IncomingMessage {
    const adapter = this._require(platform);
    return adapter.parseWebhook(webhookBody);
  }

  /**
   * Adapt and deliver an OutgoingMessage via the registered adapter for
   * the target platform.
   */
  async routeOutgoing(platform: Platform, message: OutgoingMessage): Promise<void> {
    const adapter = this._require(platform);
    const adapted = adaptMessage(message, platform);
    await adapter.sendMessage(adapted);
  }

  /**
   * Send interactive buttons to a specific chat on the given platform.
   * The message is adapted before dispatch.
   */
  async routeButtons(
    platform: Platform,
    chatId: string,
    text: string,
    buttons: Button[],
  ): Promise<void> {
    const adapter = this._require(platform);
    const adapted = adaptMessage({ chatId, text, buttons }, platform);

    // After adaptation, buttons may have been folded into text (SMS).
    if (adapted.buttons !== undefined && adapted.buttons.length > 0) {
      await adapter.sendButtons(chatId, adapted.text, adapted.buttons);
    } else {
      await adapter.sendMessage(adapted);
    }
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private _require(platform: Platform): MessagingAdapter {
    const adapter = this.adapters.get(platform);
    if (adapter === undefined) {
      throw new UnknownPlatformError(platform);
    }
    return adapter;
  }
}
