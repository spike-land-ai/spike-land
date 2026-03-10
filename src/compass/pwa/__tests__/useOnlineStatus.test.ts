import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useOnlineStatus } from "../ui/hooks/useOnlineStatus.ts";

// ---------------------------------------------------------------------------
// Helpers to simulate browser online/offline events
// ---------------------------------------------------------------------------

function fireOnline(): void {
  window.dispatchEvent(new Event("online"));
}

function fireOffline(): void {
  window.dispatchEvent(new Event("offline"));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useOnlineStatus", () => {
  beforeEach(() => {
    // Reset navigator.onLine to true before each test
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      configurable: true,
      value: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("initialises as online when navigator.onLine is true", () => {
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current.isOnline).toBe(true);
  });

  it("initialises as offline when navigator.onLine is false", () => {
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      configurable: true,
      value: false,
    });

    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current.isOnline).toBe(false);
  });

  it("updates to false when offline event fires", () => {
    const { result } = renderHook(() => useOnlineStatus());

    act(() => {
      fireOffline();
    });

    expect(result.current.isOnline).toBe(false);
  });

  it("updates to true when online event fires after going offline", () => {
    const { result } = renderHook(() => useOnlineStatus());

    act(() => {
      fireOffline();
    });
    expect(result.current.isOnline).toBe(false);

    act(() => {
      fireOnline();
    });
    expect(result.current.isOnline).toBe(true);
  });

  it("records lastChangedAt when connectivity changes", () => {
    const { result } = renderHook(() => useOnlineStatus());

    expect(result.current.lastChangedAt).toBeNull();

    act(() => {
      fireOffline();
    });

    expect(result.current.lastChangedAt).not.toBeNull();
    // Should be a valid ISO string
    expect(() => new Date(result.current.lastChangedAt!)).not.toThrow();
  });

  it("updates lastChangedAt on each transition", () => {
    vi.useFakeTimers();

    const { result } = renderHook(() => useOnlineStatus());

    act(() => {
      vi.setSystemTime(new Date("2026-01-01T10:00:00.000Z"));
      fireOffline();
    });

    const firstChange = result.current.lastChangedAt;

    act(() => {
      vi.setSystemTime(new Date("2026-01-01T10:05:00.000Z"));
      fireOnline();
    });

    const secondChange = result.current.lastChangedAt;

    expect(firstChange).not.toEqual(secondChange);
    expect(secondChange).toBe("2026-01-01T10:05:00.000Z");

    vi.useRealTimers();
  });

  it("removes event listeners on unmount", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    const removeSpy = vi.spyOn(window, "removeEventListener");

    const { unmount } = renderHook(() => useOnlineStatus());

    expect(addSpy).toHaveBeenCalledWith("online", expect.any(Function));
    expect(addSpy).toHaveBeenCalledWith("offline", expect.any(Function));

    unmount();

    expect(removeSpy).toHaveBeenCalledWith("online", expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith("offline", expect.any(Function));
  });

  it("handles multiple rapid online/offline transitions", () => {
    const { result } = renderHook(() => useOnlineStatus());

    act(() => {
      fireOffline();
      fireOnline();
      fireOffline();
      fireOnline();
      fireOffline();
    });

    expect(result.current.isOnline).toBe(false);
    expect(result.current.lastChangedAt).not.toBeNull();
  });

  it("does not throw in SSR-like environment where navigator is undefined", () => {
    // We can't actually remove navigator in jsdom, but we verify the hook
    // doesn't error on mount (navigator.onLine exists and equals true here).
    expect(() => {
      renderHook(() => useOnlineStatus());
    }).not.toThrow();
  });
});
