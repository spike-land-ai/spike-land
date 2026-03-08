import { Hono } from "hono";
import type { Env } from "../../core-logic/env";
import type { Variables } from "../middleware";
import { createDb } from "../../db/db-index";
import { webhooks, messages } from "../../db/schema";
import { eq } from "drizzle-orm";
import { generateId } from "../../core-logic/id-gen";

export const webhooksRouter = new Hono<{ Bindings: Env; Variables: Variables }>();

/**
 * POST /webhooks/inbound/:token
 * Accepts a message from an external service (Slack, GitHub, etc.) and posts it
 * into the channel associated with the webhook token.
 */
webhooksRouter.post("/inbound/:token", async (c) => {
  const token = c.req.param("token");
  const db = createDb(c.env.DB);

  // Look up the webhook by token
  const [webhook] = await db.select()
    .from(webhooks)
    .where(eq(webhooks.token, token));

  if (!webhook) {
    return c.json({ error: "Invalid webhook token" }, 404);
  }

  const body = await c.req.json().catch((): null => null) as Record<string, unknown> | null;
  if (!body) {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  // Accept either { text } or { content } as the message body
  const content = String(body.text || body.content || JSON.stringify(body));

  const id = generateId();
  const now = Date.now();

  const msg: {
    id: string;
    channelId: string;
    userId: string;
    content: string;
    contentType: string;
    threadId: string | null;
    createdAt: number;
  } = {
    id,
    channelId: webhook.channelId,
    userId: `webhook-${webhook.id}`,
    content,
    contentType: String(body.contentType || "text"),
    threadId: null,
    createdAt: now,
  };

  await db.insert(messages).values(msg);

  // Broadcast via DO
  const doId = c.env.CHANNEL_DO.idFromName(webhook.channelId);
  const stub = c.env.CHANNEL_DO.get(doId);

  await stub.fetch(new Request("http://internal/broadcast", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "message_new", message: msg }),
  }));

  return c.json({ success: true, messageId: id }, 201);
});

/**
 * POST /webhooks/outbound/fire
 * Internal endpoint: called from message routes to fire outbound webhooks
 * when a message is posted in a channel that has outbound webhooks.
 *
 * This is not exposed publicly — it's called from the messages route.
 */
export async function fireOutboundWebhooks(
  db: ReturnType<typeof createDb>,
  channelId: string,
  message: Record<string, unknown>,
): Promise<void> {
  const outbound = await db.select()
    .from(webhooks)
    .where(eq(webhooks.channelId, channelId));

  const outboundHooks = outbound.filter((w) => w.type === "outbound" && w.url);

  await Promise.allSettled(
    outboundHooks.map(async (hook) => {
      try {
        await fetch(hook.url!, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "message_new",
            channel_id: channelId,
            message,
            webhook_id: hook.id,
          }),
        });
      } catch {
        // Silently ignore failed webhook deliveries for now
      }
    }),
  );
}
