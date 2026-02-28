# Stripe Integration Best Practices

Comprehensive guide to integrating Stripe payments securely and reliably. This
document covers checkout integration, subscription management, webhook handling,
security, testing, and error handling.

## Table of Contents

1. [Checkout Integration](#checkout-integration)
2. [Subscription Management](#subscription-management)
3. [Webhook Handling](#webhook-handling)
4. [Security Best Practices](#security-best-practices)
5. [Testing Strategies](#testing-strategies)
6. [Error Handling & Recovery](#error-handling--recovery)
7. [Implementation Examples](#implementation-examples)
8. [Production Checklist](#production-checklist)

---

## Checkout Integration

### Integration Options Overview

Stripe offers five main integration approaches, ordered by ease of
implementation:

| Integration                  | Customization | Complexity  | Use Case                            |
| ---------------------------- | ------------- | ----------- | ----------------------------------- |
| **Payment Links**            | Minimal       | No-code     | Quick payments, invoice links       |
| **Stripe Checkout (Hosted)** | Low           | Low-code    | Most common, recommended option     |
| **Embedded Checkout**        | Medium        | Low-code    | Seamless checkout without redirect  |
| **Payment Elements**         | High          | Medium-code | Custom checkout UI with flexibility |
| **PaymentIntent API**        | Highest       | Advanced    | Complete control, lowest-level API  |

### Stripe Checkout (Recommended)

Stripe Checkout is the recommended solution for most integrations due to its
balance of features, security, and ease of implementation.

#### Key Advantages

- **PCI Compliance**: Qualifies for the simplest PCI validation (SAQ A)
- **Mobile Optimized**: Designed for small screens and touch input
- **40+ Payment Methods**: Dynamically displayed based on customer location
- **Fraud Protection**: Built-in fraud detection and 3D Secure support
- **Link Integration**: Customers can save payment methods for faster checkout
- **International Support**: Handles multiple currencies and payment methods

#### Session Management

```typescript
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

async function createCheckoutSession(
  customerId: string,
  items: Array<{ priceId: string; quantity: number; }>,
) {
  try {
    const session = await stripe.checkout.sessions.create({
      // Customer identification
      customer: customerId,

      // Checkout mode
      mode: "payment", // 'payment' | 'subscription' | 'setup'

      // Line items
      line_items: items,

      // Success and cancel handling
      success_url: `${process.env.APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL}/checkout/cancel`,

      // Metadata for tracking
      metadata: {
        orderId: "order_123",
        userId: customerId,
      },

      // Optional: Express checkout for faster conversion
      payment_method_types: ["card"],

      // Optional: Custom branding
      billing_address_collection: "required",

      // Optional: Allow email entry for guest checkout
      customer_email: undefined, // Only if not using existing customer
    });

    return session.url;
  } catch (error) {
    console.error("Checkout session creation failed:", error);
    throw error;
  }
}
```

#### Session Completion Handling

```typescript
async function retrieveCheckoutSession(sessionId: string) {
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["payment_intent", "line_items"],
  });

  // Verify payment was successful
  if (session.payment_status === "paid") {
    // Update your database
    await updateUserOrderStatus(session.customer, "completed");

    // Send confirmation email
    await sendConfirmationEmail(session.customer_email);

    return { success: true, session };
  }

  return { success: false, session };
}
```

### Dynamic Payment Methods

Best Practice: Let Stripe dynamically determine which payment methods to display
based on transaction context.

```typescript
async function createCheckoutSession(customerId: string) {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "payment",
    line_items: [
      {
        price: "price_1234",
        quantity: 1,
      },
    ],
    // Allow Stripe to dynamically select payment methods
    // Remove explicit payment_method_types to enable dynamic selection
    success_url: `${process.env.APP_URL}/success`,
    cancel_url: `${process.env.APP_URL}/cancel`,
  });

  return session;
}
```

**Benefits:**

- Stripe optimizes based on 100+ signals (location, device, amount, etc.)
- Payment Element showed 11.9% more revenue on average
- Reduces friction by showing relevant methods first

### Handling Redirects

```typescript
// /api/checkout
export async function POST(req: Request) {
  const { priceId, customerId } = await req.json();

  try {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.APP_URL}/account/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL}/account/billing`,
    });

    return Response.json({ url: session.url });
  } catch (error) {
    return Response.json(
      { error: "Failed to create checkout session" },
      { status: 500 },
    );
  }
}

// Frontend redirect handling
async function redirectToCheckout(priceId: string) {
  const response = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ priceId, customerId: user.id }),
  });

  const { url, error } = await response.json();

  if (error) {
    toast.error(error);
    return;
  }

  // Redirect to Stripe's hosted checkout
  window.location.href = url;
}
```

---

## Subscription Management

### Creating Subscriptions

```typescript
async function createSubscription(
  customerId: string,
  priceId: string,
  metadata?: Record<string, string>,
) {
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    metadata,

    // Recommended: Save default payment method
    default_payment_method: await getCustomerDefaultPaymentMethod(customerId),

    // Automatic retry on failure
    payment_settings: {
      save_default_payment_method: "on_subscription",
      default_mandate_payment_method: undefined,
    },

    // Trial period (optional)
    trial_period_days: 14,

    // What to do at end of trial
    trial_settings: {
      end_behavior: {
        missing_payment_method: "create_invoice", // Or 'cancel'
      },
    },
  });

  return subscription;
}
```

### Customer Portal Integration

The customer portal allows self-service management of subscriptions, payment
methods, and invoices.

```typescript
async function createPortalSession(customerId: string) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.APP_URL}/account/billing`,

    // Optional: Custom configuration
    configuration: "bpc_xxxxx", // Pre-configured in Dashboard
  });

  return session.url;
}

// Redirect user to portal
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get("customer_id");

  if (!customerId) {
    return Response.json({ error: "Missing customer_id" }, { status: 400 });
  }

  try {
    const url = await createPortalSession(customerId);
    return Response.json({ url });
  } catch (error) {
    return Response.json(
      { error: "Failed to create portal session" },
      { status: 500 },
    );
  }
}
```

