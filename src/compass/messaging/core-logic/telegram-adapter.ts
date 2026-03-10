/**
 * COMPASS Messaging — Telegram Bot API Adapter
 *
 * Implements MessagingAdapter for the Telegram Bot API
 * (api.telegram.org/bot{token}/{method}).
 *
 * This module is a pure formatter/parser. Network I/O is delegated to the
 * injected HttpClient so the adapter can be tested without real HTTP calls.
 *
 * Supported inbound event types:
 *   - text messages (including /start and /help commands)
 *   - callback_query (from InlineKeyboardMarkup button taps)
 *
 * Reference: https://core.telegram.org/bots/api
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

interface TgInlineKeyboardButton {
  readonly text: string;
  readonly callback_data: string;
}

interface TgInlineKeyboardMarkup {
  readonly inline_keyboard: ReadonlyArray<ReadonlyArray<TgInlineKeyboardButton>>;
}

interface TgSendMessagePayload {
  readonly chat_id: string | number;
  readonly text: string;
  readonly parse_mode?: "HTML" | "MarkdownV2";
  readonly reply_markup?: TgInlineKeyboardMarkup;
}

interface TgSendPhotoPayload {
  readonly chat_id: string | number;
  readonly photo: string;
  readonly caption?: string;
  readonly reply_markup?: TgInlineKeyboardMarkup;
}

interface TgSendDocumentPayload {
  readonly chat_id: string | number;
  readonly document: string;
  readonly caption?: string;
  readonly reply_markup?: TgInlineKeyboardMarkup;
}

interface TgSendVoicePayload {
  readonly chat_id: string | number;
  readonly voice: string;
  readonly caption?: string;
}

// ---------------------------------------------------------------------------
// Inbound Update shape (partial)
// ---------------------------------------------------------------------------

interface TgUser {
  readonly id: number;
  readonly username?: string;
  readonly first_name: string;
}

interface TgChat {
  readonly id: number;
  readonly type: "private" | "group" | "supergroup" | "channel";
}

interface TgMessage {
  readonly message_id: number;
  readonly from?: TgUser;
  readonly chat: TgChat;
  readonly date: number;
  readonly text?: string;
  readonly photo?: ReadonlyArray<{ readonly file_id: string }>;
  readonly document?: { readonly file_id: string };
  readonly voice?: { readonly file_id: string };
  readonly reply_to_message?: { readonly message_id: number };
  readonly location?: { readonly latitude: number; readonly longitude: number };
}

interface TgCallbackQuery {
  readonly id: string;
  readonly from: TgUser;
  readonly message?: TgMessage;
  readonly data?: string;
}

interface TgUpdate {
  readonly update_id: number;
  readonly message?: TgMessage;
  readonly callback_query?: TgCallbackQuery;
}

// ---------------------------------------------------------------------------
// Built-in command payloads
// ---------------------------------------------------------------------------

const COMMAND_PAYLOADS: ReadonlyMap<string, string> = new Map([
  ["/start", "__cmd_start"],
  ["/help", "__cmd_help"],
]);

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class TelegramParseError extends Error {
  constructor(
    reason: string,
    public readonly raw: unknown,
  ) {
    super(`Telegram webhook parse error: ${reason}`);
    this.name = "TelegramParseError";
  }
}

// ---------------------------------------------------------------------------
// TelegramAdapter
// ---------------------------------------------------------------------------

export class TelegramAdapter implements MessagingAdapter {
  readonly platform = Platform.TELEGRAM;

  /**
   * @param httpClient  Injectable HTTP client.
   * @param botToken    Telegram Bot API token (from @BotFather).
   */
  constructor(
    private readonly httpClient: HttpClient,
    private readonly botToken: string,
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
      await this._sendMedia(msg);
      return;
    }

    const payload: TgSendMessagePayload = {
      chat_id: msg.chatId,
      text: msg.text,
    };

    await this._call("sendMessage", payload);
  }

  async sendButtons(chatId: string, text: string, buttons: Button[]): Promise<void> {
    // Telegram allows up to 100 buttons but we cap rows at 2 per row for
    // readability. Each Button becomes its own row.
    const inlineKeyboard: TgInlineKeyboardButton[][] = buttons.map((b) => [
      { text: b.label, callback_data: b.payload },
    ]);

    const payload: TgSendMessagePayload = {
      chat_id: chatId,
      text,
      reply_markup: { inline_keyboard: inlineKeyboard },
    };

    await this._call("sendMessage", payload);
  }

  parseWebhook(body: unknown): IncomingMessage {
    const update = body as TgUpdate;

    if (update.callback_query !== undefined) {
      return this._parseCallbackQuery(update.callback_query);
    }

    if (update.message !== undefined) {
      return this._parseMessage(update.message);
    }

    throw new TelegramParseError("update contains neither message nor callback_query", body);
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private _parseMessage(msg: TgMessage): IncomingMessage {
    const userId = String(msg.from?.id ?? msg.chat.id);
    const chatId = String(msg.chat.id);
    const text = msg.text ?? "";

    // Normalise /start and /help commands to synthetic payloads so callers
    // can dispatch on a stable string rather than raw command text.
    const normalisedText = COMMAND_PAYLOADS.get(text) ?? text;

    return {
      platform: Platform.TELEGRAM,
      userId,
      chatId,
      text: normalisedText,
      timestamp: msg.date * 1000,
      metadata: {
        ...(msg.location !== undefined
          ? {
              location: {
                latitude: msg.location.latitude,
                longitude: msg.location.longitude,
              },
            }
          : {}),
        ...(msg.reply_to_message !== undefined
          ? { replyTo: String(msg.reply_to_message.message_id) }
          : {}),
      },
    };
  }

  private _parseCallbackQuery(cq: TgCallbackQuery): IncomingMessage {
    const userId = String(cq.from.id);
    const chatId = cq.message !== undefined ? String(cq.message.chat.id) : userId;
    const timestamp = cq.message?.date !== undefined ? cq.message.date * 1000 : Date.now();

    return {
      platform: Platform.TELEGRAM,
      userId,
      chatId,
      text: cq.data ?? "",
      timestamp,
    };
  }

  private async _sendMedia(msg: OutgoingMessage): Promise<void> {
    if (msg.media === undefined) return;

    const { type, url, caption } = msg.media;

    if (type === "image") {
      const payload: TgSendPhotoPayload = {
        chat_id: msg.chatId,
        photo: url,
        ...(caption !== undefined ? { caption } : {}),
      };
      await this._call("sendPhoto", payload);
    } else if (type === "document") {
      const payload: TgSendDocumentPayload = {
        chat_id: msg.chatId,
        document: url,
        ...(caption !== undefined ? { caption } : {}),
      };
      await this._call("sendDocument", payload);
    } else {
      const payload: TgSendVoicePayload = {
        chat_id: msg.chatId,
        voice: url,
        ...(caption !== undefined ? { caption } : {}),
      };
      await this._call("sendVoice", payload);
    }
  }

  private async _call(
    method: string,
    payload: TgSendMessagePayload | TgSendPhotoPayload | TgSendDocumentPayload | TgSendVoicePayload,
  ): Promise<void> {
    const url = `https://api.telegram.org/bot${this.botToken}/${method}`;

    await this.httpClient.request({
      url,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
    });
  }
}
