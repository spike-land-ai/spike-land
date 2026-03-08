import { Hono } from "hono";
import type { Env } from "../../core-logic/env";
import type { Variables } from "../middleware";
import { createDb } from "../../db/db-index";
import { messages, channels, channelMembers } from "../../db/schema";
import { eq, desc, gt, and, isNull } from "drizzle-orm";
import { generateId } from "../../core-logic/id-gen";

export const messagesRouter = new Hono<{ Bindings: Env; Variables: Variables }>();

/**
 * GET /messages?channelId=&limit=&since=
 * `since` is a ULID — returns messages created after that ID (cursor-based polling).
 * Filters out soft-deleted messages.
 */
messagesRouter.get("/", async (c) => {
  const db = createDb(c.env.DB);
  const channelId = c.req.query("channelId");
  const limit = parseInt(c.req.query("limit") || "50", 10);
  const since = c.req.query("since");

  if (!channelId) return c.json({ error: "Missing channelId" }, 400);

  const conditions = [eq(messages.channelId, channelId), isNull(messages.deletedAt)];
  if (since) {
    conditions.push(gt(messages.id, since));
  }

  const msgs = await db.select()
    .from(messages)
    .where(and(...conditions))
    .orderBy(since ? messages.createdAt : desc(messages.createdAt))
    .limit(limit);

  // When fetching history (no since), reverse to chronological order
  return c.json(since ? msgs : msgs.reverse());
});

/**
 * POST /messages
 * Supports `contentType: "app_updated"` which dual-broadcasts:
 *  1. A human-readable chat message in the channel
 *  2. A structured `app_updated` event via the DO for live clients
 *
 * Auto-creates `app-*` channels on first message if they don't exist.
 */
messagesRouter.post("/", async (c) => {
  const db = createDb(c.env.DB);
  const body = await c.req.json();
  const userId = c.get("userId");

  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  if (!body.channelId || !body.content) return c.json({ error: "Missing fields" }, 400);

  // Auto-create app-* channels on first message
  if (body.channelId.startsWith("app-")) {
    await ensureAppChannel(db, body.channelId, userId);
  }

  const id = generateId();
  const now = Date.now();

  const msg = {
    id,
    channelId: body.channelId,
    userId,
    content: body.content,
    contentType: body.contentType || "text",
    threadId: body.threadId || null,
    createdAt: now,
  };

  await db.insert(messages).values(msg);

  // Broadcast via DO
  const doId = c.env.CHANNEL_DO.idFromName(body.channelId);
  const stub = c.env.CHANNEL_DO.get(doId);

  await stub.fetch(new Request("http://internal/broadcast", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "message_new", message: msg }),
  }));

  // For app_updated, send a second structured event for live clients to act on
  if (body.contentType === "app_updated") {
    await stub.fetch(new Request("http://internal/broadcast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "app_updated",
        appSlug: body.channelId.replace(/^app-/, ""),
        version: body.metadata?.version,
        changedFiles: body.metadata?.changedFiles,
        messageId: id,
      }),
    }));
  }

  return c.json(msg, 201);
});

messagesRouter.delete("/:id", async (c) => {
  const db = createDb(c.env.DB);
  const id = c.req.param("id");
  const userId = c.get("userId");
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  // Retrieve message first to verify it exists and get channelId
  const [msg] = await db.select().from(messages).where(eq(messages.id, id));
  if (!msg) return c.json({ error: "Not found" }, 404);

  await db.update(messages)
    .set({ deletedAt: Date.now() })
    .where(eq(messages.id, id));

  const doId = c.env.CHANNEL_DO.idFromName(msg.channelId);
  const stub = c.env.CHANNEL_DO.get(doId);
  await stub.fetch(new Request("http://internal/broadcast", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "message_deleted", id }),
  }));

  return c.json({ success: true });
});

/**
 * Auto-create a channel for an app if it doesn't exist.
 * Uses workspace "default" and slug from the channelId.
 */
async function ensureAppChannel(
  db: ReturnType<typeof createDb>,
  channelId: string,
  userId: string,
): Promise<void> {
  const [existing] = await db.select({ id: channels.id })
    .from(channels)
    .where(eq(channels.slug, channelId))
    .limit(1);

  if (existing) return;

  const slug = channelId;
  const name = channelId.replace(/^app-/, "").replace(/-/g, " ");

  try {
    await db.insert(channels).values({
      id: generateId(),
      workspaceId: "default",
      name,
      slug,
      type: "public",
      createdBy: userId,
      createdAt: Date.now(),
    });
  } catch {
    // Ignore duplicate — another request may have created it concurrently
  }

  // Auto-join the creator
  try {
    const [ch] = await db.select({ id: channels.id })
      .from(channels)
      .where(eq(channels.slug, channelId))
      .limit(1);
    if (ch) {
      await db.insert(channelMembers).values({
        channelId: ch.id,
        userId,
        role: "owner",
        joinedAt: Date.now(),
      });
    }
  } catch {
    // Ignore duplicate membership
  }
}