### Handling Subscription Changes

#### Upgrade/Downgrade

```typescript
async function upgradeSubscription(
  subscriptionId: string,
  newPriceId: string,
) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const item = subscription.items.data[0];

  // Upgrade with proration
  const updated = await stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: item.id,
        price: newPriceId,
        // Control proration behavior
        proration_behavior: "create_invoice", // 'always_invoice' | 'create_invoice' | 'none'
      },
    ],
    // Immediately charge prorated amount
    billing_cycle_anchor: "now",
  });

  return updated;
}
```

#### Cancellation

```typescript
async function cancelSubscription(
  subscriptionId: string,
  immediately: boolean = false,
) {
  if (immediately) {
    // Cancel immediately
    const cancelled = await stripe.subscriptions.del(subscriptionId);
    return cancelled;
  } else {
    // Cancel at period end
    const cancelled = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
    return cancelled;
  }
}
```

### Portal Features & Limitations

**Supported Actions:**

- Update payment method
- View invoices
- Download invoices
- Update billing address
- Cancel subscriptions (with limitations)
- Switch plans (up to 10 products)

**Limitations:**

- Maximum 10 products for plan switching
- Cannot be embedded in iframes
- Certain subscription features restrict downgrade/upgrade
- Limited customization compared to custom implementation

---

## Webhook Handling

### Webhook Architecture Overview

Webhooks enable real-time updates to your system when Stripe events occur.
Proper implementation is critical for data consistency.

```
Stripe Event → Your Webhook Endpoint → Process Event → Update Database
```

### Setting Up Webhooks

```typescript
// /api/webhooks/stripe
import { headers } from "next/headers";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      endpointSecret,
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    // Process event
    await handleWebhookEvent(event);
    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (err) {
    console.error("Webhook processing failed:", err);
    // Return 200 anyway to prevent Stripe retries for processing errors
    // Log for manual investigation
    return new Response(JSON.stringify({ received: true }), { status: 200 });
  }
}
```

