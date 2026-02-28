import { WorkspaceCreditManager } from "@/lib/credits/workspace-credit-manager";
import prisma from "@/lib/prisma";
import { getStripe } from "@/lib/stripe/client";
import { WorkspaceSubscriptionService } from "@/lib/subscription/workspace-subscription";
import { attributeConversion } from "@/lib/tracking/attribution";
import { tryCatch, tryCatchSync } from "@/lib/try-catch";
import { logger } from "@/lib/errors/structured-logger";
import type { Prisma, SubscriptionTier } from "@prisma/client";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

// Maximum request body size for webhook (64KB should be plenty for Stripe events)
const MAX_BODY_SIZE = 64 * 1024;

export async function POST(request: NextRequest) {
  const stripe = getStripe();

  // Check content length to prevent oversized payloads
  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_SIZE) {
    return NextResponse.json({ error: "Request too large" }, { status: 413 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, {
      status: 400,
    });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    logger.error("STRIPE_WEBHOOK_SECRET is not configured", undefined, {
      route: "/api/stripe/webhook",
    });
    return NextResponse.json({ error: "Webhook secret not configured" }, {
      status: 500,
    });
  }

  // Use tryCatchSync for synchronous Stripe webhook verification
  const { data: event, error: constructError } = tryCatchSync(
    () => stripe.webhooks.constructEvent(body, signature, webhookSecret),
  );

  if (constructError) {
    logger.error(
      "Webhook signature verification failed",
      constructError instanceof Error ? constructError : undefined,
      { route: "/api/stripe/webhook" },
    );
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 },
    );
  }

  const { error: processingError } = await tryCatch(
    (async () => {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          await handleCheckoutCompleted(stripe, session);
          break;
        }
        case "invoice.paid": {
          const invoice = event.data.object as Stripe.Invoice;
          await handleInvoicePaid(stripe, invoice);
          break;
        }
        case "customer.subscription.updated": {
          const subscription = event.data.object as Stripe.Subscription;
          await handleSubscriptionUpdated(subscription);
          break;
        }
        case "customer.subscription.deleted": {
          const subscription = event.data.object as Stripe.Subscription;
          await handleSubscriptionDeleted(subscription);
          break;
        }
        case "payment_intent.succeeded": {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          await handlePaymentIntentSucceeded(paymentIntent);
          break;
        }
        case "payment_intent.payment_failed": {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          await handlePaymentIntentFailed(paymentIntent);
          break;
        }
        default:
          logger.debug(`Unhandled event type: ${event.type}`, {
            route: "/api/stripe/webhook",
          });
      }
    })(),
  );

  if (processingError) {
    // Log detailed error for debugging but don't expose internals to client
    logger.error(
      "Error processing webhook",
      processingError instanceof Error ? processingError : undefined,
      { route: "/api/stripe/webhook" },
    );
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(
  stripe: Stripe,
  session: Stripe.Checkout.Session,
) {
  const {
    userId,
    type,
    tokens,
    packageId,
    planId,
    tokensPerMonth: creditsPerMonth,
    tier: workspaceTier,
    monthlyAiCredits: workspaceCredits,
  } = session.metadata || {};

  if (!userId) {
    logger.error("No userId in checkout session metadata", undefined, {
      route: "/api/stripe/webhook",
    });
    return;
  }

  if (type === "token_purchase" && tokens && packageId) {
    // Credit purchased tokens by increasing workspace monthly credit limit
    const tokenAmount = parseInt(tokens, 10);

    // Ensure workspace exists for this user, then increment their credit limit
    const workspaceId = await WorkspaceCreditManager.resolveWorkspaceForUser(
      userId,
    );
    if (workspaceId) {
      await prisma.workspace.update({
        where: { id: workspaceId },
        data: { monthlyAiCredits: { increment: tokenAmount } },
      });
    }

    logger.info("[Stripe] Credited tokens to user", {
      tokenAmount,
      userId,
      route: "/api/stripe/webhook",
    });

    // Track purchase conversion attribution for campaign analytics
    const { error: attributionError } = await tryCatch(
      attributeConversion(
        userId,
        "PURCHASE",
        (session.amount_total || 0) / 100,
      ),
    );
    if (attributionError) {
      logger.error(
        "Failed to track purchase attribution",
        attributionError instanceof Error ? attributionError : undefined,
        { route: "/api/stripe/webhook" },
      );
    }
  }

  if (type === "subscription" && planId && creditsPerMonth) {
    // Create subscription record
    const stripeSubscriptionId = session.subscription as string;
    const subscriptionData = await stripe.subscriptions.retrieve(
      stripeSubscriptionId,
    );

    // Stripe v20+: billing period is on subscription item, not subscription level
    const firstItem = subscriptionData.items.data[0];
    const currentPeriodStart = firstItem?.current_period_start
      ? new Date(firstItem.current_period_start * 1000)
      : new Date();
    const currentPeriodEnd = firstItem?.current_period_end
      ? new Date(firstItem.current_period_end * 1000)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default to 30 days

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Create or update subscription
      await tx.subscription.upsert({
        where: { userId },
        create: {
          userId,
          stripeSubscriptionId,
          stripePriceId: firstItem?.price.id || "",
          status: "ACTIVE",
          currentPeriodStart,
          currentPeriodEnd,
          creditsPerMonth: parseInt(creditsPerMonth, 10),
        },
        update: {
          stripeSubscriptionId,
          stripePriceId: firstItem?.price.id || "",
          status: "ACTIVE",
          currentPeriodStart,
          currentPeriodEnd,
          creditsPerMonth: parseInt(creditsPerMonth, 10),
        },
      });

      // Set workspace credit limit and reset usage for new subscription
      const workspaceId = await WorkspaceCreditManager.resolveWorkspaceForUser(
        userId,
      );
      if (workspaceId) {
        await tx.workspace.update({
          where: { id: workspaceId },
          data: {
            monthlyAiCredits: parseInt(creditsPerMonth, 10),
            usedAiCredits: 0,
          },
        });
      }
    });

    logger.info("[Stripe] Created subscription for user", {
      userId,
      creditsPerMonth,
      route: "/api/stripe/webhook",
    });

    // Track purchase conversion attribution for campaign analytics (subscription)
    const { error: subscriptionAttributionError } = await tryCatch(
      attributeConversion(
        userId,
        "PURCHASE",
        (session.amount_total || 0) / 100,
      ),
    );
    if (subscriptionAttributionError) {
      logger.error(
        "Failed to track subscription purchase attribution",
        subscriptionAttributionError instanceof Error
          ? subscriptionAttributionError
          : undefined,
        { route: "/api/stripe/webhook" },
      );
    }
  }

  // Handle tier upgrade subscriptions (Token Well tiers)
  if (type === "tier_upgrade") {
    const { tier, previousTier, wellCapacity } = session.metadata || {};

    if (!tier || !wellCapacity) {
      logger.error(
        "Missing tier or wellCapacity in tier_upgrade metadata",
        undefined,
        { route: "/api/stripe/webhook" },
      );
      return;
    }

    const stripeSubscriptionId = session.subscription as string;

    if (!stripeSubscriptionId) {
      logger.error("No subscription ID in tier_upgrade session", undefined, {
        route: "/api/stripe/webhook",
      });
      return;
    }

    const subscriptionData = await stripe.subscriptions.retrieve(
      stripeSubscriptionId,
    );

    // Stripe v20+: billing period is on subscription item, not subscription level
    const firstItem = subscriptionData.items.data[0];
    const currentPeriodStart = firstItem?.current_period_start
      ? new Date(firstItem.current_period_start * 1000)
      : new Date();
    const currentPeriodEnd = firstItem?.current_period_end
      ? new Date(firstItem.current_period_end * 1000)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Validate tier is a valid SubscriptionTier
    const validTiers = ["FREE", "BASIC", "STANDARD", "PREMIUM"];
    if (!validTiers.includes(tier)) {
      logger.error(`Invalid tier value: ${tier}`, undefined, {
        route: "/api/stripe/webhook",
      });
      return;
    }

    const tierEnum = tier as SubscriptionTier;
    const capacity = parseInt(wellCapacity, 10);

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Create or update subscription record with tier
      await tx.subscription.upsert({
        where: { userId },
        create: {
          userId,
          stripeSubscriptionId,
          stripePriceId: firstItem?.price.id || "",
          status: "ACTIVE",
          tier: tierEnum,
          currentPeriodStart,
          currentPeriodEnd,
          creditsPerMonth: 0, // Tier subscriptions don't grant tokens per month
        },
        update: {
          stripeSubscriptionId,
          stripePriceId: firstItem?.price.id || "",
          status: "ACTIVE",
          tier: tierEnum,
          currentPeriodStart,
          currentPeriodEnd,
        },
      });

      // Update workspace credit capacity based on tier
      const workspaceId = await WorkspaceCreditManager.resolveWorkspaceForUser(
        userId,
      );
      if (workspaceId) {
        await tx.workspace.update({
          where: { id: workspaceId },
          data: { monthlyAiCredits: capacity },
        });
      }
    });

    logger.info("[Stripe] Tier upgrade completed", {
      userId,
      previousTier,
      tier,
      route: "/api/stripe/webhook",
    });

    // Track tier upgrade conversion attribution
    const { error: tierAttributionError } = await tryCatch(
      attributeConversion(
        userId,
        "PURCHASE",
        (session.amount_total || 0) / 100,
      ),
    );
    if (tierAttributionError) {
      logger.error(
        "Failed to track tier upgrade attribution",
        tierAttributionError instanceof Error
          ? tierAttributionError
          : undefined,
        { route: "/api/stripe/webhook" },
      );
    }
  }

  // Handle workspace tier subscription (Orbit PRO/BUSINESS)
  if (type === "workspace_tier" && workspaceTier && workspaceCredits) {
    const validWorkspaceTiers = ["PRO", "BUSINESS"];
    if (!validWorkspaceTiers.includes(workspaceTier)) {
      logger.error(
        `Invalid workspace tier value: ${workspaceTier}`,
        undefined,
        { route: "/api/stripe/webhook" },
      );
      return;
    }

    const stripeSubscriptionId = session.subscription as string;
    if (!stripeSubscriptionId) {
      logger.error("No subscription ID in workspace_tier session", undefined, {
        route: "/api/stripe/webhook",
      });
      return;
    }

    // Resolve workspace and upgrade tier using WorkspaceSubscriptionService
    const workspaceId = await WorkspaceCreditManager.resolveWorkspaceForUser(
      userId,
    );
    if (workspaceId) {
      await WorkspaceSubscriptionService.upgradeTier(
        workspaceId,
        workspaceTier as "PRO" | "BUSINESS",
      );

      // Store Stripe subscription ID, set monthly credits, and reset used credits
      await prisma.workspace.update({
        where: { id: workspaceId },
        data: {
          stripeSubscriptionId,
          monthlyAiCredits: parseInt(workspaceCredits, 10),
          usedAiCredits: 0,
        },
      });
    }

    logger.info("[Stripe] Workspace tier upgrade", {
      userId,
      workspaceTier,
      route: "/api/stripe/webhook",
    });

    // Track workspace tier upgrade attribution
    const { error: workspaceTierAttributionError } = await tryCatch(
      attributeConversion(
        userId,
        "PURCHASE",
        (session.amount_total || 0) / 100,
      ),
    );
    if (workspaceTierAttributionError) {
      logger.error(
        "Failed to track workspace tier attribution",
        workspaceTierAttributionError instanceof Error
          ? workspaceTierAttributionError
          : undefined,
        { route: "/api/stripe/webhook" },
      );
    }
  }
}

