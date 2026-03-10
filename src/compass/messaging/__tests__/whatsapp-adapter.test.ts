/**
 * WhatsAppAdapter — unit tests
 *
 * Uses a stub HttpClient so no real HTTP calls are made.
 */

import { describe, it, expect, vi } from "vitest";
import {
  WhatsAppAdapter,
  WhatsAppParseError,
  WhatsAppButtonLimitError,
} from "../core-logic/whatsapp-adapter.js";
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
      return { status: 200, body: { messages: [{ id: "wamid.test123" }] } };
    }),
  };
  return { client, calls };
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const PHONE_ID = "112233445566778";
const ACCESS_TOKEN = "test_token";

function makeAdapter(httpClient: HttpClient): WhatsAppAdapter {
  return new WhatsAppAdapter(httpClient, PHONE_ID, ACCESS_TOKEN);
}

const INBOUND_TEXT_WEBHOOK = {
  object: "whatsapp_business_account",
  entry: [
    {
      changes: [
        {
          value: {
            messages: [
              {
                id: "wamid.inbound001",
                from: "15551234567",
                timestamp: "1700000000",
                type: "text",
                text: { body: "Hello COMPASS" },
              },
            ],
          },
        },
      ],
    },
  ],
};

const INBOUND_BUTTON_REPLY_WEBHOOK = {
  object: "whatsapp_business_account",
  entry: [
    {
      changes: [
        {
          value: {
            messages: [
              {
                id: "wamid.inbound002",
                from: "15559876543",
                timestamp: "1700000100",
                type: "interactive",
                interactive: {
                  type: "button_reply",
                  button_reply: { id: "btn_housing", title: "Housing" },
                },
              },
            ],
          },
        },
      ],
    },
  ],
};