### Idempotent Event Processing

The most critical aspect of webhook handling is idempotency: handling duplicate
events safely.

```typescript
// Database schema for tracking webhook events
interface WebhookEvent {
  id: string; // stripeEventId
  status: "processing" | "processed" | "failed";
  eventType: string;
  eventData: Record<string, any>;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

async function handleWebhookEvent(event: Stripe.Event) {
  // Step 1: Check if already processed
  const existing = await db.webhookEvent.findUnique({
    where: { id: event.id },
  });

  if (existing?.status === "processed") {
    console.log(`Event ${event.id} already processed, skipping`);
    return;
  }

  // Step 2: Mark as processing
  let webhookRecord = await db.webhookEvent.upsert({
    where: { id: event.id },
    update: { status: "processing" },
    create: {
      id: event.id,
      eventType: event.type,
      eventData: event.data,
      status: "processing",
    },
  });

  try {
    // Step 3: Process event
    await processEvent(event);

    // Step 4: Mark as processed
    webhookRecord = await db.webhookEvent.update({
      where: { id: event.id },
      data: { status: "processed" },
    });

    console.log(`Event ${event.id} processed successfully`);
  } catch (error) {
    // Step 5: Mark as failed (don't throw, return 200 to Stripe)
    await db.webhookEvent.update({
      where: { id: event.id },
      data: {
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });

    console.error(`Event ${event.id} processing failed:`, error);
    // Don't throw - Stripe will retry exponentially
  }
}

async function processEvent(event: Stripe.Event) {
  switch (event.type) {
    case "payment_intent.succeeded":
      await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
      break;

    case "charge.refunded":
      await handleRefund(event.data.object as Stripe.Charge);
      break;

    case "customer.subscription.created":
      await handleSubscriptionCreated(
        event.data.object as Stripe.Subscription,
      );
      break;

    case "customer.subscription.updated":
      await handleSubscriptionUpdated(
        event.data.object as Stripe.Subscription,
      );
      break;

    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(
        event.data.object as Stripe.Subscription,
      );
      break;

    case "invoice.payment_succeeded":
      await handleInvoicePaid(event.data.object as Stripe.Invoice);
      break;

    case "invoice.payment_failed":
      await handleInvoiceFailed(event.data.object as Stripe.Invoice);
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
}
```

### Using Idempotency Keys for API Requests

When creating or updating Stripe objects, use idempotency keys to ensure safe
retries:

```typescript
import { v4 as uuidv4 } from "uuid";

async function createPaymentWithIdempotency(
  customerId: string,
  amount: number,
  currency: string,
) {
  // Generate unique idempotency key
  const idempotencyKey = `${customerId}-${Date.now()}-${uuidv4()}`;

  try {
    const paymentIntent = await stripe.paymentIntents.create(
      {
        customer: customerId,
        amount,
        currency,
        metadata: { idempotencyKey },
      },
      // Include idempotency key in request options
      { idempotencyKey },
    );

    // Store mapping for future retries
    await db.idempotencyKey.create({
      data: {
        key: idempotencyKey,
        stripeObjectId: paymentIntent.id,
        type: "payment_intent",
      },
    });

    return paymentIntent;
  } catch (error) {
    // If request fails, client can retry with same key
    console.error("Payment creation failed:", error);
    throw error;
  }
}
```

### Webhook Monitoring

Track webhook processing to identify issues:

```typescript
async function getWebhookStats(hours: number = 24) {
  const since = new Date(Date.now() - hours * 3600000);

  const stats = await db.webhookEvent.groupBy({
    by: ["eventType", "status"],
    where: {
      createdAt: { gte: since },
    },
    _count: true,
  });

  const failed = await db.webhookEvent.findMany({
    where: {
      status: "failed",
      createdAt: { gte: since },
    },
    select: { id: true, eventType: true, error: true, createdAt: true },
  });

  return { stats, failed };
}
```

### Asynchronous Processing

For heavy operations, process events asynchronously:

