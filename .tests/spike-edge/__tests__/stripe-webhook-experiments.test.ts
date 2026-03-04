import { describe, expect, it, vi } from "vitest";
import { Hono } from "hono";
import { stripeWebhook } from "../../../src/spike-edge/routes/stripe-webhook.js";
import type { Env } from "../../../src/spike-edge/env.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const WEBHOOK_SECRET = "whsec_test_secret_123";

async function buildStripeSignature(body: string, secret: string): Promise<string> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const payload = `${timestamp}.${body}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signed = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const hex = Array.from(new Uint8Array(signed))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `t=${timestamp},v1=${hex}`;
}

function createMockDB(opts: {
  donationUpdated?: boolean;
  assignments?: Array<{ experiment_id: string; variant_id: string }>;
}) {
  const mockPrepare = vi.fn((sql: string) => {
    const stmt = {
      bind: vi.fn((..._args: unknown[]) => stmt),
      all: vi.fn(async () => {
        if (sql.includes("experiment_assignments")) {
          return { results: opts.assignments ?? [] };
        }
        return { results: [] };
      }),
      first: vi.fn(async () => {
        if (sql.includes("webhook_events")) {
          return null;
        }
        return null;
      }),
      run: vi.fn(async () => ({
        success: true,
        meta: { changes: opts.donationUpdated ? 1 : 0 },
      })),
    };
    return stmt;
  });

  return {
    db: {
      prepare: mockPrepare,
      batch: vi.fn(async (stmts: unknown[]) => stmts.map(() => ({ success: true }))),
    } as unknown as D1Database,
    mockPrepare,
  };
}

function createApp() {
  const app = new Hono<{ Bindings: Env }>();
  app.route("/", stripeWebhook);
  return app;
}

async function postWebhook(
  app: Hono<{ Bindings: Env }>,
  event: Record<string, unknown>,
  env: Partial<Env>,
) {
  const payload = JSON.stringify(event);
  const signature = await buildStripeSignature(payload, WEBHOOK_SECRET);
  return app.request(
    "/stripe/webhook",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": signature,
      },
      body: payload,
    },
    {
      STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET,
      ...env,
    } as unknown as Env,
  );
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("stripe-webhook experiment tracking", () => {
  it("injects checkout_completed events for assigned experiments on blog_support", async () => {
    const { db } = createMockDB({
      donationUpdated: true,
      assignments: [
        { experiment_id: "exp-1", variant_id: "variant-a" },
        { experiment_id: "exp-2", variant_id: "control" },
      ],
    });

    const app = createApp();
    const event = {
      id: "evt_test_001",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_session_001",
          metadata: {
            type: "blog_support",
            slug: "my-blog-post",
            amount: "5",
            client_id: "client-abc-123",
          },
        },
      },
    };

    const res = await postWebhook(app, event, { DB: db });
    expect(res.status).toBe(200);

    const json = await res.json() as { received: boolean };
    expect(json.received).toBe(true);

    // Verify experiment_assignments was queried
    const prepareCalls = (db.prepare as ReturnType<typeof vi.fn>).mock.calls;
    const assignmentQuery = prepareCalls.find(
      (call: string[]) => call[0].includes("experiment_assignments"),
    );
    expect(assignmentQuery).toBeDefined();

    // Verify batch was called for tracking statements
    expect(db.batch).toHaveBeenCalled();

    // Should have 3 statements per assignment (event + revenue + donations) = 6 total
    const batchCalls = (db.batch as ReturnType<typeof vi.fn>).mock.calls;
    expect(batchCalls.length).toBeGreaterThan(0);
    const batchArgs = batchCalls[0][0] as unknown[];
    expect(batchArgs).toHaveLength(6);
  });

  it("skips experiment tracking when no client_id in metadata", async () => {
    const { db } = createMockDB({ donationUpdated: true });
    const app = createApp();

    const event = {
      id: "evt_test_002",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_session_002",
          metadata: {
            type: "blog_support",
            slug: "my-blog-post",
            amount: "10",
          },
        },
      },
    };

    const res = await postWebhook(app, event, { DB: db });
    expect(res.status).toBe(200);

    // batch should NOT have been called for tracking
    expect(db.batch).not.toHaveBeenCalled();
  });

  it("skips experiment tracking when no assignments exist for client", async () => {
    const { db } = createMockDB({
      donationUpdated: true,
      assignments: [],
    });
    const app = createApp();

    const event = {
      id: "evt_test_003",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_session_003",
          metadata: {
            type: "blog_support",
            slug: "my-blog-post",
            amount: "5",
            client_id: "client-no-assignments",
          },
        },
      },
    };

    const res = await postWebhook(app, event, { DB: db });
    expect(res.status).toBe(200);

    // batch should NOT have been called since there are no assignments
    expect(db.batch).not.toHaveBeenCalled();
  });

  it("does not block webhook acknowledgement when tracking fails", async () => {
    const db = {
      prepare: vi.fn((sql: string) => {
        const stmt = {
          bind: vi.fn((..._args: unknown[]) => stmt),
          all: vi.fn(async () => {
            if (sql.includes("experiment_assignments")) {
              throw new Error("DB connection lost");
            }
            return { results: [] };
          }),
          first: vi.fn(async () => null),
          run: vi.fn(async () => ({
            success: true,
            meta: { changes: 1 },
          })),
        };
        return stmt;
      }),
      batch: vi.fn(async () => []),
    } as unknown as D1Database;

    const app = createApp();
    const event = {
      id: "evt_test_004",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_session_004",
          metadata: {
            type: "blog_support",
            slug: "test-post",
            amount: "5",
            client_id: "client-xyz",
          },
        },
      },
    };

    const res = await postWebhook(app, event, { DB: db });
    expect(res.status).toBe(200);

    const json = await res.json() as { received: boolean };
    expect(json.received).toBe(true);
  });
});
