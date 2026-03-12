/**
 * TelegramAdapter — unit tests
 */

import { describe, it, expect, vi } from "vitest";
import { TelegramAdapter, TelegramParseError } from "../core-logic/telegram-adapter.js";
import type { HttpClient, HttpRequest, HttpResponse } from "../types.js";
import { Platform } from "../types.js";

// ---------------------------------------------------------------------------
// Stub HttpClient
// ---------------------------------------------------------------------------

function makeHttpClient(): { client: HttpClient; calls: HttpRequest[] } {
  const calls: HttpRequest[] = [];
  const client: HttpClient = {
    request: vi.fn(async (req: HttpRequest): Promise<HttpResponse> => {
      calls.push(req);
      return { status: 200, body: { ok: true, result: { message_id: 99 } } };
    }),
  };
  return { client, calls };
}

const BOT_TOKEN = "123456:ABC-test_token";

function makeAdapter(httpClient: HttpClient): TelegramAdapter {
  return new TelegramAdapter(httpClient, BOT_TOKEN);
}

// Helper type alias for strict bracket access
type R = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const TEXT_UPDATE = {
  update_id: 1001,
  message: {
    message_id: 42,
    from: { id: 987654321, first_name: "Amina", username: "amina_user" },
    chat: { id: 987654321, type: "private" },
    date: 1700000000,
    text: "I need help with housing",
  },
};

const CALLBACK_QUERY_UPDATE = {
  update_id: 1002,
  callback_query: {
    id: "cq_001",
    from: { id: 987654321, first_name: "Amina" },
    message: {
      message_id: 43,
      chat: { id: 987654321, type: "private" },
      date: 1700000050,
    },
    data: "housing",
  },
};

const START_COMMAND_UPDATE = {
  update_id: 1003,
  message: {
    message_id: 44,
    from: { id: 111222333, first_name: "New User" },
    chat: { id: 111222333, type: "private" },
    date: 1700000100,
    text: "/start",
  },
};

const HELP_COMMAND_UPDATE = {
  update_id: 1004,
  message: {
    message_id: 45,
    from: { id: 111222333, first_name: "New User" },
    chat: { id: 111222333, type: "private" },
    date: 1700000150,
    text: "/help",
  },
};

const LOCATION_UPDATE = {
  update_id: 1005,
  message: {
    message_id: 46,
    from: { id: 444555666, first_name: "Maria" },
    chat: { id: 444555666, type: "private" },
    date: 1700000200,
    location: { latitude: 51.5074, longitude: -0.1278 },
  },
};