```typescript
import { Queue } from "bull"; // or use other queue system

const webhookQueue = new Queue("stripe-webhooks");

async function handleWebhookEvent(event: Stripe.Event) {
  // Check idempotency
  const existing = await db.webhookEvent.findUnique({
    where: { id: event.id },
  });

  if (existing?.status === "processed") {
    return;
  }

  // Queue the event for async processing
  await webhookQueue.add(
    { event },
    {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
    },
  );

  // Mark as queued
  await db.webhookEvent.upsert({
    where: { id: event.id },
    update: { status: "processing" },
    create: {
      id: event.id,
      eventType: event.type,
      eventData: event.data,
      status: "processing",
    },
  });

  // Return 200 immediately to Stripe
  return;
}

// Process queued events
webhookQueue.process(async job => {
  const { event } = job.data;
  await processEvent(event);
});
```

---

## Security Best Practices

### PCI Compliance

Stripe is PCI Level 1 certified, but compliance is **shared responsibility**.

#### Your Responsibilities

1. **Never handle raw card data**
   - Use Stripe Checkout or Elements
   - Never log, transmit, or store PAN or CVV
   - Never implement custom card input fields

2. **Maintain TLS 1.2+**
   ```typescript
   // Verify in headers
   const secureContext = require("https");
   const options = {
     minVersion: "TLSv1.2",
   };
   ```

3. **Annual PCI Attestation**
   - Complete SAQ questionnaire annually
   - Document your integration method
   - File attestation with your acquiring bank

4. **Network Security**
   - Firewall rules limiting data access
   - Regular vulnerability scans
   - Annual penetration testing
   - Intrusion detection systems

#### Integration Decisions

| Integration          | PCI Burden      | Recommendation            |
| -------------------- | --------------- | ------------------------- |
| **Stripe Checkout**  | Minimal (SAQ A) | ✅ Best for most          |
| **Payment Elements** | Low (SAQ A-EP)  | ✅ Custom UI option       |
| **Hosted Iframe**    | Low             | ✅ Good balance           |
| **Direct API**       | High (SAQ D)    | ❌ Avoid unless necessary |

### Secret Key Management

```typescript
// ✅ CORRECT: Use environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// ❌ INCORRECT: Never hardcode
const stripe = new Stripe("sk_live_xxxxx");

// Use separate keys for test and live
const secretKey = process.env.NODE_ENV === "production"
  ? process.env.STRIPE_LIVE_SECRET_KEY!
  : process.env.STRIPE_TEST_SECRET_KEY!;

const stripe = new Stripe(secretKey);
```

**Environment Variable Setup:**

```bash
# .env.local (never commit)
STRIPE_TEST_SECRET_KEY=sk_test_xxxxx
STRIPE_TEST_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_LIVE_SECRET_KEY=sk_live_xxxxx
STRIPE_LIVE_PUBLISHABLE_KEY=pk_live_xxxxx
```

### Client-Side Security

```typescript
// ✅ CORRECT: Initialize Stripe safely
import { loadStripe } from '@stripe/js';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

// ✅ Load Stripe.js only once
const stripe = await stripePromise;

// ❌ INCORRECT: Loading multiple times
const stripe1 = await loadStripe(...);
const stripe2 = await loadStripe(...); // Wasteful
```

### Webhook Signature Verification

```typescript
// ✅ CORRECT: Always verify signatures
const signature = headers().get("stripe-signature")!;
const event = stripe.webhooks.constructEvent(
  body,
  signature,
  endpointSecret,
);

// ❌ INCORRECT: Skipping verification
const event = JSON.parse(body); // Unsafe!
```

### Content Security Policy

```typescript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  headers: [
    {
      source: "/",
      headers: [
        {
          key: "Content-Security-Policy",
          value: [
            "script-src 'self' https://js.stripe.com",
            "frame-src 'self' https://*.stripe.com",
            "connect-src 'self' https://api.stripe.com https://*.stripe.com",
          ].join("; "),
        },
      ],
    },
  ],
};

module.exports = nextConfig;
```