async function handleInvoicePaid(stripe: Stripe, invoice: Stripe.Invoice) {
  // This handles recurring subscription payments
  // Stripe v20+: subscription is now in parent.subscription_details.subscription
  const subscriptionId = invoice.parent?.subscription_details?.subscription;
  const subscriptionIdString = typeof subscriptionId === "string"
    ? subscriptionId
    : subscriptionId?.id;

  if (
    !subscriptionIdString || invoice.billing_reason === "subscription_create"
  ) {
    // Skip initial subscription invoice (handled in checkout.session.completed)
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(
    subscriptionIdString,
  );
  const customerId = invoice.customer as string;

  // Stripe v20+: billing period is on subscription item, not subscription level
  const firstItem = subscription.items.data[0];
  const currentPeriodStart = firstItem?.current_period_start
    ? new Date(firstItem.current_period_start * 1000)
    : new Date();
  const currentPeriodEnd = firstItem?.current_period_end
    ? new Date(firstItem.current_period_end * 1000)
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  // Find user by Stripe customer ID
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
    include: { subscription: true },
  });

  if (!user || !user.subscription) {
    logger.error("No user or subscription found for customer", undefined, {
      customerId,
      route: "/api/stripe/webhook",
    });
    return;
  }

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const sub = user.subscription!;

    // Update subscription period
    await tx.subscription.update({
      where: { id: sub.id },
      data: {
        currentPeriodStart,
        currentPeriodEnd,
      },
    });

    // Reset workspace credit usage for new billing period
    const workspaceId = await WorkspaceCreditManager.resolveWorkspaceForUser(
      user.id,
    );
    if (workspaceId) {
      await tx.workspace.update({
        where: { id: workspaceId },
        data: { usedAiCredits: 0 },
      });
    }
  });

  logger.info("[Stripe] Renewed subscription for user", {
    userId: user.id,
    route: "/api/stripe/webhook",
  });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const sub = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (!sub) return;

  // Stripe v20+: billing period is on subscription item, not subscription level
  const firstItem = subscription.items.data[0];
  const currentPeriodEnd = firstItem?.current_period_end
    ? new Date(firstItem.current_period_end * 1000)
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await prisma.subscription.update({
    where: { id: sub.id },
    data: {
      status: subscription.status === "active"
        ? "ACTIVE"
        : subscription.status === "past_due"
        ? "PAST_DUE"
        : subscription.status === "canceled"
        ? "CANCELED"
        : subscription.status === "unpaid"
        ? "UNPAID"
        : "PAST_DUE", // Unknown statuses (trialing, incomplete, paused) must not grant full access
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodEnd,
    },
  });
}

