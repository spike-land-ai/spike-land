import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearEloCache, ensureUserElo, getUserElo, recordEloEvent } from "../elo-service.js";

// Mock D1Database
function createMockDb() {
  const store = new Map<string, Record<string, unknown>>();

  const mockPrepare = vi.fn().mockImplementation((sql: string) => {
    const bindValues: unknown[] = [];

    const statement = {
      bind: (...args: unknown[]) => {
        bindValues.push(...args);
        return statement;
      },
      first: vi.fn().mockImplementation(async () => {
        if (sql.includes("SELECT") && sql.includes("user_elo")) {
          const userId = bindValues[0] as string;
          const row = store.get(userId);
          return row ?? null;
        }
        return null;
      }),
      run: vi.fn().mockImplementation(async () => {
        if (sql.includes("INSERT INTO user_elo")) {
          const userId = bindValues[0] as string;
          store.set(userId, {
            user_id: userId,
            elo: bindValues[1] as number,
            event_count: 0,
            daily_gains: 0,
            daily_reset_at: bindValues[2] as number,
            tier: bindValues[3] as string,
          });
        }
        return { success: true };
      }),
    };
    return statement;
  });

  const mockBatch = vi.fn().mockImplementation(async (stmts: unknown[]) => {
    // Simulate batch: parse UPDATE + INSERT from the bind values
    // In tests, we just need to verify the batch was called
    return stmts.map(() => ({ success: true }));
  });

  return {
    prepare: mockPrepare,
    batch: mockBatch,
    _store: store,
  } as unknown as D1Database & { _store: Map<string, Record<string, unknown>> };
}

describe("elo-service", () => {
  let db: D1Database & { _store: Map<string, Record<string, unknown>> };

  beforeEach(() => {
    clearEloCache();
    db = createMockDb();
  });

  afterEach(() => {
    clearEloCache();
  });

  describe("ensureUserElo", () => {
    it("creates a new user with default ELO 1200", async () => {
      const result = await ensureUserElo(db, "user-1");
      expect(result.userId).toBe("user-1");
      expect(result.elo).toBe(1200);
      expect(result.tier).toBe("pro");
      expect(result.eventCount).toBe(0);
      expect(result.dailyGains).toBe(0);
    });

    it("returns existing user from DB", async () => {
      // Pre-populate the store
      db._store.set("user-2", {
        user_id: "user-2",
        elo: 1800,
        event_count: 50,
        daily_gains: 30,
        daily_reset_at: Date.now(),
        tier: "business",
      });

      const result = await ensureUserElo(db, "user-2");
      expect(result.elo).toBe(1800);
      expect(result.tier).toBe("business");
      expect(result.eventCount).toBe(50);
    });

    it("uses cache on second call", async () => {
      await ensureUserElo(db, "user-3");
      const callCount = (db.prepare as ReturnType<typeof vi.fn>).mock.calls.length;

      await ensureUserElo(db, "user-3");
      // Should not have made additional DB calls
      expect((db.prepare as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callCount);
    });
  });

  describe("getUserElo", () => {
    it("returns null for unknown user", async () => {
      const result = await getUserElo(db, "nonexistent");
      expect(result).toBeNull();
    });

    it("returns user data when exists", async () => {
      db._store.set("user-4", {
        user_id: "user-4",
        elo: 900,
        event_count: 10,
        daily_gains: 5,
        daily_reset_at: Date.now(),
        tier: "free",
      });

      const result = await getUserElo(db, "user-4");
      expect(result).not.toBeNull();
      expect(result?.elo).toBe(900);
      expect(result?.tier).toBe("free");
    });
  });

  describe("recordEloEvent", () => {
    it("records a positive event and updates ELO", async () => {
      const result = await recordEloEvent(db, "user-5", "report_valid_bug", "bug-1");
      expect(result.delta).toBe(25);
      expect(result.newElo).toBe(1225);
      expect(result.tier).toBe("pro");
      expect(result.capped).toBe(false);
      expect(db.batch).toHaveBeenCalledTimes(1);
    });

    it("records a negative event", async () => {
      const result = await recordEloEvent(db, "user-6", "abuse_flag");
      expect(result.delta).toBe(-50);
      expect(result.newElo).toBe(1150);
    });

    it("caps daily gains at 100", async () => {
      // Pre-populate user with 90 daily gains
      db._store.set("user-7", {
        user_id: "user-7",
        elo: 1200,
        event_count: 10,
        daily_gains: 90,
        daily_reset_at: Date.now(),
        tier: "pro",
      });

      const result = await recordEloEvent(db, "user-7", "report_valid_bug");
      // Should cap at remaining 10 (100 - 90)
      expect(result.delta).toBe(10);
      expect(result.capped).toBe(true);
      expect(result.newElo).toBe(1210);
    });

    it("returns 0 delta when daily cap is fully used", async () => {
      db._store.set("user-8", {
        user_id: "user-8",
        elo: 1200,
        event_count: 50,
        daily_gains: 100,
        daily_reset_at: Date.now(),
        tier: "pro",
      });

      const result = await recordEloEvent(db, "user-8", "successful_tool_use");
      expect(result.delta).toBe(0);
      expect(result.capped).toBe(true);
      // No batch call since delta is 0
      expect(db.batch).not.toHaveBeenCalled();
    });

    it("negative events bypass daily cap", async () => {
      db._store.set("user-9", {
        user_id: "user-9",
        elo: 1200,
        event_count: 50,
        daily_gains: 100,
        daily_reset_at: Date.now(),
        tier: "pro",
      });

      const result = await recordEloEvent(db, "user-9", "rate_limit_hit");
      expect(result.delta).toBe(-5);
      expect(result.newElo).toBe(1195);
    });
  });
});