---

## Testing Strategies

### Test Environment Setup

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe account
stripe login

# Listen for webhooks locally
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### Test Card Numbers

| Scenario               | Card Number         | Expiry     | CVC         |
| ---------------------- | ------------------- | ---------- | ----------- |
| **Successful payment** | 4242 4242 4242 4242 | Any future | Any 3-digit |
| **Card declined**      | 4000 0000 0000 0002 | Any future | Any 3-digit |
| **Insufficient funds** | 4000 0000 0000 9995 | Any future | Any 3-digit |
| **Lost card**          | 4000 0000 0000 9987 | Any future | Any 3-digit |
| **3D Secure required** | 4000 0025 0000 3155 | Any future | Any 3-digit |
| **Visa**               | 4242 4242 4242 4242 | Any future | Any 3-digit |
| **Mastercard**         | 5555 5555 5555 4444 | Any future | Any 3-digit |
| **Amex**               | 3782 822463 10005   | Any future | Any 4-digit |

### Webhook Testing with CLI

```bash
# Start listening
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# In another terminal, trigger events
stripe trigger charge.succeeded
stripe trigger customer.subscription.created
stripe trigger invoice.payment_succeeded

# Test with specific customer
stripe trigger payment_intent.succeeded --add cus_xxxxx
```

### Unit Tests

```typescript
import { createCheckoutSession } from "@/lib/stripe";
import Stripe from "stripe";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("Stripe Integration", () => {
  const mockStripe = {
    checkout: {
      sessions: {
        create: vi.fn(),
      },
    },
  } as unknown as Stripe;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates checkout session with correct parameters", async () => {
    const mockSession = {
      id: "cs_test_123",
      url: "https://checkout.stripe.com/session/test_123",
    };

    (mockStripe.checkout.sessions.create as any).mockResolvedValue(
      mockSession,
    );

    const result = await createCheckoutSession("cus_123", [
      { priceId: "price_123", quantity: 1 },
    ]);

    expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: "cus_123",
        mode: "payment",
      }),
    );

    expect(result.url).toBe(mockSession.url);
  });

  it("handles session creation errors", async () => {
    const error = new Error("API Error");
    (mockStripe.checkout.sessions.create as any).mockRejectedValue(error);

    await expect(
      createCheckoutSession("cus_123", []),
    ).rejects.toThrow("API Error");
  });
});
```

### Integration Tests

```typescript
describe("Webhook Processing", () => {
  it("processes payment_intent.succeeded event idempotently", async () => {
    const event: Stripe.Event = {
      id: "evt_test_123",
      type: "payment_intent.succeeded",
      data: {
        object: {
          id: "pi_test_123",
          status: "succeeded",
        },
      },
    } as any;

    // First call
    await handleWebhookEvent(event);
    let record = await db.webhookEvent.findUnique({ where: { id: event.id } });
    expect(record?.status).toBe("processed");

    // Reset mock
    const updateMock = vi.spyOn(db.webhookEvent, "update");

    // Second call - should be idempotent
    await handleWebhookEvent(event);
    expect(updateMock).not.toHaveBeenCalled();
  });
});
```

---

## Error Handling & Recovery

### Card Decline Categories

#### Soft Declines (Temporary Issues)

These can be resolved with smart retries and customer intervention.

```typescript
const SOFT_DECLINE_CODES = [
  "insufficient_funds",
  "lost_card",
  "stolen_card",
  "expired_card",
  "incorrect_cvc",
  "processing_error",
  "rate_limit",
];

function isSoftDecline(declineCode: string): boolean {
  return SOFT_DECLINE_CODES.includes(declineCode);
}
```

#### Hard Declines (Permanent Issues)

These require customer intervention.

```typescript
const HARD_DECLINE_CODES = [
  "card_not_supported",
  "country_not_supported",
  "generic",
  "fraudulent",
];

function isHardDecline(declineCode: string): boolean {
  return HARD_DECLINE_CODES.includes(declineCode);
}
```

### Handling Card Declines

