/**
 * Billing Endpoints
 *
 * GET /api/billing/status — query subscription status for authenticated user.
 * POST /api/billing/portal — create Creem customer billing portal link.
 * POST /api/billing/cancel — alias for /portal (backwards compat).
 * Requires auth.
 */

import { Hono, type Context } from "hono";
import type { Env, Variables } from "../../core-logic/env.js";
import { createLogger } from "@spike-land-ai/shared";
import { createBillingPortal } from "../../core-logic/creem-client.js";

const log = createLogger("spike-edge");

const billing = new Hono<{ Bindings: Env; Variables: Variables }>();

interface SubscriptionRow {
  plan: string;
  status: string;
  current_period_end: number | null;
  usage_count: number | null;
  creem_customer_id: string | null;
  stripe_customer_id: string | null;
}

billing.get("/api/billing/status", async (c) => {
  const userId = c.get("userId") as string | undefined;
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const row = await c.env.DB.prepare(
    `SELECT plan, status, current_period_end, usage_count, creem_customer_id, stripe_customer_id
     FROM subscriptions WHERE user_id = ? LIMIT 1`,
  )
    .bind(userId)
    .first<SubscriptionRow>();

  if (!row) {
    return c.json({
      plan: "free",
      status: "active",
      currentPeriodEnd: null,
      usage: 0,
    });
  }

  return c.json({
    plan: row.plan,
    status: row.status,
    currentPeriodEnd: row.current_period_end,
    usage: row.usage_count ?? 0,
  });
});

async function handleBillingPortal(c: Context<{ Bindings: Env; Variables: Variables }>) {
  const apiKey = c.env.CREEM_API_KEY;
  if (!apiKey) {
    return c.json({ error: "Payment provider not configured" }, 503);
  }

  const userId = c.get("userId") as string | undefined;
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const row = await c.env.DB.prepare(
    `SELECT creem_customer_id, stripe_customer_id FROM subscriptions WHERE user_id = ? LIMIT 1`,
  )
    .bind(userId)
    .first<{ creem_customer_id: string | null; stripe_customer_id: string | null }>();

  // Try Creem first, fall back to Stripe for legacy customers
  const creemCustomerId = row?.creem_customer_id;
  if (creemCustomerId) {
    const res = await createBillingPortal(apiKey, creemCustomerId);
    if (!res.ok) {
      log.error("Failed to create Creem billing portal", { data: JSON.stringify(res.data) });
      return c.json({ error: "Failed to create billing portal session" }, 502);
    }
    const url = res.data.customer_portal_link;
    if (!url) {
      return c.json({ error: "No portal URL returned" }, 502);
    }
    return c.json({ url });
  }

  // Legacy Stripe fallback
  const stripeCustomerId = row?.stripe_customer_id;
  if (stripeCustomerId && c.env.STRIPE_SECRET_KEY) {
    const res = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${c.env.STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "Stripe-Version": "2024-06-20",
      },
      body: new URLSearchParams({
        customer: stripeCustomerId,
        return_url: "https://spike.land/settings?tab=billing",
      }).toString(),
    });

    const data = (await res.json()) as Record<string, unknown>;
    if (!res.ok) {
      log.error("Failed to create Stripe billing portal session", { data: String(data) });
      return c.json({ error: "Failed to create billing portal session" }, 502);
    }

    const url = data["url"] as string | undefined;
    if (!url) {
      return c.json({ error: "No portal URL returned" }, 502);
    }
    return c.json({ url });
  }

  return c.json({ error: "No active subscription found" }, 404);
}

billing.post("/api/billing/portal", handleBillingPortal);
billing.post("/api/billing/cancel", handleBillingPortal);

export { billing };
