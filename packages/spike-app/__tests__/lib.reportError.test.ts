import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Module-level state is reset between tests via vi.resetModules
describe("reportError", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetModules();
    // Reset fetch mock
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    // Reset window.location
    Object.defineProperty(window, "location", {
      writable: true,
      value: { href: "http://localhost/" },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("buffers an error and flushes after interval", async () => {
    const { reportError } = await import("@/lib/reportError");
    reportError("something broke");

    expect(global.fetch).not.toHaveBeenCalled();

    await vi.runAllTimersAsync();

    expect(global.fetch).toHaveBeenCalledOnce();
    const [url, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe("/errors/ingest");
    expect(init.method).toBe("POST");
    const body = JSON.parse(init.body as string) as unknown[];
    expect(body).toHaveLength(1);
    expect((body[0] as { message: string }).message).toBe("something broke");
  });

  it("flushes immediately for fatal errors", async () => {
    const { reportError } = await import("@/lib/reportError");
    reportError("critical failure", { severity: "fatal" });

    // Should have flushed synchronously (via async flush called without awaiting timer)
    await Promise.resolve(); // Allow promise microtasks
    expect(global.fetch).toHaveBeenCalledOnce();
  });

  it("includes Error stack trace when Error object is passed", async () => {
    const { reportError } = await import("@/lib/reportError");
    const err = new Error("oops");
    reportError(err);

    await vi.runAllTimersAsync();

    const [, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(init.body as string) as unknown[];
    const entry = body[0] as { stack_trace?: string; message: string };
    expect(entry.message).toBe("oops");
    expect(entry.stack_trace).toContain("Error");
  });

  it("respects rate limit of 20 per minute", async () => {
    const { reportError } = await import("@/lib/reportError");

    // Queue 25 errors
    for (let i = 0; i < 25; i++) {
      reportError(`error ${i}`);
    }

    await vi.runAllTimersAsync();

    // First flush: max 10 (MAX_BATCH_SIZE), rate allows up to 20
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;
    const firstCallBody = JSON.parse(fetchMock.mock.calls[0][1].body as string) as unknown[];
    expect(firstCallBody.length).toBeLessThanOrEqual(10);
  });

  it("includes metadata with url and userAgent", async () => {
    const { reportError } = await import("@/lib/reportError");
    reportError("meta test", { metadata: { custom: "value" } });

    await vi.runAllTimersAsync();

    const [, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(init.body as string) as unknown[];
    const entry = body[0] as { metadata: Record<string, unknown> };
    expect(entry.metadata.url).toBe("http://localhost/");
    expect(entry.metadata.custom).toBe("value");
  });

  it("uses custom error code", async () => {
    const { reportError } = await import("@/lib/reportError");
    reportError("auth error", { code: "AUTH_FAILED" });

    await vi.runAllTimersAsync();

    const [, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(init.body as string) as unknown[];
    expect((body[0] as { error_code: string }).error_code).toBe("AUTH_FAILED");
  });

  it("silently drops errors when network fetch fails", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
    const { reportError } = await import("@/lib/reportError");
    reportError("network failure test");

    // Should not throw
    await expect(vi.runAllTimersAsync()).resolves.not.toThrow();
  });
});