```typescript
async function handlePaymentError(
  paymentIntent: Stripe.PaymentIntent,
) {
  const error = paymentIntent.last_payment_error;

  if (!error) return;

  const { decline_code, message } = error;

  // Log for monitoring
  await logPaymentError({
    customerId: paymentIntent.customer as string,
    declineCode: decline_code,
    message,
    timestamp: new Date(),
  });

  if (isSoftDecline(decline_code!)) {
    // Send customer email with retry link
    await sendPaymentFailureEmail({
      customer: paymentIntent.customer as string,
      reason: getCustomerFriendlyMessage(decline_code!),
      actionUrl: `${process.env.APP_URL}/account/update-payment`,
    });

    // Queue automatic retry
    await scheduleRetry(paymentIntent.id, "soft_decline");
  } else if (isHardDecline(decline_code!)) {
    // Require immediate customer action
    await sendPaymentFailedEmail({
      customer: paymentIntent.customer as string,
      reason: "We were unable to process your payment. Please update your payment method.",
      actionUrl: `${process.env.APP_URL}/account/update-payment`,
    });
  }
}

function getCustomerFriendlyMessage(declineCode: string): string {
  const messages: Record<string, string> = {
    insufficient_funds: "Insufficient funds in your account",
    lost_card: "Card reported as lost",
    stolen_card: "Card reported as stolen",
    expired_card: "Card has expired",
    incorrect_cvc: "Incorrect security code",
    fraudulent: "Card flagged as potentially fraudulent",
  };

  return messages[declineCode] || "Payment declined by your bank";
}
```

### Smart Retry Strategy

Stripe's Smart Retries use AI to determine optimal retry timing.

```typescript
async function configureSmartRetries(
  subscriptionId: string,
) {
  // Note: Smart Retries are configured at the billing settings level
  // This is typically done via the Stripe Dashboard

  // You can check retry settings via API
  const subscription = await stripe.subscriptions.retrieve(
    subscriptionId,
    {
      expand: ["payment_settings"],
    },
  );

  // Custom retry logic if not using Smart Retries
  return {
    retryPolicy: {
      maxAttempts: 8,
      timeWindow: "2 weeks",
      backoffStrategy: "exponential",
    },
  };
}
```

### Custom Retry Schedule

```typescript
async function createInvoiceWithRetries(invoiceId: string) {
  const invoice = await stripe.invoices.retrieve(invoiceId);

  // Finalize the invoice
  const finalizedInvoice = await stripe.invoices.finalize(invoiceId);

  // Schedule payment with retries
  const retrySchedule = [
    { daysAfter: 0, description: "Initial attempt" },
    { daysAfter: 3, description: "First retry" },
    { daysAfter: 7, description: "Second retry" },
  ];

  // Update invoice with retry metadata
  await stripe.invoices.update(invoiceId, {
    metadata: {
      retrySchedule: JSON.stringify(retrySchedule),
      nextRetryAt: new Date(Date.now() + 3 * 24 * 3600000),
    },
  });

  return finalizedInvoice;
}
```

### Decline Prevention Strategies

```typescript
async function enhanceAuthorizationRates(customerId: string) {
  const customer = await stripe.customers.retrieve(customerId);

  // 1. Request CVC and postal code
  // (Already done in Checkout)

  // 2. Enable 3D Secure for high-risk transactions
  const paymentIntent = await stripe.paymentIntents.create({
    customer: customerId,
    amount: 10000,
    currency: "usd",
    // Mandate 3DS for strong authentication
    statement_descriptor_suffix: "Order",
    // Let Stripe handle 3DS intelligently
    // (automatic_payment_methods if supported)
  });

  // 3. Use network tokens for recurring payments
  const paymentMethod = await stripe.paymentMethods.retrieve(
    customer.default_source as string,
  );

  // 4. Check for sufficient funds before charge
  // (Limited by card networks - can't check directly)

  // 5. Time charges strategically
  // Avoid charges at off-peak hours (3am is higher risk)
  const optimalChargeTime = getOptimalChargeTime();

  return {
    customer,
    authorizationEnhancements: [
      "cvc_and_postal_required",
      "3d_secure_enabled",
      "network_tokens",
      "optimal_timing",
    ],
  };
}

function getOptimalChargeTime(): Date {
  const now = new Date();
  const hour = now.getHours();

  // Prefer business hours (9am-5pm)
  if (hour >= 9 && hour < 17) {
    return now;
  }

  // Schedule for next business hour
  const nextCharge = new Date(now);
  if (hour < 9) {
    nextCharge.setHours(9, 0, 0, 0);
  } else {
    nextCharge.setDate(nextCharge.getDate() + 1);
    nextCharge.setHours(9, 0, 0, 0);
  }

  return nextCharge;
}
```

