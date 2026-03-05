import { describe, expect, it, vi, afterEach } from "vitest";
import { debounce } from "@/lib/debounce";
import { throttle } from "@/lib/throttle";

describe("debounce", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls fn after delay", async () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 100);
    debounced("a");
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledWith("a");
  });

  it("only calls fn once for rapid calls", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 100);
    debounced("a");
    debounced("b");
    debounced("c");
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("c");
  });

  it("cancel prevents fn from being called", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 100);
    debounced("a");
    debounced.cancel();
    vi.advanceTimersByTime(100);
    expect(fn).not.toHaveBeenCalled();
  });

  it("cancel is safe when no pending call", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 100);
    expect(() => debounced.cancel()).not.toThrow();
  });

  it("flush calls fn immediately", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 100);
    debounced("a");
    debounced.flush();
    expect(fn).toHaveBeenCalledWith("a");
  });

  it("flush is a no-op when no pending call", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 100);
    debounced.flush();
    expect(fn).not.toHaveBeenCalled();
  });

  it("schedule reschedules the timer", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 100);
    debounced("a");
    debounced.schedule();
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("respects leading edge option", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 100, { edges: ["leading"] });
    debounced("first");
    expect(fn).toHaveBeenCalledWith("first");
    debounced("second");
    vi.advanceTimersByTime(100);
    // trailing=false, so second call should not happen
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("respects leading + trailing edges", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 100, { edges: ["leading", "trailing"] });
    debounced("first");
    expect(fn).toHaveBeenCalledWith("first");
    debounced("second");
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("aborts on signal abort", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const controller = new AbortController();
    const debounced = debounce(fn, 100, { signal: controller.signal });
    controller.abort();
    debounced("a");
    vi.advanceTimersByTime(100);
    expect(fn).not.toHaveBeenCalled();
  });

  it("abortSignal cancel clears pending args", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const controller = new AbortController();
    const debounced = debounce(fn, 100, { signal: controller.signal });
    debounced("a");
    controller.abort();
    vi.advanceTimersByTime(100);
    expect(fn).not.toHaveBeenCalled();
  });
});

describe("throttle", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls fn on first invocation", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const throttled = throttle(fn, 100);
    throttled("a");
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalled();
  });

  it("cancel is available", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const throttled = throttle(fn, 100);
    throttled("a");
    expect(() => throttled.cancel()).not.toThrow();
  });

  it("flush is available", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const throttled = throttle(fn, 100);
    throttled("a");
    expect(() => throttled.flush()).not.toThrow();
  });

  it("schedule is a no-op", () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);
    expect(() => throttled.schedule()).not.toThrow();
  });

  it("calls fn when interval has passed between calls", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const throttled = throttle(fn, 50);
    throttled("first");
    vi.advanceTimersByTime(60); // > 50ms
    throttled("second");
    vi.advanceTimersByTime(60);
    // Both calls should have gone through
    expect(fn).toHaveBeenCalled();
  });

  it("works with undefined throttleMs (defaults to 0)", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const throttled = throttle(fn, undefined);
    throttled("a");
    vi.advanceTimersByTime(0);
    expect(fn).toHaveBeenCalled();
  });
});
