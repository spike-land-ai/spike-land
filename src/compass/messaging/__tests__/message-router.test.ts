/**
 * MessageRouter + adaptMessage — unit tests
 */

import { describe, it, expect, vi } from "vitest";
import { MessageRouter, UnknownPlatformError, adaptMessage } from "../core-logic/message-router.js";
import { formatButtonsAsText } from "../core-logic/sms-adapter.js";
import type { Button, HttpClient, HttpRequest, HttpResponse, OutgoingMessage } from "../types.js";
import { Platform } from "../types.js";
import { WhatsAppAdapter } from "../core-logic/whatsapp-adapter.js";
import { TelegramAdapter } from "../core-logic/telegram-adapter.js";
import { SMSAdapter } from "../core-logic/sms-adapter.js";

// ---------------------------------------------------------------------------
// Shared stub HttpClient factory
// ---------------------------------------------------------------------------

function makeHttpClient(): { client: HttpClient; calls: HttpRequest[] } {
  const calls: HttpRequest[] = [];
  const client: HttpClient = {
    request: vi.fn(async (req: HttpRequest): Promise<HttpResponse> => {
      calls.push(req);
      return { status: 200, body: {} };
    }),
  };
  return { client, calls };
}

// Helper type alias for strict bracket access
type R = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Adapter factories
// ---------------------------------------------------------------------------

function makeWaAdapter(httpClient: HttpClient): WhatsAppAdapter {
  return new WhatsAppAdapter(httpClient, "phone_id", "token");
}

function makeTgAdapter(httpClient: HttpClient): TelegramAdapter {
  return new TelegramAdapter(httpClient, "bot_token");
}

function makeSmsAdapter(httpClient: HttpClient): SMSAdapter {
  return new SMSAdapter(httpClient, "AC_sid", "auth_token", "+15550000000");
}

// ---------------------------------------------------------------------------
// adaptMessage — pure transformation tests
// ---------------------------------------------------------------------------

describe("adaptMessage", () => {
  const threeButtons: Button[] = [
    { id: "b1", label: "Housing assistance program", payload: "housing" },
    { id: "b2", label: "Food", payload: "food" },
    { id: "b3", label: "Healthcare", payload: "healthcare" },
  ];

  describe("WhatsApp", () => {
    it("truncates button labels to 20 characters", () => {
      const msg: OutgoingMessage = {
        chatId: "123",
        text: "Choose",
        buttons: threeButtons,
      };

      const adapted = adaptMessage(msg, Platform.WHATSAPP);

      for (const btn of adapted.buttons ?? []) {
        expect(btn.label.length).toBeLessThanOrEqual(20);
      }
    });

    it("limits buttons to 10 maximum", () => {
      const manyButtons: Button[] = Array.from({ length: 15 }, (_, i) => ({
        id: `b${i}`,
        label: `Option ${i}`,
        payload: `payload_${i}`,
      }));

      const adapted = adaptMessage(
        { chatId: "123", text: "Pick", buttons: manyButtons },
        Platform.WHATSAPP,
      );

      expect(adapted.buttons?.length).toBeLessThanOrEqual(10);
    });

    it("passes through messages without buttons unchanged", () => {
      const msg: OutgoingMessage = { chatId: "123", text: "Hello" };
      const adapted = adaptMessage(msg, Platform.WHATSAPP);
      expect(adapted).toBe(msg); // Same reference — no copy needed.
    });
  });

  describe("Telegram", () => {
    it("returns the message unchanged (Telegram has no special constraints)", () => {
      const msg: OutgoingMessage = {
        chatId: "123",
        text: "A very long message that does not need truncation on Telegram.",
        buttons: threeButtons,
      };

      const adapted = adaptMessage(msg, Platform.TELEGRAM);
      expect(adapted).toBe(msg);
    });
  });

  describe("SMS", () => {
    it("converts buttons to numbered text options and removes buttons array", () => {
      const msg: OutgoingMessage = {
        chatId: "+15551234567",
        text: "What do you need?",
        buttons: [
          { id: "b1", label: "Housing", payload: "housing" },
          { id: "b2", label: "Food", payload: "food" },
        ],
      };

      const adapted = adaptMessage(msg, Platform.SMS);

      expect(adapted.buttons).toBeUndefined();
      expect(adapted.text).toContain("1. Housing");
      expect(adapted.text).toContain("2. Food");
      expect(adapted.text).toContain("What do you need?");
    });

    it("returns the message unchanged when there are no buttons", () => {
      const msg: OutgoingMessage = { chatId: "+15551234567", text: "Hello" };
      const adapted = adaptMessage(msg, Platform.SMS);
      expect(adapted).toBe(msg);
    });

    it("preserves media attachment on SMS adaptation", () => {
      const msg: OutgoingMessage = {
        chatId: "+15551234567",
        text: "See link",
        buttons: [{ id: "b1", label: "Click here", payload: "url" }],
        media: { type: "document", url: "https://example.com/doc.pdf" },
      };

      const adapted = adaptMessage(msg, Platform.SMS);
      expect(adapted.media).toBeDefined();
      expect(adapted.media?.url).toBe("https://example.com/doc.pdf");
    });
  });
});

