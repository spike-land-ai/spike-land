/**
 * Email Endpoints
 *
 * POST /api/email/send — send an email via Resend.
 * Any authenticated user can send. Rate limited: 5/hour per user.
 * The sender's own email is used as reply-to by default.
 * Every send is logged to D1 for audit.
 */

import { Hono } from "hono";
import type { Env, Variables } from "../../core-logic/env.js";
import { sendEmail } from "../../core-logic/resend-client.js";
import { deductCredit, getBalance } from "../../core-logic/credit-service.js";
import { createLogger } from "@spike-land-ai/shared";

const log = createLogger("spike-edge");

const email = new Hono<{ Bindings: Env; Variables: Variables }>();

interface SendEmailBody {
  to: string;
  subject: string;
  body: string;
  html?: string;
  replyTo?: string;
}

email.post("/api/email/send", async (c) => {
  const resendKey = c.env.RESEND_API_KEY;
  if (!resendKey) {
    return c.json({ error: "Email service not configured" }, 503);
  }

  const userId = c.get("userId") as string | undefined;
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Get user info for sender identity
  const userRow = await c.env.DB.prepare("SELECT email, name FROM users WHERE id = ? LIMIT 1")
    .bind(userId)
    .first<{ email: string; name: string | null }>();

  if (!userRow?.email) {
    return c.json({ error: "User account not found" }, 404);
  }

  // Rate limit: 5 emails per hour per user
  const hourAgo = new Date(Date.now() - 3600_000).toISOString();
  const countRow = await c.env.DB.prepare(
    "SELECT COUNT(*) as cnt FROM email_sends WHERE user_id = ? AND created_at > ?",
  )
    .bind(userId, hourAgo)
    .first<{ cnt: number }>();

  if (countRow && countRow.cnt >= 5) {
    return c.json({ error: "Rate limit exceeded — max 5 emails per hour" }, 429);
  }

  // Check credits (1 credit per email)
  const { balance } = await getBalance(c.env.DB, userId);
  if (balance < 1) {
    return c.json({ error: "insufficient_credits", balance, required: 1 }, 402);
  }

  const req = await c.req.json<SendEmailBody>();

  if (!req.to || !req.subject || !req.body) {
    return c.json({ error: "Missing required fields: to, subject, body" }, 400);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.to)) {
    return c.json({ error: "Invalid email address" }, 400);
  }

  // From is always spike.land — reply-to is the user's own email
  const displayName = userRow.name ?? userRow.email.split("@")[0] ?? "spike.land user";
  const fromAddress = `${displayName} via spike.land <outreach@spike.land>`;
  const replyTo = req.replyTo ?? userRow.email;

  const result = await sendEmail(resendKey, {
    from: fromAddress,
    to: req.to,
    subject: req.subject,
    text: req.body,
    html: req.html,
    reply_to: replyTo,
  });

  // Audit log
  const logStatus = result.ok ? "sent" : "failed";
  try {
    await c.env.DB.prepare(
      "INSERT INTO email_sends (user_id, to_address, from_address, subject, resend_id, status) VALUES (?, ?, ?, ?, ?, ?)",
    )
      .bind(userId, req.to, fromAddress, req.subject, result.id ?? null, logStatus)
      .run();
  } catch (dbErr) {
    log.error("Failed to log email send", { error: String(dbErr) });
  }

  if (!result.ok) {
    log.error("Email send failed", { to: req.to, error: result.error });
    return c.json({ error: result.error }, 502);
  }

  // Deduct 1 credit for successful send
  try {
    await deductCredit(c.env.DB, userId, 1, "Email send", result.id ?? undefined);
  } catch {
    log.error("Failed to deduct email credit", { userId });
  }

  log.info("Email sent", { to: req.to, userId, resendId: result.id });
  return c.json({ ok: true, id: result.id });
});

export { email };
