import { auth } from "@/lib/auth";
import { logger } from "@/lib/errors/structured-logger";
import prisma from "@/lib/prisma";
import { getStripe } from "@/lib/stripe/client";
import { tryCatch } from "@/lib/try-catch";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const MAX_BODY_SIZE = 10 * 1024;

interface BlogSupportRequest {
  mode: "donation" | "subscription" | "promote";
  amount: number;
  articleSlug?: string;
  returnUrl?: string;
}

const VALID_AMOUNTS = [3, 5, 10, 25, 50, 100];

async function processCheckout(request: NextRequest): Promise<NextResponse> {
  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_SIZE) {
    return NextResponse.json({ error: "Request too large" }, { status: 413 });
  }

  const stripe = getStripe();

  const session = await auth();
  if (!session?.user?.id || !session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: body, error: bodyError } = await tryCatch<BlogSupportRequest>(
    request.json(),
  );
  if (bodyError) {
    return NextResponse.json({ error: "Invalid request body" }, {
      status: 400,
    });
  }

  const { mode, amount, articleSlug, returnUrl } = body;

  if (
    returnUrl !== undefined
    && (typeof returnUrl !== "string" || !returnUrl.startsWith("/"))
  ) {
    return NextResponse.json({ error: "Invalid return URL" }, { status: 400 });
  }

  if (
    !VALID_AMOUNTS.includes(amount) || amount <= 0 || !Number.isFinite(amount)
  ) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  if ((mode === "donation" || mode === "promote") && !articleSlug) {
    return NextResponse.json({ error: "Article slug required" }, {
      status: 400,
    });
  }

  // Get or create Stripe customer
  const { data: user, error: userError } = await tryCatch(
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripeCustomerId: true, email: true, name: true },
    }),
  );

  if (userError) {
    logger.error(
      "Error fetching user",
      userError instanceof Error ? userError : undefined,
      { route: "/api/stripe/blog-support" },
    );
    return NextResponse.json({ error: "Failed to fetch user" }, {
      status: 500,
    });
  }

  let stripeCustomerId = user?.stripeCustomerId;

  if (!stripeCustomerId) {
    const { data: customer, error: customerError } = await tryCatch(
      stripe.customers.create(
        {
          email: session.user.email,
          name: session.user.name || undefined,
          metadata: { userId: session.user.id },
        },
        { idempotencyKey: `customer-create-${session.user.id}` },
      ),
    );

    if (customerError) {
      logger.error(
        "Error creating Stripe customer",
        customerError instanceof Error ? customerError : undefined,
        { route: "/api/stripe/blog-support" },
      );
      return NextResponse.json({ error: "Failed to create customer" }, {
        status: 500,
      });
    }

    stripeCustomerId = customer.id;

    // Re-read from DB after create to handle race conditions — only update if
    // stripeCustomerId is still null (another concurrent request may have won)
    const { data: freshUser } = await tryCatch(
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { stripeCustomerId: true },
      }),
    );

    if (!freshUser?.stripeCustomerId) {
      const { error: updateError } = await tryCatch(
        prisma.user.update({
          where: { id: session.user.id },
          data: { stripeCustomerId },
        }),
      );

      if (updateError) {
        logger.error(
          "Error updating user with Stripe customer ID",
          updateError instanceof Error ? updateError : undefined,
          { route: "/api/stripe/blog-support" },
        );
        return NextResponse.json({ error: "Failed to update user" }, {
          status: 500,
        });
      }
    } else {
      // Another request already wrote a customer ID — use that one
      stripeCustomerId = freshUser.stripeCustomerId;
    }
  }

  const origin = request.headers.get("origin") || "https://spike.land";
  const unitAmount = Math.round(amount * 100); // Convert to pence

  if (mode === "donation") {
    const idempotencyWindow = Math.floor(Date.now() / 5000);
    const { data: checkoutSession, error: checkoutError } = await tryCatch(
      stripe.checkout.sessions.create(
        {
          customer: stripeCustomerId,
          mode: "payment",
          payment_method_types: ["card"],
          line_items: [{
            price_data: {
              currency: "gbp",
              product_data: {
                name: "Blog Support",
                description: `One-off support for "${articleSlug}"`,
              },
              unit_amount: unitAmount,
            },
            quantity: 1,
          }],
          metadata: {
            type: "blog_donation",
            userId: session.user.id,
            articleSlug: articleSlug!,
          },
          success_url: `${origin}/blog/${articleSlug}?support=thanks`,
          cancel_url: `${origin}/blog/${articleSlug}`,
        },
        {
          idempotencyKey:
            `checkout-blog-donation-${session.user.id}-${articleSlug}-${amount}-${idempotencyWindow}`,
        },
      ),
    );

    if (checkoutError) {
      logger.error(
        "Error creating blog donation checkout",
        checkoutError instanceof Error ? checkoutError : undefined,
        { route: "/api/stripe/blog-support" },
      );
      return NextResponse.json({ error: "Failed to create checkout session" }, {
        status: 500,
      });
    }

    return NextResponse.json({
      success: true,
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });
  }

  if (mode === "subscription") {
    const idempotencyWindow = Math.floor(Date.now() / 5000);
    const { data: checkoutSession, error: checkoutError } = await tryCatch(
      stripe.checkout.sessions.create(
        {
          customer: stripeCustomerId,
          mode: "subscription",
          payment_method_types: ["card"],
          line_items: [{
            price_data: {
              currency: "gbp",
              product_data: {
                name: "Monthly Blog Support",
                description: `Monthly support — £${amount}/month`,
              },
              unit_amount: unitAmount,
              recurring: { interval: "month" },
            },
            quantity: 1,
          }],
          metadata: {
            type: "blog_subscription",
            userId: session.user.id,
          },
          success_url: `${origin}/blog?subscription=thanks`,
          cancel_url: `${origin}/blog`,
        },
        {
          idempotencyKey:
            `checkout-blog-subscription-${session.user.id}-${amount}-${idempotencyWindow}`,
        },
      ),
    );

    if (checkoutError) {
      logger.error(
        "Error creating blog subscription checkout",
        checkoutError instanceof Error ? checkoutError : undefined,
        { route: "/api/stripe/blog-support" },
      );
      return NextResponse.json({ error: "Failed to create checkout session" }, {
        status: 500,
      });
    }

    return NextResponse.json({
      success: true,
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });
  }

  if (mode === "promote") {
    const idempotencyWindow = Math.floor(Date.now() / 5000);
    const { data: checkoutSession, error: checkoutError } = await tryCatch(
      stripe.checkout.sessions.create(
        {
          customer: stripeCustomerId,
          mode: "payment",
          payment_method_types: ["card"],
          line_items: [{
            price_data: {
              currency: "gbp",
              product_data: {
                name: "Article Promotion",
                description: `Promote "${articleSlug}" via targeted ads`,
              },
              unit_amount: unitAmount,
            },
            quantity: 1,
          }],
          metadata: {
            type: "article_promotion",
            userId: session.user.id,
            articleSlug: articleSlug!,
          },
          success_url: returnUrl
            ? `${origin}${returnUrl}?promoted=thanks`
            : `${origin}/blog/${articleSlug}?promoted=thanks`,
          cancel_url: returnUrl
            ? `${origin}${returnUrl}`
            : `${origin}/blog/${articleSlug}`,
        },
        {
          idempotencyKey:
            `checkout-blog-promote-${session.user.id}-${articleSlug}-${amount}-${idempotencyWindow}`,
        },
      ),
    );

    if (checkoutError) {
      logger.error(
        "Error creating article promotion checkout",
        checkoutError instanceof Error ? checkoutError : undefined,
        { route: "/api/stripe/blog-support" },
      );
      return NextResponse.json({ error: "Failed to create checkout session" }, {
        status: 500,
      });
    }

    return NextResponse.json({
      success: true,
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });
  }

  return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
}

export async function POST(request: NextRequest) {
  const { data, error } = await tryCatch(processCheckout(request));

  if (error) {
    logger.error(
      "Error in blog support checkout",
      error instanceof Error ? error : undefined,
      { route: "/api/stripe/blog-support" },
    );
    return NextResponse.json({ error: "Failed to create checkout session" }, {
      status: 500,
    });
  }

  return data;
}