---

## Implementation Examples

### Complete Payment Flow (One-time)

```typescript
// 1. Create customer (if new)
async function getOrCreateCustomer(userId: string, email: string) {
  let customer = await db.stripeCustomer.findUnique({
    where: { userId },
  });

  if (!customer) {
    const stripeCustomer = await stripe.customers.create({
      email,
      metadata: { userId },
    });

    customer = await db.stripeCustomer.create({
      data: {
        userId,
        customerId: stripeCustomer.id,
      },
    });
  }

  return customer;
}

// 2. Create checkout session
async function startPaymentFlow(userId: string, items: CartItem[]) {
  const customer = await getOrCreateCustomer(userId, user.email);

  const session = await stripe.checkout.sessions.create({
    customer: customer.customerId,
    mode: "payment",
    line_items: items.map(item => ({
      price: item.priceId,
      quantity: item.quantity,
    })),
    success_url: `${process.env.APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.APP_URL}/checkout/cancel`,
    metadata: {
      userId,
      orderId: generateOrderId(),
    },
  });

  return session;
}

// 3. Verify completion
async function verifyPaymentCompletion(sessionId: string) {
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["payment_intent"],
  });

  if (session.payment_status !== "paid") {
    return { success: false };
  }

  // Update order status
  const metadata = session.metadata as Record<string, string>;
  await db.order.update({
    where: { id: metadata.orderId },
    data: {
      status: "paid",
      stripePaymentIntentId: (session.payment_intent as Stripe.PaymentIntent).id,
    },
  });

  return { success: true, session };
}
```

### Complete Subscription Flow

```typescript
// 1. Create subscription through checkout
async function startSubscription(userId: string, priceId: string) {
  const customer = await getOrCreateCustomer(userId, user.email);

  const session = await stripe.checkout.sessions.create({
    customer: customer.customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.APP_URL}/account/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.APP_URL}/account/billing`,
    billing_address_collection: "required",
    payment_settings: {
      save_default_payment_method: "on_subscription",
    },
  });

  return session;
}

// 2. Capture subscription from webhook
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  const dbCustomer = await db.stripeCustomer.findUnique({
    where: { customerId },
  });

  if (!dbCustomer) {
    console.error(`Customer not found: ${customerId}`);
    return;
  }

  // Create subscription record
  const plan = getPlanFromPriceId(subscription.items.data[0].price.id);

  await db.subscription.create({
    data: {
      userId: dbCustomer.userId,
      stripeSubscriptionId: subscription.id,
      plan,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
  });

  // Grant access
  await grantPlanAccess(dbCustomer.userId, plan);
}

// 3. Handle changes via portal or webhook
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const dbSubscription = await db.subscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (!dbSubscription) {
    console.error(`Subscription not found: ${subscription.id}`);
    return;
  }

  const newPlan = getPlanFromPriceId(subscription.items.data[0].price.id);
  const oldPlan = dbSubscription.plan;

  // Update subscription
  await db.subscription.update({
    where: { id: dbSubscription.id },
    data: {
      plan: newPlan,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
  });

  // Update access
  if (oldPlan !== newPlan) {
    if (isUpgrade(oldPlan, newPlan)) {
      await grantPlanAccess(dbSubscription.userId, newPlan);
    } else {
      await revokePlanAccess(dbSubscription.userId, oldPlan);
      await grantPlanAccess(dbSubscription.userId, newPlan);
    }
  }
}

