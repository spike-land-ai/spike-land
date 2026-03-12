/// <reference types="@cloudflare/workers-types" />
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  handleCheckoutCompleted,
  type StripeEvent,
} from "../../lazy-imports/subscription-service.js";

// ── Tracking D1 mock ───────────────────────────────────────────────
//
// Records every SQL string that passes through .prepare(), and
// captures the bound values for INSERT INTO analytics_events calls.

interface TrackedStatement {
  sql: string;
  boundValues: unknown[];
}

function createTrackingD1({
  firstResult = null as unknown,
  throwOnAnalyticsInsert = false,
}: {
  firstResult?: unknown;
  throwOnAnalyticsInsert?: boolean;
} = {}) {
  const analyticsInserts: TrackedStatement[] = [];
  const allStatements: TrackedStatement[] = [];

  const db = {
    prepare: (sql: string) => {
      let boundValues: unknown[] = [];

      const stmt = {
        bind: (...values: unknown[]) => {
          boundValues = values;
          return stmt;
        },
        first: async <T = unknown>() => firstResult as T,
        run: async () => {
          const record: TrackedStatement = { sql, boundValues };
          allStatements.push(record);

          if (sql.includes("analytics_events")) {
            if (throwOnAnalyticsInsert) {
              throw new Error("D1 analytics write failed");
            }
            analyticsInserts.push(record);
          }

          return { results: [], success: true, meta: {} };
        },
        all: async () => ({ results: [], success: true, meta: {} }),
        raw: async () => [],
      };
      return stmt;
    },
    batch: async (stmts: unknown[]) => stmts.map(() => ({ results: [], success: true, meta: {} })),
    dump: async () => new ArrayBuffer(0),
    exec: async () => ({ count: 0, duration: 0 }),
  } as unknown as D1Database;

  return { db, analyticsInserts, allStatements };
}

// ── Event factory ──────────────────────────────────────────────────

function makeCheckoutEvent(
  meta: Record<string, string> = {},
  extra: Record<string, unknown> = {},
): StripeEvent {
  return {
    id: "evt_test_001",
    type: "checkout.session.completed",
    data: {
      object: {
        customer_email: "user@example.com",
        customer: "cus_test",
        subscription: "sub_test",
        metadata: meta,
        ...extra,
      },
    },
  };
}

// ── Tests ──────────────────────────────────────────────────────────

describe("handleCheckoutCompleted — upgrade_completed analytics event", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("emits upgrade_completed into analytics_events on a new subscription", async () => {
    const { db, analyticsInserts } = createTrackingD1({ firstResult: null });

    const event = makeCheckoutEvent({ userId: "user-123", tier: "pro" });
    await handleCheckoutCompleted(db, event);

    expect(analyticsInserts).toHaveLength(1);
    expect(analyticsInserts[0].sql).toMatch(/INSERT INTO analytics_events/);

    // The bound values are: JSON metadata, client_id
    const [metadataJson, clientId] = analyticsInserts[0].boundValues as [string, string];
    expect(clientId).toBe("user_user-123");

    const metadata = JSON.parse(metadataJson) as Record<string, unknown>;
    expect(metadata.plan).toBe("pro");
    expect(metadata.userId).toBe("user-123");
  });

  it("upgrade_completed metadata contains plan and userId", async () => {
    const { db, analyticsInserts } = createTrackingD1({ firstResult: null });

    const event = makeCheckoutEvent({ userId: "user-456", tier: "business" });
    await handleCheckoutCompleted(db, event);

    const [metadataJson] = analyticsInserts[0].boundValues as [string];
    const metadata = JSON.parse(metadataJson) as Record<string, unknown>;
    expect(metadata).toMatchObject({ plan: "business", userId: "user-456" });
  });

  it("analytics failure does not break checkout — resolves without throwing", async () => {
    const { db } = createTrackingD1({ firstResult: null, throwOnAnalyticsInsert: true });

    const event = makeCheckoutEvent({ userId: "user-789", tier: "pro" });
    await expect(handleCheckoutCompleted(db, event)).resolves.toBeUndefined();
  });

  it("service_purchase events do NOT emit upgrade_completed", async () => {
    const { db, analyticsInserts } = createTrackingD1({ firstResult: null });

    const event = makeCheckoutEvent({
      type: "service_purchase",
      service: "code-review",
      userId: "user-123",
    });
    await handleCheckoutCompleted(db, event);

    expect(analyticsInserts).toHaveLength(0);
  });

  it("missing userId → returns early and no analytics event is recorded", async () => {
    const { db, analyticsInserts } = createTrackingD1({ firstResult: null });

    // No userId in metadata
    const event = makeCheckoutEvent({ tier: "pro" });
    await handleCheckoutCompleted(db, event);

    expect(analyticsInserts).toHaveLength(0);
  });
});
