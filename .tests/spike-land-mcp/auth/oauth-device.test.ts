/**
 * Tests for auth/oauth-device.ts
 *
 * Covers: createDeviceCode, approveDeviceCode, exchangeDeviceCode.
 */

import { describe, expect, it } from "vitest";
import { approveDeviceCode, createDeviceCode, exchangeDeviceCode } from "../../../src/spike-land-mcp/auth/oauth-device";
import { createMockD1 } from "../__test-utils__/mock-env";
import { createDb } from "../../../src/spike-land-mcp/db/index";
import type { DrizzleDB } from "../../../src/spike-land-mcp/db/index";

// ─── Fake DrizzleDB builder ───────────────────────────────────────────────────

/**
 * Build a fake DrizzleDB that implements the minimal chained API used by
 * oauth-device.ts without going through Drizzle's ORM row-mapping logic.
 *
 * select()...limit(n) -> resolves to `selectRows`
 * insert()/update()/delete() -> resolves immediately (no-op unless overridden)
 */
function makeFakeDb(options: {
  selectRows?: Record<string, unknown>[];
  onInsert?: (values: unknown) => void;
  onDelete?: () => void;
} = {}): DrizzleDB {
  const selectRows = options.selectRows ?? [];

  // Chainable select builder
  const selectChain = {
    from: () => selectChain,
    where: () => selectChain,
    limit: async () => selectRows,
  };

  // Chainable insert builder
  const insertChain = {
    values: async (values: unknown) => {
      options.onInsert?.(values);
    },
  };

  // Chainable update builder
  const updateChain = {
    set: () => updateChain,
    where: async () => {},
  };

  // Chainable delete builder
  const deleteChain = {
    where: async () => {
      options.onDelete?.();
    },
  };

  return {
    select: () => selectChain,
    insert: () => insertChain,
    update: () => updateChain,
    delete: () => deleteChain,
  } as unknown as DrizzleDB;
}

// ─── createDeviceCode ────────────────────────────────────────────────────────

describe("createDeviceCode", () => {
  it("returns deviceCode, userCode, and expiresIn", async () => {
    // We need to capture the inserted row so we can validate later
    let inserted: Record<string, unknown> | null = null;

    const db = createDb(
      createMockD1((sql, bindings) => {
        if (sql.toLowerCase().includes("insert")) {
          // Capture what was inserted
          inserted = { sql, bindings };
        }
        return { results: [], success: true, meta: {} };
      }),
    );

    const result = await createDeviceCode(db, {
      clientId: "client-1",
      scope: "mcp",
    });

    expect(result.deviceCode).toMatch(/^dc_[a-f0-9]+$/);
    expect(result.userCode).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    expect(result.expiresIn).toBe(600);
    expect(inserted).not.toBeNull();
  });

  it("uses default scope when not specified", async () => {
    const insertedValues: unknown[] = [];

    const db = createDb(
      createMockD1((_sql, bindings) => {
        insertedValues.push(...bindings);
        return { results: [], success: true, meta: {} };
      }),
    );

    const result = await createDeviceCode(db, {});
    expect(result.expiresIn).toBe(600);
    // scope defaults to "mcp" — verify it's in the bindings
    expect(insertedValues).toContain("mcp");
  });

  it("generates unique device codes on successive calls", async () => {
    const db = createDb(createMockD1(() => ({ results: [], success: true, meta: {} })));

    const result1 = await createDeviceCode(db, {});
    const result2 = await createDeviceCode(db, {});

    expect(result1.deviceCode).not.toBe(result2.deviceCode);
    expect(result1.userCode).not.toBe(result2.userCode);
  });

  it("userCode format excludes ambiguous characters (0, O, I, 1)", () => {
    // Run multiple times to check statistically
    const codes: string[] = [];
    const db = createDb(createMockD1(() => ({ results: [], success: true, meta: {} })));

    // We can check the format regex: no 0, O, I, 1 in the character set
    // The chars are: ABCDEFGHJKLMNPQRSTUVWXYZ23456789
    const validPattern =
      /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}$/;

    return createDeviceCode(db, {}).then((result) => {
      expect(result.userCode).toMatch(validPattern);
      codes.push(result.userCode);
      expect(result.userCode).not.toMatch(/[01IO]/);
    });
  });
});

