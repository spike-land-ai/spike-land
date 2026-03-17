/**
 * Support Routes — Migration Checkout
 *
 * POST /api/support/migration-checkout — Create Stripe checkout for migration service
 */

import { Hono } from "hono";
import type { Env } from "../../core-logic/env.js";
import { createLogger } from "@spike-land-ai/shared";

const log = createLogger("spike-edge");

const support = new Hono<{ Bindings: Env }>();

// ─── Migration Checkout (Stripe) ────────────────────────────────────────────

const MIGRATION_TIERS = {
  blog: {
    amountCents: 42000,
    currency: "usd",
    label: "Blog Post",
    description: "Detailed migration blog post covering 8 Next.js projects",
  },
  script: {
    amountCents: 100000,
    currency: "gbp",
    label: "CLI Script",
    description: "Open-source CLI migration script (Next.js → TanStack Start)",
  },
  mcp: {
    amountCents: 1000000,
    currency: "usd",
    label: "MCP Server",
    description: "Production MCP server for automated Next.js migration PRs",
  },
} as const;

type MigrationTier = keyof typeof MIGRATION_TIERS;

support.post("/api/support/migration-checkout", async (c) => {
  const stripeKey = c.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return c.json({ error: "Stripe not configured" }, 503);
  }

  let body: { tier?: string; clientId?: string };
  try {
    body = (await c.req.json()) as { tier?: string; clientId?: string };
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }

  const { tier, clientId } = body;

  if (!tier || !Object.hasOwn(MIGRATION_TIERS, tier)) {
    return c.json({ error: "tier must be one of: blog, script, mcp" }, 400);
  }

  const safeClientId = typeof clientId === "string" ? clientId.slice(0, 100) : "";
  const config = MIGRATION_TIERS[tier as MigrationTier];
  const slug = `migration-${tier}`;

  const params = new URLSearchParams({
    mode: "payment",
    submit_type: "pay",
    "line_items[0][price_data][currency]": config.currency,
    "line_items[0][price_data][unit_amount]": config.amountCents.toString(),
    "line_items[0][price_data][product_data][name]": `Next.js Migration Service — ${config.label}`,
    "line_items[0][price_data][product_data][description]": config.description,
    "line_items[0][quantity]": "1",
    success_url: `https://spike.land/migrate?success=${encodeURIComponent(tier)}`,
    cancel_url: "https://spike.land/migrate",
    "metadata[type]": "migration_service",
    "metadata[tier]": tier,
    "metadata[client_id]": safeClientId,
  });

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Stripe-Version": "2024-06-20",
    },
    body: params.toString(),
  });

  const data = (await res.json()) as Record<string, unknown>;

  if (!res.ok) {
    log.error("Stripe migration checkout error", { error: String(data) });
    return c.json({ error: "Failed to create checkout session" }, 502);
  }

  // Record pending migration purchase
  const db = c.env.DB;
  const donationId = crypto.randomUUID();
  const sessionId = data["id"] as string;
  try {
    await db
      .prepare(
        "INSERT INTO support_donations (id, slug, amount_cents, stripe_session_id, status, created_at) VALUES (?, ?, ?, ?, 'pending', ?)",
      )
      .bind(donationId, slug, config.amountCents, sessionId, Date.now())
      .run();
  } catch (err) {
    log.error("migration donation record error", {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return c.json({ url: data["url"] as string });
});

export { support };
