#!/usr/bin/env tsx
/**
 * Local Telegram bot — polls for updates and forwards to spike-edge.
 *
 * Run: npx tsx src/edge-api/main/core-logic/telegram-bot-local.ts
 *
 * Requires:
 *   TELEGRAM_BOT_TOKEN in ~/.secrets
 *   spike-edge running locally (npm run dev in src/spike-edge)
 *   cloudflared tunnel (npm run tunnel:start) for webhook fallback
 *
 * Architecture:
 *   Telegram Bot API ──getUpdates──▶ this script ──POST──▶ localhost:8787/telegram/webhook
 *                                                          (spike-edge local dev)
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const EDGE_URL = process.env.SPIKE_EDGE_URL ?? "http://localhost:8787";
const POLL_TIMEOUT = 30; // long-polling timeout in seconds

if (!BOT_TOKEN) {
  console.error("TELEGRAM_BOT_TOKEN not set. Add it to ~/.secrets");
  process.exit(1);
}

const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;

let offset = 0;
let running = true;

async function getUpdates(): Promise<unknown[]> {
  const url = `${API_BASE}/getUpdates?offset=${offset}&timeout=${POLL_TIMEOUT}&allowed_updates=["message","callback_query"]`;

  try {
    const res = await fetch(url);
    const data = (await res.json()) as { ok: boolean; result: Array<{ update_id: number }> };

    if (!data.ok || !Array.isArray(data.result)) {
      console.error("getUpdates failed:", data);
      return [];
    }

    return data.result;
  } catch (err) {
    console.error("getUpdates error:", err);
    // Wait a bit before retrying on network errors
    await new Promise((r) => setTimeout(r, 5000));
    return [];
  }
}

async function forwardToWebhook(update: unknown): Promise<void> {
  try {
    const res = await fetch(`${EDGE_URL}/telegram/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Skip secret verification in local mode
      },
      body: JSON.stringify(update),
    });

    if (!res.ok) {
      console.error(`Webhook returned ${res.status}:`, await res.text());
    } else {
      const result = (await res.json()) as { ok: boolean; action?: string };
      console.log(`  → ${result.action ?? "ok"}`);
    }
  } catch (err) {
    console.error("Failed to forward to webhook:", err);
  }
}

async function pollLoop(): Promise<void> {
  console.log(`Telegram bot polling started (forwarding to ${EDGE_URL})`);
  console.log("Press Ctrl+C to stop\n");

  while (running) {
    const updates = await getUpdates();

    for (const update of updates) {
      const typedUpdate = update as {
        update_id: number;
        message?: { text?: string; from?: { first_name?: string } };
      };
      const msg = typedUpdate.message;
      if (msg) {
        console.log(
          `[${new Date().toISOString()}] ${msg.from?.first_name ?? "?"}: ${msg.text ?? "(non-text)"}`,
        );
      }

      await forwardToWebhook(update);

      // Advance offset past this update
      offset = typedUpdate.update_id + 1;
    }
  }
}

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\nShutting down...");
  running = false;
});

process.on("SIGTERM", () => {
  running = false;
});

// Delete any existing webhook before starting polling
// (Telegram doesn't allow both webhook and getUpdates simultaneously)
async function deleteWebhook(): Promise<void> {
  const res = await fetch(`${API_BASE}/deleteWebhook`);
  const data = (await res.json()) as { ok: boolean; description?: string };
  if (data.ok) {
    console.log("Cleared existing webhook (switching to polling mode)");
  }
}

async function main(): Promise<void> {
  // Check bot identity
  const meRes = await fetch(`${API_BASE}/getMe`);
  const me = (await meRes.json()) as {
    ok: boolean;
    result?: { username: string; first_name: string };
  };

  if (!me.ok || !me.result) {
    console.error("Failed to verify bot token. Check TELEGRAM_BOT_TOKEN.");
    process.exit(1);
  }

  console.log(`Bot: @${me.result.username} (${me.result.first_name})`);

  await deleteWebhook();
  await pollLoop();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
