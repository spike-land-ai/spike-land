/**
 * COMPASS Messaging — WhatsApp Cloud API Adapter
 *
 * Implements MessagingAdapter for the Meta WhatsApp Business Cloud API
 * (graph.facebook.com/v18.0/{phone_number_id}/messages).
 *
 * This module is a pure formatter/parser. Network I/O is delegated to the
 * injected HttpClient so the adapter can be tested without real HTTP calls.
 *
 * Button limits:
 *   - Reply buttons: max 3 (interactive/button)
 *   - List rows: max 10 per section (interactive/list)
 *
 * Reference: https://developers.facebook.com/docs/whatsapp/cloud-api/messages
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
// Wire-format types (internal — not exported)
// ---------------------------------------------------------------------------

interface WaTextMessage {
  readonly messaging_product: "whatsapp";
  readonly recipient_type: "individual";
  readonly to: string;
  readonly type: "text";
  readonly text: { readonly body: string; readonly preview_url: false };
}

interface WaReplyButton {
  readonly type: "reply";
  readonly reply: { readonly id: string; readonly title: string };
}

interface WaInteractiveButtonMessage {
  readonly messaging_product: "whatsapp";
  readonly recipient_type: "individual";
  readonly to: string;
  readonly type: "interactive";
  readonly interactive: {
    readonly type: "button";
    readonly body: { readonly text: string };
    readonly action: { readonly buttons: WaReplyButton[] };
  };
}

interface WaListRow {
  readonly id: string;
  readonly title: string;
  readonly description: string;
}

interface WaInteractiveListMessage {
  readonly messaging_product: "whatsapp";
  readonly recipient_type: "individual";
  readonly to: string;
  readonly type: "interactive";
  readonly interactive: {
    readonly type: "list";
    readonly body: { readonly text: string };
    readonly action: {
      readonly button: string;
      readonly sections: ReadonlyArray<{
        readonly title: string;
        readonly rows: WaListRow[];
      }>;
    };
  };
}

interface WaImageMessage {
  readonly messaging_product: "whatsapp";
  readonly recipient_type: "individual";
  readonly to: string;
  readonly type: "image";
  readonly image: { readonly link: string; readonly caption?: string };
}

interface WaDocumentMessage {
  readonly messaging_product: "whatsapp";
  readonly recipient_type: "individual";
  readonly to: string;
  readonly type: "document";
  readonly document: { readonly link: string; readonly caption?: string };
}

interface WaAudioMessage {
  readonly messaging_product: "whatsapp";
  readonly recipient_type: "individual";
  readonly to: string;
  readonly type: "audio";
  readonly audio: { readonly link: string };
}

type WaOutboundMessage =
  | WaTextMessage
  | WaInteractiveButtonMessage
  | WaInteractiveListMessage
  | WaImageMessage
  | WaDocumentMessage
  | WaAudioMessage;

// ---------------------------------------------------------------------------
// Inbound webhook shape (partial — only fields we normalise)
// ---------------------------------------------------------------------------

interface WaWebhookEntry {
  readonly changes: ReadonlyArray<{
    readonly value: {
      readonly messages?: ReadonlyArray<{
        readonly id: string;
        readonly from: string;
        readonly timestamp: string;
        readonly type: string;
        readonly text?: { readonly body: string };
        readonly image?: { readonly id: string; readonly caption?: string };
        readonly interactive?: {
          readonly type: "button_reply" | "list_reply";
          readonly button_reply?: { readonly id: string; readonly title: string };
          readonly list_reply?: { readonly id: string; readonly title: string };
        };
        readonly location?: {
          readonly latitude: number;
          readonly longitude: number;
        };
        readonly context?: { readonly id: string };
      }>;
    };
  }>;
}

interface WaWebhookBody {
  readonly object: string;
  readonly entry: WaWebhookEntry[];
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class WhatsAppParseError extends Error {
  constructor(
    reason: string,
    public readonly raw: unknown,
  ) {
    super(`WhatsApp webhook parse error: ${reason}`);
    this.name = "WhatsAppParseError";
  }
}

export class WhatsAppButtonLimitError extends Error {
  constructor(count: number) {
    super(
      `WhatsApp reply buttons are capped at 3. Received ${count}. ` +
        `Use sendButtons with >3 items to trigger a list message (max 10).`,
    );
    this.name = "WhatsAppButtonLimitError";
  }
}

// ---------------------------------------------------------------------------
// WhatsAppAdapter
// ---------------------------------------------------------------------------

export class WhatsAppAdapter implements MessagingAdapter {
  readonly platform = Platform.WHATSAPP;

  /**
   * @param httpClient  Injectable HTTP client — no real fetch calls in tests.
   * @param phoneNumberId  WhatsApp Business Account phone_number_id.
   * @param accessToken  Meta Graph API bearer token.
   * @param apiVersion  Graph API version, defaults to "v18.0".
   */
  constructor(
    private readonly httpClient: HttpClient,
    private readonly phoneNumberId: string,
    private readonly accessToken: string,
    private readonly apiVersion: string = "v18.0",
  ) {}

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  async sendMessage(msg: OutgoingMessage): Promise<void> {
    if (msg.buttons !== undefined && msg.buttons.length > 0) {
      await this.sendButtons(msg.chatId, msg.text, msg.buttons);
      return;
    }

    if (msg.media !== undefined) {
      await this._sendMedia(msg.chatId, msg.text, msg.media.type, msg.media.url, msg.media.caption);
      return;
    }

    const payload: WaTextMessage = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: msg.chatId,
      type: "text",
      text: { body: msg.text, preview_url: false },
    };

    await this._post(payload);
  }

  async sendButtons(chatId: string, text: string, buttons: Button[]): Promise<void> {
    if (buttons.length === 0) {
      await this.sendMessage({ chatId, text });
      return;
    }

    if (buttons.length <= 3) {
      await this._sendReplyButtons(chatId, text, buttons);
    } else if (buttons.length <= 10) {
      await this._sendListMessage(chatId, text, buttons);
    } else {
      throw new WhatsAppButtonLimitError(buttons.length);
    }
  }

  parseWebhook(body: unknown): IncomingMessage {
    const wb = body as WaWebhookBody;

    if (wb.object !== "whatsapp_business_account") {
      throw new WhatsAppParseError("object is not whatsapp_business_account", body);
    }

    const firstEntry = wb.entry[0];
    if (firstEntry === undefined) {
      throw new WhatsAppParseError("entry array is empty", body);
    }

    const firstChange = firstEntry.changes[0];
    if (firstChange === undefined) {
      throw new WhatsAppParseError("changes array is empty", body);
    }

    const messages = firstChange.value.messages;
    if (messages === undefined || messages.length === 0) {
      throw new WhatsAppParseError("no messages in webhook payload", body);
    }

    const msg = messages[0];
    if (msg === undefined) {
      throw new WhatsAppParseError("messages[0] is undefined", body);
    }

    const text = this._extractText(msg);

    return {
      platform: Platform.WHATSAPP,
      userId: msg.from,
      chatId: msg.from,
      text,
      timestamp: parseInt(msg.timestamp, 10) * 1000,
      metadata: {
        ...(msg.location !== undefined
          ? {
              location: {
                latitude: msg.location.latitude,
                longitude: msg.location.longitude,
              },
            }
          : {}),
        ...(msg.context?.id !== undefined ? { replyTo: msg.context.id } : {}),
      },
    };
  }

  /**
   * Handle the GET hub.challenge verification request from Meta.
   * Returns the challenge string when the verifyToken matches, or null.
   */
  verifyWebhook(params: Record<string, string>, expectedVerifyToken: string): string | null {
    const mode = params["hub.mode"];
    const token = params["hub.verify_token"];
    const challenge = params["hub.challenge"];

    if (mode === "subscribe" && token === expectedVerifyToken && challenge !== undefined) {
      return challenge;
    }

    return null;
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private async _sendReplyButtons(chatId: string, text: string, buttons: Button[]): Promise<void> {
    const replyButtons: WaReplyButton[] = buttons.slice(0, 3).map((b) => ({
      type: "reply",
      reply: { id: b.id, title: b.label.slice(0, 20) },
    }));

    const payload: WaInteractiveButtonMessage = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: chatId,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text },
        action: { buttons: replyButtons },
      },
    };

    await this._post(payload);
  }

  private async _sendListMessage(chatId: string, text: string, buttons: Button[]): Promise<void> {
    const rows: WaListRow[] = buttons.slice(0, 10).map((b) => ({
      id: b.id,
      title: b.label.slice(0, 24),
      description: b.payload.slice(0, 72),
    }));

    const payload: WaInteractiveListMessage = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: chatId,
      type: "interactive",
      interactive: {
        type: "list",
        body: { text },
        action: {
          button: "Options",
          sections: [{ title: "Choose an option", rows }],
        },
      },
    };

    await this._post(payload);
  }

  private async _sendMedia(
    chatId: string,
    caption: string,
    type: "image" | "document" | "voice",
    url: string,
    overrideCaption?: string,
  ): Promise<void> {
    const effectiveCaption = overrideCaption ?? caption;

    let payload: WaOutboundMessage;

    if (type === "image") {
      payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: chatId,
        type: "image",
        image: { link: url, ...(effectiveCaption ? { caption: effectiveCaption } : {}) },
      };
    } else if (type === "document") {
      payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: chatId,
        type: "document",
        document: { link: url, ...(effectiveCaption ? { caption: effectiveCaption } : {}) },
      };
    } else {
      payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: chatId,
        type: "audio",
        audio: { link: url },
      };
    }

    await this._post(payload);
  }

  private _extractText(
    msg: NonNullable<WaWebhookEntry["changes"][0]["value"]["messages"]>[0],
  ): string {
    if (msg.type === "text" && msg.text !== undefined) {
      return msg.text.body;
    }

    if (msg.type === "interactive" && msg.interactive !== undefined) {
      if (msg.interactive.type === "button_reply" && msg.interactive.button_reply !== undefined) {
        return msg.interactive.button_reply.title;
      }
      if (msg.interactive.type === "list_reply" && msg.interactive.list_reply !== undefined) {
        return msg.interactive.list_reply.title;
      }
    }

    // Media messages, location, etc. — return empty string per contract.
    return "";
  }

  private async _post(payload: WaOutboundMessage): Promise<void> {
    const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;

    await this.httpClient.request({
      url,
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
      body: payload,
    });
  }
}
