import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildHealthPayload,
  checkDependencyHealth,
  checkFetchBindingHealth,
  getHealthHttpStatus,
  getOverallHealthStatus,
} from "../routes/health-route-logic.js";

describe("healthRouteLogic", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("marks dependency checks as ok or degraded", async () => {
    await expect(checkDependencyHealth(async () => Promise.resolve("ready"))).resolves.toBe("ok");
    await expect(
      checkDependencyHealth(async () => Promise.reject(new Error("down"))),
    ).resolves.toBe("degraded");
  });

  it("evaluates fetch bindings from response status and thrown errors", async () => {
    const okBinding = {
      fetch: vi.fn().mockResolvedValue(new Response("{}", { status: 200 })),
    };
    const nonOkBinding = {
      fetch: vi.fn().mockResolvedValue(new Response("{}", { status: 503 })),
    };
    const failingBinding = {
      fetch: vi.fn().mockRejectedValue(new Error("timeout")),
    };

    await expect(checkFetchBindingHealth(okBinding)).resolves.toBe("ok");
    await expect(checkFetchBindingHealth(nonOkBinding)).resolves.toBe("degraded");
    await expect(checkFetchBindingHealth(failingBinding)).resolves.toBe("degraded");
    expect(okBinding.fetch).toHaveBeenCalledWith(
      expect.any(Request),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("clears the timeout when fetch throws", async () => {
    vi.useFakeTimers();
    const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");
    const binding = {
      fetch: vi.fn().mockRejectedValue(new Error("boom")),
    };

    await expect(checkFetchBindingHealth(binding, { timeoutMs: 25 })).resolves.toBe("degraded");
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it("builds shallow and deep payloads with the right overall status", () => {
    const shallow = buildHealthPayload({
      r2: "ok",
      d1: "degraded",
      timestamp: "2026-03-09T00:00:00.000Z",
    });
    const deep = buildHealthPayload({
      r2: "ok",
      d1: "ok",
      authMcp: "ok",
      mcpService: "degraded",
      timestamp: "2026-03-09T00:00:01.000Z",
    });

    expect(shallow).toEqual({
      status: "degraded",
      r2: "ok",
      d1: "degraded",
      timestamp: "2026-03-09T00:00:00.000Z",
    });
    expect(deep).toEqual({
      status: "degraded",
      r2: "ok",
      d1: "ok",
      authMcp: "ok",
      mcpService: "degraded",
      timestamp: "2026-03-09T00:00:01.000Z",
    });
  });

  it("derives the overall status and http status code", () => {
    expect(getOverallHealthStatus(["ok", "ok"])).toBe("ok");
    expect(getOverallHealthStatus(["ok", "degraded"])).toBe("degraded");
    expect(getHealthHttpStatus({ status: "ok" })).toBe(200);
    expect(getHealthHttpStatus({ status: "degraded" })).toBe(503);
  });
});
