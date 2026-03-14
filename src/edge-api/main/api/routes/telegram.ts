import { Hono } from "hono";
import type { Env, Variables } from "../../core-logic/env.js";
import { createLogger } from "@spike-land-ai/shared";
import { TelegramAdapter, TelegramParseError } from "../../../../compass/messaging/index.js";
import type { HttpClient, IncomingMessage } from "../../../../compass/messaging/types.js";
import { routeToSpikeChat } from "../../core-logic/messaging-bridge.js";

const log = createLogger("telegram");

const telegram = new Hono<{ Bindings: Env; Variables: Variables }>();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build an HttpClient that uses the global fetch (CF Workers compatible). */
function buildHttpClient(): HttpClient {
  return {
    async request(req) {
      const res = await fetch(req.url, {
        method: req.method,
        headers: req.headers as Record<string, string>,
        body: req.body ? JSON.stringify(req.body) : null,
      });
      return { status: res.status, body: await res.json() };
    },
  };
}

/** Send a text reply back to a Telegram chat. */
async function sendTelegramReply(
  botToken: string,
  chatId: string,
  text: string,
  parseMode?: "HTML" | "MarkdownV2",
): Promise<void> {
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      ...(parseMode ? { parse_mode: parseMode } : {}),
    }),
  });
}

/** Send a typing indicator to show the bot is working. */
async function sendTypingAction(botToken: string, chatId: string): Promise<void> {
  await fetch(`https://api.telegram.org/bot${botToken}/sendChatAction`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, action: "typing" }),
  }).catch(() => {
    /* best-effort */
  });
}

/**
 * Look up the spike.land userId linked to a Telegram user.
 * Uses the telegram_links table in D1.
 */
async function resolveTelegramUser(env: Env, telegramUserId: string): Promise<string | null> {
  try {
    const link = await env.DB.prepare(
      "SELECT user_id FROM telegram_links WHERE telegram_user_id = ? AND verified_at IS NOT NULL",
    )
      .bind(telegramUserId)
      .first<{ user_id: string }>();
    return link?.user_id ?? null;
  } catch {
    // Table may not exist yet — return null
    return null;
  }
}

/**
 * Route a Telegram message through the spike-chat pipeline via the shared bridge.
 */
async function routeTelegramToChat(env: Env, incoming: IncomingMessage): Promise<string> {
  const userId = await resolveTelegramUser(env, incoming.userId);
  if (!userId) {
    return (
      "Your Telegram account is not linked to spike.land. " +
      "Visit https://spike.land/settings/telegram to link your account.\n\n" +
      "Or send a 6-digit link code to connect."
    );
  }

  return routeToSpikeChat(env, {
    text: incoming.text,
    source: "telegram",
    userId,
    persona: "radix",
  });
}

// ---------------------------------------------------------------------------
// Webhook verification endpoint (for setWebhook)
// ---------------------------------------------------------------------------

telegram.get("/telegram/webhook", (c) => {
  return c.text("Telegram webhook endpoint is active", 200);
});

// ---------------------------------------------------------------------------
// Webhook handler (no auth — uses Telegram secret token header)
// ---------------------------------------------------------------------------

