import { describe, expect, it, vi } from "vitest";
import { wait } from "@/lib/wait";

describe("wait", () => {
  it("resolves after the specified delay", async () => {
    vi.useFakeTimers();
    const promise = wait(100);
    vi.advanceTimersByTime(100);
    const result = await promise;
    expect(result).toBe(100);
    vi.useRealTimers();
  });

  it("resolves with the delay value", async () => {
    vi.useFakeTimers();
    const promise = wait(500);
    vi.advanceTimersByTime(500);
    const result = await promise;
    expect(result).toBe(500);
    vi.useRealTimers();
  });

  it("resolves with 0 for zero delay", async () => {
    vi.useFakeTimers();
    const promise = wait(0);
    vi.advanceTimersByTime(0);
    const result = await promise;
    expect(result).toBe(0);
    vi.useRealTimers();
  });
});