async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent,
) {
  const { orderId, type } = paymentIntent.metadata || {};
  if (type !== "merch_order" || !orderId) return;

  const { error } = await tryCatch(
    prisma.merchOrder.updateMany({
      where: { id: orderId, status: "PENDING" },
      data: {
        status: "PAID",
        stripePaymentStatus: "succeeded",
      },
    }),
  );

  if (error) {
    logger.error(
      "Failed to update MerchOrder to PAID on payment_intent.succeeded",
      error instanceof Error ? error : undefined,
      { orderId, route: "/api/stripe/webhook" },
    );
    throw error;
  }

  logger.info("[Stripe] MerchOrder marked PAID", {
    orderId,
    route: "/api/stripe/webhook",
  });
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const { orderId, type } = paymentIntent.metadata || {};
  if (type !== "merch_order" || !orderId) return;

  const { error } = await tryCatch(
    prisma.merchOrder.updateMany({
      where: { id: orderId, status: "PENDING" },
      data: {
        status: "CANCELLED",
        stripePaymentStatus: "failed",
      },
    }),
  );

  if (error) {
    logger.error(
      "Failed to update MerchOrder to CANCELLED on payment_intent.payment_failed",
      error instanceof Error ? error : undefined,
      { orderId, route: "/api/stripe/webhook" },
    );
    throw error;
  }

  logger.info("[Stripe] MerchOrder marked CANCELLED (payment failed)", {
    orderId,
    route: "/api/stripe/webhook",
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const sub = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
    select: { userId: true },
  });

  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: { status: "CANCELED" },
  });

  if (sub?.userId) {
    // Revoke workspace AI credits — reset to free tier defaults
    const workspaceId = await WorkspaceCreditManager.resolveWorkspaceForUser(
      sub.userId,
    );
    if (workspaceId) {
      await prisma.workspace.update({
        where: { id: workspaceId },
        data: {
          monthlyAiCredits: 100, // Free tier default (Prisma schema @default(100))
          usedAiCredits: 0,
        },
      });
    }

    logger.info("[Stripe] Revoked workspace AI credits on subscription deletion", {
      userId: sub.userId,
      route: "/api/stripe/webhook",
    });
  }
}
