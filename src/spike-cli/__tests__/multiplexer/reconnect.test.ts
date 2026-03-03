import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { calculateBackoff, ReconnectManager } from "../../multiplexer/reconnect.js";
import type { ReconnectFn } from "../../multiplexer/reconnect.js";
import type { ServerConfig } from "../../config/types.js";

describe("calculateBackoff", () => {
  it("returns initialDelayMs for attempt 0", () => {
    expect(calculateBackoff(0)).toBe(1000);
  });

  it("doubles on each attempt", () => {
    expect(calculateBackoff(0)).toBe(1000);
    expect(calculateBackoff(1)).toBe(2000);
    expect(calculateBackoff(2)).toBe(4000);
    expect(calculateBackoff(3)).toBe(8000);
  });

  it("caps at maxDelayMs", () => {
    expect(calculateBackoff(10)).toBe(30000); // would be 1024000 without cap
  });

  it("respects custom options", () => {
    expect(calculateBackoff(0, { initialDelayMs: 500 })).toBe(500);
    expect(calculateBackoff(1, { initialDelayMs: 500 })).toBe(1000);
    expect(calculateBackoff(10, { maxDelayMs: 5000 })).toBe(5000);
  });
});

describe("ReconnectManager", () => {
  const reconnectFn: ReconnectFn = vi.fn(
    async (_serverName: string, _config: ServerConfig): Promise<void> => {},
  );

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("schedules a reconnect with initial delay", () => {
    const mgr = new ReconnectManager(reconnectFn);
    mgr.scheduleReconnect("test", { command: "node", args: ["test.js"] });

    expect(mgr.pendingReconnects).toBe(1);
    expect(reconnectFn).not.toHaveBeenCalled();
  });

  it("respects max attempts", () => {
    const mgr = new ReconnectManager(reconnectFn, { maxAttempts: 0 });
    mgr.scheduleReconnect("test", { command: "node" });

    // Should not schedule since maxAttempts is 0
    expect(mgr.pendingReconnects).toBe(0);
  });

  it("cancels all pending reconnects", () => {
    const mgr = new ReconnectManager(reconnectFn);
    mgr.scheduleReconnect("a", { command: "node", args: ["a.js"] });
    mgr.scheduleReconnect("b", { command: "node", args: ["b.js"] });

    expect(mgr.pendingReconnects).toBe(2);

    mgr.cancelAll();
    expect(mgr.pendingReconnects).toBe(0);
  });
});