// ---------------------------------------------------------------------------
// MessageRouter
// ---------------------------------------------------------------------------

describe("MessageRouter", () => {
  function makeRouter(): {
    router: MessageRouter;
    waCalls: HttpRequest[];
    tgCalls: HttpRequest[];
    smsCalls: HttpRequest[];
  } {
    const { client: waClient, calls: waCalls } = makeHttpClient();
    const { client: tgClient, calls: tgCalls } = makeHttpClient();
    const { client: smsClient, calls: smsCalls } = makeHttpClient();

    const router = new MessageRouter();
    router.registerAdapter(makeWaAdapter(waClient));
    router.registerAdapter(makeTgAdapter(tgClient));
    router.registerAdapter(makeSmsAdapter(smsClient));

    return { router, waCalls, tgCalls, smsCalls };
  }

  describe("registerAdapter", () => {
    it("replaces an existing adapter when the same platform is registered again", () => {
      const router = new MessageRouter();
      const { client: c1, calls: calls1 } = makeHttpClient();
      const { client: c2, calls: calls2 } = makeHttpClient();

      router.registerAdapter(makeWaAdapter(c1));
      router.registerAdapter(makeWaAdapter(c2));

      // The second adapter (c2) should receive the call.
      void router.routeOutgoing(Platform.WHATSAPP, { chatId: "123", text: "Test" });

      expect(calls2.length).toBeGreaterThan(0);
      expect(calls1).toHaveLength(0);
    });
  });

  describe("routeIncoming", () => {
    it("dispatches to the WhatsApp adapter for Platform.WHATSAPP", () => {
      const { router } = makeRouter();

      const waWebhook = {
        object: "whatsapp_business_account",
        entry: [
          {
            changes: [
              {
                value: {
                  messages: [
                    {
                      id: "wamid.1",
                      from: "15551234567",
                      timestamp: "1700000000",
                      type: "text",
                      text: { body: "Hi" },
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      const incoming = router.routeIncoming(Platform.WHATSAPP, waWebhook);
      expect(incoming.platform).toBe(Platform.WHATSAPP);
      expect(incoming.text).toBe("Hi");
    });

    it("dispatches to the Telegram adapter for Platform.TELEGRAM", () => {
      const { router } = makeRouter();

      const tgUpdate = {
        update_id: 1001,
        message: {
          message_id: 1,
          from: { id: 100, first_name: "User" },
          chat: { id: 100, type: "private" },
          date: 1700000000,
          text: "Telegram text",
        },
      };

      const incoming = router.routeIncoming(Platform.TELEGRAM, tgUpdate);
      expect(incoming.platform).toBe(Platform.TELEGRAM);
      expect(incoming.text).toBe("Telegram text");
    });

    it("dispatches to the SMS adapter for Platform.SMS", () => {
      const { router } = makeRouter();

      const smsWebhook = { From: "+15559876543", Body: "SMS text", To: "+15550000000" };
      const incoming = router.routeIncoming(Platform.SMS, smsWebhook);

      expect(incoming.platform).toBe(Platform.SMS);
      expect(incoming.text).toBe("SMS text");
    });

    it("throws UnknownPlatformError when no adapter is registered", () => {
      const router = new MessageRouter();

      expect(() => router.routeIncoming(Platform.WHATSAPP, {})).toThrow(UnknownPlatformError);
    });
  });

  describe("routeOutgoing", () => {
    it("routes a WhatsApp message through the WhatsApp adapter", async () => {
      const { router, waCalls, tgCalls, smsCalls } = makeRouter();

      await router.routeOutgoing(Platform.WHATSAPP, {
        chatId: "15551234567",
        text: "Hello from router",
      });

      expect(waCalls.length).toBeGreaterThan(0);
      expect(tgCalls).toHaveLength(0);
      expect(smsCalls).toHaveLength(0);
    });

    it("routes a Telegram message through the Telegram adapter", async () => {
      const { router, tgCalls } = makeRouter();

      await router.routeOutgoing(Platform.TELEGRAM, { chatId: "987654321", text: "Hi Telegram" });

      expect(tgCalls.length).toBeGreaterThan(0);
    });

    it("routes an SMS message through the SMS adapter", async () => {
      const { router, smsCalls } = makeRouter();

      await router.routeOutgoing(Platform.SMS, { chatId: "+15559876543", text: "Hello SMS" });

      expect(smsCalls.length).toBeGreaterThan(0);
    });

    it("adapts button messages for SMS before dispatching (no interactive payload)", async () => {
      const { router, smsCalls } = makeRouter();

      await router.routeOutgoing(Platform.SMS, {
        chatId: "+15559876543",
        text: "What do you need?",
        buttons: [
          { id: "b1", label: "Housing", payload: "housing" },
          { id: "b2", label: "Food", payload: "food" },
        ],
      });

      expect(smsCalls.length).toBeGreaterThan(0);
      // The SMS body should contain numbered options, not JSON button data.
      const body = smsCalls[0]?.body as R;
      expect(body["Body"]).toContain("1. Housing");
      expect(body["Body"]).toContain("2. Food");
    });

    it("throws UnknownPlatformError for an unregistered platform", async () => {
      const router = new MessageRouter();

      await expect(
        router.routeOutgoing(Platform.TELEGRAM, { chatId: "123", text: "test" }),
      ).rejects.toThrow(UnknownPlatformError);
    });
  });

  describe("routeButtons", () => {
    it("sends buttons via the Telegram adapter as InlineKeyboard", async () => {
      const { router, tgCalls } = makeRouter();

      await router.routeButtons(Platform.TELEGRAM, "987654321", "Pick an option", [
        { id: "b1", label: "Option A", payload: "a" },
        { id: "b2", label: "Option B", payload: "b" },
      ]);

      expect(tgCalls.length).toBeGreaterThan(0);
      const body = tgCalls[0]?.body as R;
      expect(body["reply_markup"]).toBeDefined();
    });

    it("sends buttons on SMS as numbered text (no interactive wrapper)", async () => {
      const { router, smsCalls } = makeRouter();

      await router.routeButtons(Platform.SMS, "+15559876543", "Which service?", [
        { id: "s1", label: "Service A", payload: "a" },
        { id: "s2", label: "Service B", payload: "b" },
      ]);

      expect(smsCalls.length).toBeGreaterThan(0);
      const body = smsCalls[0]?.body as R;
      expect(body["Body"]).toContain("1. Service A");
    });
  });
});

// ---------------------------------------------------------------------------
// formatButtonsAsText (SMS fallback utility)
// ---------------------------------------------------------------------------

describe("formatButtonsAsText", () => {
  it("appends numbered options after the prompt text", () => {
    const result = formatButtonsAsText("What do you need?", [
      { id: "b1", label: "Housing", payload: "housing" },
      { id: "b2", label: "Healthcare", payload: "healthcare" },
    ]);

    expect(result).toBe("What do you need?\n\n1. Housing\n2. Healthcare");
  });

  it("handles a single button", () => {
    const result = formatButtonsAsText("Continue?", [
      { id: "yes", label: "Yes", payload: "__yes" },
    ]);

    expect(result).toBe("Continue?\n\n1. Yes");
  });

  it("handles an empty buttons array", () => {
    const result = formatButtonsAsText("Hello", []);
    expect(result).toBe("Hello\n\n");
  });
});