// ─── approveDeviceCode ───────────────────────────────────────────────────────

describe("approveDeviceCode", () => {
  it("returns ok:false for expired or missing user code", async () => {
    const db = makeFakeDb({ selectRows: [] });

    const result = await approveDeviceCode(db, "XXXX-XXXX", "user-1");
    expect(result.ok).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("returns ok:true and updates when code exists and not expired", async () => {
    const now = Date.now();

    const db = makeFakeDb({
      selectRows: [
        {
          id: "dc-1",
          userId: null,
          deviceCode: "dc_abc",
          userCode: "ABCD-EFGH",
          scope: "mcp",
          clientId: null,
          expiresAt: now + 300_000,
          approved: false,
          createdAt: now,
        },
      ],
    });

    const result = await approveDeviceCode(db, "ABCD-EFGH", "user-1");
    expect(result.ok).toBe(true);
  });

  it("includes an error description when code is not found", async () => {
    const db = makeFakeDb({ selectRows: [] });

    const result = await approveDeviceCode(db, "FAKE-CODE", "user-1");
    expect(result.ok).toBe(false);
    expect(result.error).toContain("Invalid");
  });
});

// ─── exchangeDeviceCode ───────────────────────────────────────────────────────

describe("exchangeDeviceCode", () => {
  it("returns error object when device code is expired or missing", async () => {
    const db = makeFakeDb({ selectRows: [] });

    const result = await exchangeDeviceCode(db, "dc_nonexistent");
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error).toBe("expired_token");
    }
  });

  it("returns authorization_pending when code exists but not approved", async () => {
    const now = Date.now();

    const db = makeFakeDb({
      selectRows: [
        {
          id: "dc-1",
          userId: null,
          deviceCode: "dc_abc123",
          userCode: "ABCD-EFGH",
          scope: "mcp",
          clientId: null,
          expiresAt: now + 300_000,
          approved: false,
          createdAt: now,
        },
      ],
    });

    const result = await exchangeDeviceCode(db, "dc_abc123");
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error).toBe("authorization_pending");
    }
  });

  it("returns error for empty device code string", async () => {
    const db = makeFakeDb({ selectRows: [] });

    const result = await exchangeDeviceCode(db, "");
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error).toBe("expired_token");
    }
  });

  it("covers result[0] undefined branch (line 105)", async () => {
    // result.length is 1 (truthy), but result[0] is undefined
    // This exercises the `if (!code)` guard at line 104-108
    const db = makeFakeDb({
      selectRows: [undefined as unknown as Record<string, unknown>],
    });

    const result = await exchangeDeviceCode(db, "dc_any");
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error).toBe("expired_token");
    }
  });

  it("returns accessToken when code is approved and userId is set", async () => {
    const now = Date.now();
    let insertCalled = false;
    let deleteCalled = false;

    const db = makeFakeDb({
      selectRows: [
        {
          id: "dc-approved",
          userId: "user-approved-123",
          deviceCode: "dc_approved_code",
          userCode: "APPR-OVED",
          scope: "mcp",
          clientId: "client-xyz",
          expiresAt: now + 300_000,
          approved: true,
          createdAt: now,
        },
      ],
      onInsert: () => { insertCalled = true; },
      onDelete: () => { deleteCalled = true; },
    });

    const result = await exchangeDeviceCode(db, "dc_approved_code");

    expect("accessToken" in result).toBe(true);
    if ("accessToken" in result) {
      expect(result.accessToken).toMatch(/^mcp_/);
      expect(result.tokenType).toBe("Bearer");
      expect(result.scope).toBe("mcp");
    }
    expect(insertCalled).toBe(true);
    expect(deleteCalled).toBe(true);
  });
});