// 4. Handle cancellation
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const dbSubscription = await db.subscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (!dbSubscription) {
    return;
  }

  // Update status
  await db.subscription.update({
    where: { id: dbSubscription.id },
    data: { status: "canceled" },
  });

  // Revoke access
  await revokePlanAccess(dbSubscription.userId, dbSubscription.plan);
}
```

---

## Production Checklist

### Before Going Live

- [ ] Switch to live API keys
- [ ] Update environment variables with production keys
- [ ] Enable webhook signing verification
- [ ] Configure webhook endpoints in Stripe Dashboard
- [ ] Set up error handling and alerting
- [ ] Complete PCI compliance assessment
- [ ] Configure email notifications for failures
- [ ] Set up monitoring and logging

### Stripe Dashboard Configuration

- [ ] Enable all required payment methods
- [ ] Configure billing portal
- [ ] Set up Smart Retries policy
- [ ] Configure email notifications
- [ ] Set up custom branding
- [ ] Enable 3D Secure
- [ ] Configure dispute handling
- [ ] Set up API rate limiting

### Monitoring & Alerting

```typescript
// Monitor key metrics
async function reportStripeMetrics() {
  const now = new Date();
  const since = new Date(now.getTime() - 24 * 3600000); // Last 24 hours

  // Failed payments
  const failedPayments = await db.webhookEvent.count({
    where: {
      eventType: "charge.failed",
      createdAt: { gte: since },
    },
  });

  // Failed webhooks
  const failedWebhooks = await db.webhookEvent.count({
    where: {
      status: "failed",
      createdAt: { gte: since },
    },
  });

  // Declined charges
  const declinedCharges = await stripe.charges.list({
    limit: 100,
    created: { gte: Math.floor(since.getTime() / 1000) },
  });

  const metrics = {
    failedPayments,
    failedWebhooks,
    declinedCharges: declinedCharges.data.filter(c => !c.paid).length,
    timestamp: now,
  };

  // Alert if thresholds exceeded
  if (failedWebhooks > 10) {
    await sendAlert("High webhook failure rate detected", metrics);
  }

  return metrics;
}
```

### Testing in Production

- [ ] Process a test transaction with a real card (refund immediately)
- [ ] Verify webhook delivery
- [ ] Test customer portal
- [ ] Test email notifications
- [ ] Test error handling
- [ ] Load test checkout flow

---

## Additional Resources

### Official Stripe Documentation

- [Payment Methods Integration](https://docs.stripe.com/payments/payment-methods/integration-options)
- [How Checkout Works](https://stripe.com/docs/payments/checkout/how-checkout-works)
- [Building Subscriptions](https://docs.stripe.com/billing/subscriptions/build-subscriptions)
- [Customer Portal Integration](https://docs.stripe.com/customer-management/integrate-customer-portal)
- [Webhook Documentation](https://docs.stripe.com/webhooks)
- [Security Guide](https://docs.stripe.com/security/guide)
- [Error Handling](https://docs.stripe.com/error-handling)
- [Idempotent Requests](https://docs.stripe.com/api/idempotent_requests)
- [Card Declines](https://docs.stripe.com/declines/card)
- [Smart Retries](https://docs.stripe.com/billing/revenue-recovery/smart-retries)

### Related Documentation in This Project

- `/docs/best-practices/` - Other best practice guides
- `/docs/testing/` - Testing strategies and guides
- `/docs/archive/` - Historical implementation notes

### Community & Support

- [Stripe Support](https://support.stripe.com)
- [Stripe Discord Community](https://stripe.com/go/discord)
- [Stack Overflow - stripe tag](https://stackoverflow.com/questions/tagged/stripe)

---

## Document Information

- **Last Updated**: December 2025
- **Version**: 1.0.0
- **Audience**: Backend developers, DevOps engineers, product managers
- **Coverage**: Production-ready Stripe integration patterns
