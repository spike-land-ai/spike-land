/**
 * One-time Stripe product + price setup script.
 *
 * Creates:
 *   - "spike.land Pro"   → $19/mo USD (lookup_key: pro_monthly)
 *   - "spike.land Elite" → £90/mo GBP (lookup_key: elite_monthly)
 *
 * Usage: npx tsx scripts/stripe-setup.ts
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const envPath = resolve(import.meta.dirname ?? ".", "../src/spike-edge/.env.local");
const envContent = readFileSync(envPath, "utf-8");
const match = envContent.match(/^STRIPE_SECRET_KEY=(.+)$/m);
if (!match?.[1]) {
  console.error("STRIPE_SECRET_KEY not found in src/spike-edge/.env.local");
  process.exit(1);
}
const STRIPE_KEY = match[1].trim();

async function stripePost(path: string, body: Record<string, string>): Promise<Record<string, unknown>> {
  const res = await fetch(`https://api.stripe.com${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${STRIPE_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(body).toString(),
  });
  const data = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    console.error(`Stripe error on ${path}:`, JSON.stringify(data, null, 2));
    process.exit(1);
  }
  return data;
}

async function main() {
  console.log("Creating Stripe products and prices...\n");

  // --- Pro ---
  const proProduct = await stripePost("/v1/products", {
    name: "spike.land Pro",
    description: "Professional tools, 500 messages/day, BYOK support",
  });
  console.log(`Product created: ${proProduct.name} (${proProduct.id})`);

  const proPrice = await stripePost("/v1/prices", {
    product: proProduct.id as string,
    currency: "usd",
    unit_amount: "1900",
    "recurring[interval]": "month",
    lookup_key: "pro_monthly",
  });
  console.log(`Price created: $19/mo USD → ${proPrice.id}`);

  // --- Elite ---
  const eliteProduct = await stripePost("/v1/products", {
    name: "spike.land Elite",
    description: "Unlimited access, priority support, bug bounty eligibility",
  });
  console.log(`\nProduct created: ${eliteProduct.name} (${eliteProduct.id})`);

  const elitePrice = await stripePost("/v1/prices", {
    product: eliteProduct.id as string,
    currency: "gbp",
    unit_amount: "9000",
    "recurring[interval]": "month",
    lookup_key: "elite_monthly",
  });
  console.log(`Price created: £90/mo GBP → ${elitePrice.id}`);

  console.log("\nDone! Save these price IDs if needed:");
  console.log(`  Pro:   ${proPrice.id}`);
  console.log(`  Elite: ${elitePrice.id}`);
}

main();
