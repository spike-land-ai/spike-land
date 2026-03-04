import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { calculateBackoff, ReconnectManager } from "../../../../src/spike-cli/multiplexer/reconnect.js";
import type { ReconnectFn } from "../../../../src/spike-cli/multiplexer/reconnect.js";
import type { ServerConfig } from "../../../../src/spike-cli/config/types.js";

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

  it("fires reconnect callback after timer elapses", async () => {
    const mgr = new ReconnectManager(reconnectFn);
    const config: ServerConfig = { command: "node", args: ["server.js"] };
    mgr.scheduleReconnect("test-server", config);

    await vi.runAllTimersAsync();

    expect(reconnectFn).toHaveBeenCalledWith("test-server", config);
    expect(mgr.pendingReconnects).toBe(0);
  });

  it("reschedules on reconnect failure", async () => {
    const failingFn: ReconnectFn = vi.fn(async () => {
      throw new Error("connection refused");
    });

    const mgr = new ReconnectManager(failingFn, { maxAttempts: 3 });
    const config: ServerConfig = { command: "node" };
    mgr.scheduleReconnect("bad-server", config);

    // Fire only the first timer (1000ms)
    await vi.advanceTimersByTimeAsync(1001);

    expect(failingFn).toHaveBeenCalledTimes(1);
    expect(mgr.pendingReconnects).toBe(1); // second attempt queued
  });

  it("stops rescheduling after max attempts exceeded", async () => {
    const failingFn: ReconnectFn = vi.fn(async () => {
      throw new Error("always fails");
    });

    const mgr = new ReconnectManager(failingFn, { maxAttempts: 1 });
    const config: ServerConfig = { command: "node" };
    mgr.scheduleReconnect("srv", config);

    await vi.runAllTimersAsync();

    // First attempt fires, fails, tries to schedule again but maxAttempts=1 already reached
    expect(failingFn).toHaveBeenCalledTimes(1);
    expect(mgr.pendingReconnects).toBe(0);
  });
});
