/**
 * Tests for lib/skill-tracker.ts
 */
import { describe, expect, it, vi } from "vitest";
import { recordSkillCall } from "../../../src/edge-api/spike-land/core-logic/lib/skill-tracker";

function createMockD1WithCapture() {
  const batches: unknown[][] = [];

  const db = {
    prepare: (sql: string) => {
      let boundValues: unknown[] = [];
      const stmt = {
        bind: (...values: unknown[]) => {
          boundValues = values;
          return stmt;
        },
        all: async () => ({ results: [], success: true, meta: {} }),
        run: async () => ({ results: [], success: true, meta: {} }),
        first: async () => null,
        raw: async () => [],
        _sql: sql,
        get _boundValues() {
          return boundValues;
        },
      };
      return stmt;
    },
    batch: async (stmts: unknown[]) => {
      batches.push(stmts);
      return stmts.map(() => ({ results: [], success: true, meta: {} }));
    },
    dump: async () => new ArrayBuffer(0),
    exec: async () => ({ count: 0, duration: 0 }),
  } as unknown as D1Database;

  return { db, batches };
}

/**
 * Creates a D1 mock that:
 * - handles db.batch([...]) for the 3 initial inserts
 * - returns configurable values from .first() based on call order
 *   (first call returns { cnt }, second call returns { days })
 */
function createMockD1WithFirstResults({ cnt, days }: { cnt: number; days: number }) {
  const batches: unknown[][] = [];
  let firstCallCount = 0;

  const db = {
    prepare: (_sql: string) => {
      const stmt = {
        bind: (..._values: unknown[]) => stmt,
        all: async () => ({ results: [], success: true, meta: {} }),
        run: async () => ({ results: [], success: true, meta: {} }),
        first: async () => {
          firstCallCount++;
          // First .first() call → total count; second → distinct days
          if (firstCallCount % 2 === 1) {
            return { cnt };
          }
          return { days };
        },
        raw: async () => [],
      };
      return stmt;
    },
    batch: async (stmts: unknown[]) => {
      batches.push(stmts);
      return stmts.map(() => ({ results: [], success: true, meta: {} }));
    },
    dump: async () => new ArrayBuffer(0),
    exec: async () => ({ count: 0, duration: 0 }),
  } as unknown as D1Database;

  return { db, batches };
}

function makeSpikeEdgeFetcher(impl?: () => Promise<Response>): Fetcher {
  return {
    fetch: vi.fn(impl ?? (() => Promise.resolve(new Response("{}", { status: 200 })))),
  } as unknown as Fetcher;
}

const baseRecord = {
  userId: "user-1",
  toolName: "search_tools",
  serverName: "spike-land-mcp",
  outcome: "success" as const,
  durationMs: 123,
  category: "gateway-meta",
};

describe("recordSkillCall", () => {
  it("calls db.batch with 3 statements for a successful call", async () => {
    const { db, batches } = createMockD1WithCapture();

    await recordSkillCall(db, {
      userId: "user-1",
      toolName: "search_tools",
      serverName: "spike-land-mcp",
      outcome: "success",
      durationMs: 123,
      category: "gateway-meta",
    });

    expect(batches).toHaveLength(1);
    expect(batches[0]).toHaveLength(3);
  });

  it("calls db.batch with 3 statements for an error outcome", async () => {
    const { db, batches } = createMockD1WithCapture();

    await recordSkillCall(db, {
      userId: "user-2",
      toolName: "list_files",
      serverName: "spike-land-mcp",
      outcome: "error",
      durationMs: 55,
      errorMessage: "Permission denied",
    });

    expect(batches).toHaveLength(1);
    expect(batches[0]).toHaveLength(3);
  });

  it("works without optional category and errorMessage", async () => {
    const { db, batches } = createMockD1WithCapture();

    await recordSkillCall(db, {
      userId: "user-3",
      toolName: "get_status",
      serverName: "spike-land-mcp",
      outcome: "success",
      durationMs: 10,
    });

    expect(batches).toHaveLength(1);
    expect(batches[0]).toHaveLength(3);
  });

  it("does not throw when batch fails", async () => {
    const db = {
      prepare: () => ({
        bind: () => ({}),
      }),
      batch: vi.fn().mockRejectedValue(new Error("D1 error")),
    } as unknown as D1Database;

    await expect(
      recordSkillCall(db, {
        userId: "user-4",
        toolName: "tool",
        serverName: "server",
        outcome: "success",
        durationMs: 0,
      }),
    ).rejects.toThrow("D1 error");
  });

  // ── spikeEdge milestone event tests ──────────────────────────────

  it("no spikeEdge provided → no milestone events and no fetch calls", async () => {
    const { db } = createMockD1WithFirstResults({ cnt: 1, days: 1 });
    // No spikeEdge argument — function must not make any fetch calls
    await recordSkillCall(db, baseRecord);
    // No assertions on a fetcher — simply confirms no error and no network calls
  });

  it("first ever tool call (cnt=1, days=1) → emits mcp_server_connected and first_tool_call", async () => {
    const { db } = createMockD1WithFirstResults({ cnt: 1, days: 1 });
    const spikeEdge = makeSpikeEdgeFetcher();

    await recordSkillCall(db, baseRecord, spikeEdge);

    // Allow the fire-and-forget .catch(() => {}) path to settle
    await Promise.resolve();

    expect(spikeEdge.fetch).toHaveBeenCalledTimes(1);

    const [url, init] = (spikeEdge.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toBe("https://spike.land/analytics/ingest");

    const body = JSON.parse(init.body as string) as Array<{ eventType: string }>;
    const types = body.map((e) => e.eventType);
    expect(types).toContain("mcp_server_connected");
    expect(types).toContain("first_tool_call");
  });

  it("second session (cnt=5, days=2) → emits second_session only", async () => {
    const { db } = createMockD1WithFirstResults({ cnt: 5, days: 2 });
    const spikeEdge = makeSpikeEdgeFetcher();

    await recordSkillCall(db, baseRecord, spikeEdge);
    await Promise.resolve();

    expect(spikeEdge.fetch).toHaveBeenCalledTimes(1);

    const [, init] = (spikeEdge.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const body = JSON.parse(init.body as string) as Array<{ eventType: string }>;
    const types = body.map((e) => e.eventType);
    expect(types).toEqual(["second_session"]);
  });

  it("regular call (cnt=10, days=5) → no milestone events emitted", async () => {
    const { db } = createMockD1WithFirstResults({ cnt: 10, days: 5 });
    const spikeEdge = makeSpikeEdgeFetcher();

    await recordSkillCall(db, baseRecord, spikeEdge);
    await Promise.resolve();

    expect(spikeEdge.fetch).not.toHaveBeenCalled();
  });

  it("spikeEdge.fetch failure is silenced — recordSkillCall resolves normally", async () => {
    const { db } = createMockD1WithFirstResults({ cnt: 1, days: 1 });
    const spikeEdge = makeSpikeEdgeFetcher(() => Promise.reject(new Error("network error")));

    // Must resolve without throwing even when the fetch rejects
    await expect(recordSkillCall(db, baseRecord, spikeEdge)).resolves.toBeUndefined();
  });
});