const INBOUND_LOCATION_WEBHOOK = {
  object: "whatsapp_business_account",
  entry: [
    {
      changes: [
        {
          value: {
            messages: [
              {
                id: "wamid.inbound003",
                from: "15550001111",
                timestamp: "1700000200",
                type: "location",
                location: { latitude: 40.7128, longitude: -74.006 },
              },
            ],
          },
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// Helper: access Record<string,unknown> with bracket notation (strict mode)
// ---------------------------------------------------------------------------
type R = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("WhatsAppAdapter", () => {
  describe("platform identifier", () => {
    it("reports platform as WHATSAPP", () => {
      const { client } = makeHttpClient();
      const adapter = makeAdapter(client);
      expect(adapter.platform).toBe(Platform.WHATSAPP);
    });
  });

  describe("sendMessage — plain text", () => {
    it("posts a text message with the correct Cloud API shape", async () => {
      const { client, calls } = makeHttpClient();
      const adapter = makeAdapter(client);

      await adapter.sendMessage({ chatId: "15551234567", text: "Hello there" });

      expect(calls).toHaveLength(1);
      const call = calls[0]!;
      expect(call.url).toContain(PHONE_ID);
      expect(call.url).toContain("messages");
      expect(call.method).toBe("POST");

      const body = call.body as R;
      expect(body["messaging_product"]).toBe("whatsapp");
      expect(body["type"]).toBe("text");
      expect((body["text"] as R)["body"]).toBe("Hello there");
    });

    it("sets Authorization header with bearer token", async () => {
      const { client, calls } = makeHttpClient();
      const adapter = makeAdapter(client);

      await adapter.sendMessage({ chatId: "15551234567", text: "Auth test" });

      expect(calls[0]?.headers?.["Authorization"]).toBe(`Bearer ${ACCESS_TOKEN}`);
    });
  });

  describe("sendMessage — with buttons (≤3)", () => {
    it("sends an interactive/button message for 1–3 buttons", async () => {
      const { client, calls } = makeHttpClient();
      const adapter = makeAdapter(client);

      await adapter.sendMessage({
        chatId: "15551234567",
        text: "Choose a service",
        buttons: [
          { id: "b1", label: "Housing", payload: "housing" },
          { id: "b2", label: "Food", payload: "food" },
        ],
      });

      const body = calls[0]?.body as R;
      expect(body["type"]).toBe("interactive");
      const interactive = body["interactive"] as R;
      expect(interactive["type"]).toBe("button");
      const action = interactive["action"] as R;
      const buttons = action["buttons"] as unknown[];
      expect(buttons).toHaveLength(2);
    });

    it("truncates button labels longer than 20 characters", async () => {
      const { client, calls } = makeHttpClient();
      const adapter = makeAdapter(client);

      await adapter.sendMessage({
        chatId: "15551234567",
        text: "Choose",
        buttons: [{ id: "b1", label: "A very long label that exceeds limit", payload: "p" }],
      });

      const body = calls[0]?.body as R;
      const interactive = body["interactive"] as R;
      const action = interactive["action"] as R;
      const buttons = action["buttons"] as R[];
      const replyLabel = (buttons[0]?.["reply"] as R)?.["title"] as string;
      expect(replyLabel.length).toBeLessThanOrEqual(20);
    });
  });

  describe("sendButtons — list message (4–10 buttons)", () => {
    it("sends an interactive/list message when there are 4–10 buttons", async () => {
      const { client, calls } = makeHttpClient();
      const adapter = makeAdapter(client);

      const buttons = Array.from({ length: 5 }, (_, i) => ({
        id: `b${i}`,
        label: `Option ${i + 1}`,
        payload: `payload_${i}`,
      }));

      await adapter.sendButtons("15551234567", "Pick one", buttons);

      const body = calls[0]?.body as R;
      expect(body["type"]).toBe("interactive");
      const interactive = body["interactive"] as R;
      expect(interactive["type"]).toBe("list");
    });

    it("throws WhatsAppButtonLimitError for more than 10 buttons", async () => {
      const { client } = makeHttpClient();
      const adapter = makeAdapter(client);

      const buttons = Array.from({ length: 11 }, (_, i) => ({
        id: `b${i}`,
        label: `Option ${i}`,
        payload: `p${i}`,
      }));

      await expect(adapter.sendButtons("123", "Test", buttons)).rejects.toThrow(
        WhatsAppButtonLimitError,
      );
    });
  });

  describe("sendMessage — media", () => {
    it("sends an image message when media type is image", async () => {
      const { client, calls } = makeHttpClient();
      const adapter = makeAdapter(client);

      await adapter.sendMessage({
        chatId: "15551234567",
        text: "See attached image",
        media: { type: "image", url: "https://example.com/photo.jpg", caption: "Document scan" },
      });

      const body = calls[0]?.body as R;
      expect(body["type"]).toBe("image");
      const image = body["image"] as R;
      expect(image["link"]).toBe("https://example.com/photo.jpg");
    });

    it("sends a document message when media type is document", async () => {
      const { client, calls } = makeHttpClient();
      const adapter = makeAdapter(client);

      await adapter.sendMessage({
        chatId: "15551234567",
        text: "See attached file",
        media: { type: "document", url: "https://example.com/form.pdf" },
      });

      const body = calls[0]?.body as R;
      expect(body["type"]).toBe("document");
    });
  });

  describe("parseWebhook — text message", () => {
    it("extracts a normalised IncomingMessage from a text webhook", () => {
      const { client } = makeHttpClient();
      const adapter = makeAdapter(client);

      const msg = adapter.parseWebhook(INBOUND_TEXT_WEBHOOK);

      expect(msg.platform).toBe(Platform.WHATSAPP);
      expect(msg.userId).toBe("15551234567");
      expect(msg.chatId).toBe("15551234567");
      expect(msg.text).toBe("Hello COMPASS");
      expect(msg.timestamp).toBe(1700000000 * 1000);
    });
  });

  describe("parseWebhook — button reply", () => {
    it("extracts the button title as message text", () => {
      const { client } = makeHttpClient();
      const adapter = makeAdapter(client);

      const msg = adapter.parseWebhook(INBOUND_BUTTON_REPLY_WEBHOOK);

      expect(msg.text).toBe("Housing");
      expect(msg.userId).toBe("15559876543");
    });
  });

  describe("parseWebhook — location", () => {
    it("sets metadata.location when a location message is received", () => {
      const { client } = makeHttpClient();
      const adapter = makeAdapter(client);

      const msg = adapter.parseWebhook(INBOUND_LOCATION_WEBHOOK);

      expect(msg.text).toBe("");
      expect(msg.metadata?.location?.latitude).toBeCloseTo(40.7128);
      expect(msg.metadata?.location?.longitude).toBeCloseTo(-74.006);
    });
  });

  describe("parseWebhook — errors", () => {
    it("throws WhatsAppParseError when object is wrong", () => {
      const { client } = makeHttpClient();
      const adapter = makeAdapter(client);

      expect(() => adapter.parseWebhook({ object: "instagram", entry: [] })).toThrow(
        WhatsAppParseError,
      );
    });

    it("throws WhatsAppParseError when entry is empty", () => {
      const { client } = makeHttpClient();
      const adapter = makeAdapter(client);

      expect(() =>
        adapter.parseWebhook({ object: "whatsapp_business_account", entry: [] }),
      ).toThrow(WhatsAppParseError);
    });

    it("throws WhatsAppParseError when messages array is absent", () => {
      const { client } = makeHttpClient();
      const adapter = makeAdapter(client);

      expect(() =>
        adapter.parseWebhook({
          object: "whatsapp_business_account",
          entry: [{ changes: [{ value: {} }] }],
        }),
      ).toThrow(WhatsAppParseError);
    });
  });

  describe("verifyWebhook", () => {
    it("returns the challenge string when mode and token match", () => {
      const { client } = makeHttpClient();
      const adapter = makeAdapter(client);

      const result = adapter.verifyWebhook(
        {
          "hub.mode": "subscribe",
          "hub.verify_token": "my_secret_token",
          "hub.challenge": "abc123",
        },
        "my_secret_token",
      );

      expect(result).toBe("abc123");
    });

    it("returns null when the verify token does not match", () => {
      const { client } = makeHttpClient();
      const adapter = makeAdapter(client);

      const result = adapter.verifyWebhook(
        {
          "hub.mode": "subscribe",
          "hub.verify_token": "wrong_token",
          "hub.challenge": "abc123",
        },
        "my_secret_token",
      );

      expect(result).toBeNull();
    });

    it("returns null when hub.mode is not subscribe", () => {
      const { client } = makeHttpClient();
      const adapter = makeAdapter(client);

      const result = adapter.verifyWebhook(
        {
          "hub.mode": "unsubscribe",
          "hub.verify_token": "my_secret_token",
          "hub.challenge": "abc123",
        },
        "my_secret_token",
      );

      expect(result).toBeNull();
    });
  });
});