const REPLY_UPDATE = {
  update_id: 1006,
  message: {
    message_id: 47,
    from: { id: 777888999, first_name: "Juan" },
    chat: { id: 777888999, type: "private" },
    date: 1700000300,
    text: "Could you explain more?",
    reply_to_message: { message_id: 40 },
  },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("TelegramAdapter", () => {
  describe("platform identifier", () => {
    it("reports platform as TELEGRAM", () => {
      const { client } = makeHttpClient();
      expect(makeAdapter(client).platform).toBe(Platform.TELEGRAM);
    });
  });

  describe("sendMessage — plain text", () => {
    it("calls sendMessage on the Bot API", async () => {
      const { client, calls } = makeHttpClient();
      const adapter = makeAdapter(client);

      await adapter.sendMessage({ chatId: "987654321", text: "Hello Amina" });

      expect(calls).toHaveLength(1);
      const call = calls[0];
      expect(call.url).toContain(BOT_TOKEN);
      expect(call.url).toContain("sendMessage");
      expect(call.method).toBe("POST");

      const body = call.body as R;
      expect(body["chat_id"]).toBe("987654321");
      expect(body["text"]).toBe("Hello Amina");
    });

    it("does not include reply_markup for plain text messages", async () => {
      const { client, calls } = makeHttpClient();
      const adapter = makeAdapter(client);

      await adapter.sendMessage({ chatId: "123", text: "Plain text" });

      const body = calls[0]?.body as R;
      expect(body["reply_markup"]).toBeUndefined();
    });
  });

  describe("sendButtons", () => {
    it("sends an InlineKeyboardMarkup with one button per row", async () => {
      const { client, calls } = makeHttpClient();
      const adapter = makeAdapter(client);

      await adapter.sendButtons("987654321", "How can I help?", [
        { id: "b1", label: "Housing", payload: "housing" },
        { id: "b2", label: "Food assistance", payload: "food" },
        { id: "b3", label: "Legal advice", payload: "legal" },
      ]);

      const body = calls[0]?.body as R;
      const replyMarkup = body["reply_markup"] as R;
      const keyboard = replyMarkup["inline_keyboard"] as unknown[][];

      expect(keyboard).toHaveLength(3);
      // Each row should have exactly one button.
      expect(keyboard[0]).toHaveLength(1);

      const firstButton = (keyboard[0] as R[])[0];
      expect(firstButton["text"]).toBe("Housing");
      expect(firstButton["callback_data"]).toBe("housing");
    });

    it("includes button text and callback_data in the keyboard", async () => {
      const { client, calls } = makeHttpClient();
      const adapter = makeAdapter(client);

      await adapter.sendButtons("123", "Options", [
        { id: "opt1", label: "Yes", payload: "__yes" },
        { id: "opt2", label: "No", payload: "__no" },
      ]);

      const body = calls[0]?.body as R;
      const replyMarkup = body["reply_markup"] as R;
      const keyboard = replyMarkup["inline_keyboard"] as R[][];

      expect(keyboard[1]?.[0]?.["callback_data"]).toBe("__no");
    });

    it("sends via sendMessage when called indirectly through sendMessage with buttons", async () => {
      const { client, calls } = makeHttpClient();
      const adapter = makeAdapter(client);

      await adapter.sendMessage({
        chatId: "123",
        text: "Choose",
        buttons: [{ id: "b1", label: "Option A", payload: "a" }],
      });

      expect(calls).toHaveLength(1);
      const body = calls[0]?.body as R;
      expect(body["reply_markup"]).toBeDefined();
    });
  });

  describe("sendMessage — media", () => {
    it("calls sendPhoto for image attachments", async () => {
      const { client, calls } = makeHttpClient();
      const adapter = makeAdapter(client);

      await adapter.sendMessage({
        chatId: "123",
        text: "Photo",
        media: { type: "image", url: "https://example.com/img.jpg", caption: "ID card" },
      });

      expect(calls[0]?.url).toContain("sendPhoto");
    });

    it("calls sendDocument for document attachments", async () => {
      const { client, calls } = makeHttpClient();
      const adapter = makeAdapter(client);

      await adapter.sendMessage({
        chatId: "123",
        text: "Document",
        media: { type: "document", url: "https://example.com/form.pdf" },
      });

      expect(calls[0]?.url).toContain("sendDocument");
    });

    it("calls sendVoice for voice attachments", async () => {
      const { client, calls } = makeHttpClient();
      const adapter = makeAdapter(client);

      await adapter.sendMessage({
        chatId: "123",
        text: "Voice",
        media: { type: "voice", url: "https://example.com/audio.ogg" },
      });

      expect(calls[0]?.url).toContain("sendVoice");
    });
  });

  describe("parseWebhook — text message", () => {
    it("extracts a normalised IncomingMessage", () => {
      const { client } = makeHttpClient();
      const msg = makeAdapter(client).parseWebhook(TEXT_UPDATE);

      expect(msg.platform).toBe(Platform.TELEGRAM);
      expect(msg.userId).toBe("987654321");
      expect(msg.chatId).toBe("987654321");
      expect(msg.text).toBe("I need help with housing");
      expect(msg.timestamp).toBe(1700000000 * 1000);
    });
  });

  describe("parseWebhook — callback_query", () => {
    it("extracts callback data as message text", () => {
      const { client } = makeHttpClient();
      const msg = makeAdapter(client).parseWebhook(CALLBACK_QUERY_UPDATE);

      expect(msg.platform).toBe(Platform.TELEGRAM);
      expect(msg.text).toBe("housing");
      expect(msg.userId).toBe("987654321");
      expect(msg.chatId).toBe("987654321");
    });
  });

  describe("parseWebhook — /start command", () => {
    it("normalises /start to __cmd_start payload", () => {
      const { client } = makeHttpClient();
      const msg = makeAdapter(client).parseWebhook(START_COMMAND_UPDATE);

      expect(msg.text).toBe("__cmd_start");
    });
  });

  describe("parseWebhook — /help command", () => {
    it("normalises /help to __cmd_help payload", () => {
      const { client } = makeHttpClient();
      const msg = makeAdapter(client).parseWebhook(HELP_COMMAND_UPDATE);

      expect(msg.text).toBe("__cmd_help");
    });
  });

  describe("parseWebhook — location", () => {
    it("sets metadata.location", () => {
      const { client } = makeHttpClient();
      const msg = makeAdapter(client).parseWebhook(LOCATION_UPDATE);

      expect(msg.text).toBe("");
      expect(msg.metadata?.location?.latitude).toBeCloseTo(51.5074);
      expect(msg.metadata?.location?.longitude).toBeCloseTo(-0.1278);
    });
  });

  describe("parseWebhook — reply", () => {
    it("sets metadata.replyTo to the original message_id", () => {
      const { client } = makeHttpClient();
      const msg = makeAdapter(client).parseWebhook(REPLY_UPDATE);

      expect(msg.metadata?.replyTo).toBe("40");
    });
  });

  describe("parseWebhook — errors", () => {
    it("throws TelegramParseError when neither message nor callback_query is present", () => {
      const { client } = makeHttpClient();
      const adapter = makeAdapter(client);

      expect(() => adapter.parseWebhook({ update_id: 9999 })).toThrow(TelegramParseError);
    });
  });
});
