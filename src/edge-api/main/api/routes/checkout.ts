/**
 * Checkout Endpoint — Creem.io
 *
 * POST /api/checkout — creates a Creem checkout session for subscription.
 * Requires auth.
 */

import { Hono } from "hono";
import type { Env, Variables } from "../../core-logic/env.js";
import { createLogger } from "@spike-land-ai/shared";
import { createCheckout } from "../../core-logic/creem-client.js";

const log = createLogger("spike-edge");

const checkout = new Hono<{ Bindings: Env; Variables: Variables }>();

checkout.post("/api/checkout", async (c) => {
  const apiKey = c.env.CREEM_API_KEY;
  if (!apiKey) {
    return c.json({ error: "Payment provider not configured" }, 503);
  }

  const userId = c.get("userId") as string | undefined;
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  let body: { tier?: string };
  try {
    body = (await c.req.json()) as { tier?: string };
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const tier = body.tier;
  if (tier !== "pro" && tier !== "business") {
    return c.json({ error: "Invalid tier. Must be 'pro' or 'business'." }, 400);
  }

  const productId = tier === "pro" ? c.env.CREEM_PRO_PRODUCT_ID : c.env.CREEM_BUSINESS_PRODUCT_ID;

  if (!productId) {
    return c.json({ error: `Product not configured for tier '${tier}'` }, 503);
  }

  const userEmail = c.get("userEmail") as string | undefined;

  const res = await createCheckout(apiKey, {
    product_id: productId,
    success_url: "https://spike.land/settings?tab=billing&success=1",
    request_id: `${userId}-${tier}-${Date.now()}`,
    ...(userEmail && { customer: { email: userEmail } }),
    metadata: {
      userId,
      tier,
    },
  });

  if (!res.ok) {
    log.error("Failed to create Creem checkout", { data: JSON.stringify(res.data) });
    return c.json({ error: "Failed to create checkout session" }, 502);
  }

  const checkoutUrl = res.data.checkout_url;
  if (!checkoutUrl) {
    return c.json({ error: "No checkout URL returned" }, 502);
  }

  return c.json({ url: checkoutUrl });
});

export { checkout };