telegram.post("/telegram/webhook", async (c) => {
  const botToken = c.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    log.error("TELEGRAM_BOT_TOKEN not configured");
    return c.json({ error: "Bot not configured" }, 503);
  }

  // Verify secret token header (set via setWebhook secret_token param)
  const webhookSecret = c.env.TELEGRAM_WEBHOOK_SECRET;
  if (webhookSecret) {
    const headerSecret = c.req.header("X-Telegram-Bot-Api-Secret-Token");
    if (headerSecret !== webhookSecret) {
      return c.json({ error: "Invalid secret token" }, 401);
    }
  }

  // Parse the update
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }

  // Use the TelegramAdapter to parse the webhook
  const httpClient = buildHttpClient();
  const adapter = new TelegramAdapter(httpClient, botToken);

  let incoming: IncomingMessage;
  try {
    incoming = adapter.parseWebhook(body);
  } catch (err) {
    if (err instanceof TelegramParseError) {
      // Not a message or callback_query — acknowledge silently
      return c.json({ ok: true });
    }
    throw err;
  }

  // Handle built-in commands
  if (incoming.text === "__cmd_start") {
    try {
      c.executionCtx.waitUntil(
        sendTelegramReply(
          botToken,
          incoming.chatId,
          "Hey! I'm Spike ⚡ — your AI assistant on spike.land.\n\n" +
            "Send me any message and I'll route it through the spike-chat pipeline.\n\n" +
            "If your Telegram isn't linked yet, visit https://spike.land/settings/telegram",
        ),
      );
    } catch {
      /* no ExecutionContext in tests */
    }
    return c.json({ ok: true, action: "start" });
  }

  if (incoming.text === "__cmd_help") {
    try {
      c.executionCtx.waitUntil(
        sendTelegramReply(
          botToken,
          incoming.chatId,
          "Just send me a message! I can:\n" +
            "• Answer questions using spike.land's MCP tools\n" +
            "• Browse the web and take screenshots\n" +
            "• Search docs, APIs, and the tool catalog\n\n" +
            "/start — Welcome message\n" +
            "/help — This help text",
        ),
      );
    } catch {
      /* no ExecutionContext in tests */
    }
    return c.json({ ok: true, action: "help" });
  }

  // Check if the message is a 6-digit link code
  const isLinkCode = /^\d{6}$/.test(incoming.text.trim());
  if (isLinkCode) {
    try {
      const linkResult = await tryLinkAccount(c.env, incoming.userId, incoming.text.trim());
      c.executionCtx.waitUntil(sendTelegramReply(botToken, incoming.chatId, linkResult));
    } catch {
      /* no ExecutionContext in tests */
    }
    return c.json({ ok: true, action: "link_attempt" });
  }

  // For all other messages, route through spike-chat pipeline
  // Send typing indicator immediately, process in background
  try {
    c.executionCtx.waitUntil(
      (async () => {
        await sendTypingAction(botToken, incoming.chatId);

        let reply: string;
        try {
          reply = await routeTelegramToChat(c.env, incoming);
        } catch (err) {
          log.error("spike-chat routing error", { error: String(err) });
          reply = "Sorry, something went wrong. Please try again.";
        }

        // Telegram has a 4096 char limit per message — split if needed
        const chunks = splitMessage(reply, 4000);
        for (const chunk of chunks) {
          await sendTelegramReply(botToken, incoming.chatId, chunk);
        }
      })(),
    );
  } catch {
    /* no ExecutionContext in tests */
  }

  // Acknowledge immediately (Telegram expects 200 within 60s)
  return c.json({ ok: true, action: "processing" });
});

// ---------------------------------------------------------------------------
// Telegram account linking API (requires auth)
// ---------------------------------------------------------------------------

telegram.post("/telegram/link/initiate", async (c) => {
  const userId = c.get("userId");
  const code = generateLinkCode();
  const now = Date.now();
  const expiresAt = now + 10 * 60 * 1000; // 10 minutes

  const existing = await c.env.DB.prepare(
    "SELECT id FROM telegram_links WHERE user_id = ? AND verified_at IS NULL",
  )
    .bind(userId)
    .first<{ id: string }>();

  if (existing) {
    await c.env.DB.prepare(
      "UPDATE telegram_links SET link_code = ?, link_code_expires_at = ?, updated_at = ? WHERE id = ?",
    )
      .bind(code, expiresAt, now, existing.id)
      .run();
  } else {
    await c.env.DB.prepare(
      "INSERT INTO telegram_links (id, user_id, link_code, link_code_expires_at, created_at, updated_at) VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, ?)",
    )
      .bind(userId, code, expiresAt, now, now)
      .run();
  }

  return c.json({
    code,
    instruction: `Send this code to the Spike bot on Telegram: ${code}`,
  });
});

telegram.post("/telegram/link/verify-code", async (c) => {
  // Called from the Telegram webhook when a user sends a link code
  const body = await c.req.json<{ telegramUserId: string; code: string }>();

  if (!body.code || !body.telegramUserId) {
    return c.json({ error: "code and telegramUserId are required" }, 400);
  }

  const now = Date.now();
  const link = await c.env.DB.prepare(
    "SELECT id, user_id, link_code_expires_at FROM telegram_links WHERE link_code = ? AND verified_at IS NULL",
  )
    .bind(body.code)
    .first<{ id: string; user_id: string; link_code_expires_at: number }>();

  if (!link) {
    return c.json({ error: "Invalid or expired code" }, 404);
  }

  if (now > link.link_code_expires_at) {
    return c.json({ error: "Code expired" }, 410);
  }

  await c.env.DB.prepare(
    "UPDATE telegram_links SET telegram_user_id = ?, verified_at = ?, updated_at = ? WHERE id = ?",
  )
    .bind(body.telegramUserId, now, now, link.id)
    .run();

  return c.json({ linked: true, userId: link.user_id });
});

telegram.get("/telegram/link/status", async (c) => {
  const userId = c.get("userId");

  const link = await c.env.DB.prepare(
    "SELECT telegram_user_id, verified_at, created_at FROM telegram_links WHERE user_id = ?",
  )
    .bind(userId)
    .first<{ telegram_user_id: string | null; verified_at: number | null; created_at: number }>();

  if (!link) {
    return c.json({ linked: false });
  }

  return c.json({
    linked: link.verified_at !== null,
    hasTelegramId: link.telegram_user_id !== null,
    linkedAt: link.verified_at,
    createdAt: link.created_at,
  });
});

telegram.delete("/telegram/link", async (c) => {
  const userId = c.get("userId");
  await c.env.DB.prepare("DELETE FROM telegram_links WHERE user_id = ?").bind(userId).run();
  return c.json({ unlinked: true });
});

// ---------------------------------------------------------------------------
// Account linking via code sent in Telegram chat
// ---------------------------------------------------------------------------

async function tryLinkAccount(env: Env, telegramUserId: string, code: string): Promise<string> {
  const now = Date.now();

  try {
    const link = await env.DB.prepare(
      "SELECT id, user_id, link_code_expires_at FROM telegram_links WHERE link_code = ? AND verified_at IS NULL",
    )
      .bind(code)
      .first<{ id: string; user_id: string; link_code_expires_at: number }>();

    if (!link) {
      return "Invalid code. Please generate a new one at https://spike.land/settings/telegram";
    }

    if (now > link.link_code_expires_at) {
      return "This code has expired. Please generate a new one at https://spike.land/settings/telegram";
    }

    await env.DB.prepare(
      "UPDATE telegram_links SET telegram_user_id = ?, verified_at = ?, updated_at = ? WHERE id = ?",
    )
      .bind(telegramUserId, now, now, link.id)
      .run();

    return "Your Telegram account is now linked to spike.land! Send me any message to chat with Spike.";
  } catch (err) {
    log.error("Link account error", { error: String(err) });
    return "Failed to link account. Please try again.";
  }
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function generateLinkCode(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return String((array[0] ?? 0) % 1000000).padStart(6, "0");
}

function splitMessage(text: string, maxLen: number): string[] {
  if (text.length <= maxLen) return [text];
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= maxLen) {
      chunks.push(remaining);
      break;
    }
    // Try to split at last newline before maxLen
    let splitAt = remaining.lastIndexOf("\n", maxLen);
    if (splitAt < maxLen / 2) splitAt = maxLen; // no good newline, hard split
    chunks.push(remaining.slice(0, splitAt));
    remaining = remaining.slice(splitAt).replace(/^\n/, "");
  }
  return chunks;
}

export { telegram };
