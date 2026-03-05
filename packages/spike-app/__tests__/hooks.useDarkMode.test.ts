import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDarkMode } from "@/hooks/useDarkMode";

describe("useDarkMode", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark", "light");
    // Reset matchMedia to return light mode by default
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });
  });

  it("defaults to system theme when no preference stored", () => {
    const { result } = renderHook(() => useDarkMode());
    expect(result.current.theme).toBe("system");
  });

  it("loads stored dark preference", () => {
    localStorage.setItem("theme-preference", "dark");
    const { result } = renderHook(() => useDarkMode());
    expect(result.current.theme).toBe("dark");
    expect(result.current.isDarkMode).toBe(true);
  });

  it("loads stored light preference", () => {
    localStorage.setItem("theme-preference", "light");
    const { result } = renderHook(() => useDarkMode());
    expect(result.current.theme).toBe("light");
    expect(result.current.isDarkMode).toBe(false);
  });

  it("setTheme('dark') updates state and localStorage", async () => {
    const { result } = renderHook(() => useDarkMode());

    await act(async () => {
      result.current.setTheme("dark");
    });

    expect(result.current.theme).toBe("dark");
    expect(result.current.isDarkMode).toBe(true);
    expect(localStorage.getItem("theme-preference")).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("setTheme('light') updates state and removes dark class", async () => {
    localStorage.setItem("theme-preference", "dark");
    const { result } = renderHook(() => useDarkMode());

    await act(async () => {
      result.current.setTheme("light");
    });

    expect(result.current.theme).toBe("light");
    expect(result.current.isDarkMode).toBe(false);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(document.documentElement.classList.contains("light")).toBe(true);
  });

  it("setTheme('system') follows OS when OS is light", async () => {
    const { result } = renderHook(() => useDarkMode());

    await act(async () => {
      result.current.setTheme("system");
    });

    expect(result.current.theme).toBe("system");
    // matchMedia returns false (light mode)
    expect(result.current.isDarkMode).toBe(false);
  });

  it("system theme follows OS dark mode", async () => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: string) => ({
        matches: query.includes("dark"),
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });

    const { result } = renderHook(() => useDarkMode());
    expect(result.current.isDarkMode).toBe(true);
  });

  it("listens to OS media query changes when theme is system", async () => {
    let capturedHandler: (() => void) | null = null;
    // mq object whose .matches can be mutated before handler fires
    const mqObject = {
      matches: false,
      media: "(prefers-color-scheme: dark)",
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: (_event: string, handler: () => void) => {
        capturedHandler = handler;
      },
      removeEventListener: () => {
        capturedHandler = null;
      },
      dispatchEvent: () => false,
    };

    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: () => mqObject,
    });

    const { result } = renderHook(() => useDarkMode());
    expect(result.current.isDarkMode).toBe(false);
    expect(capturedHandler).not.toBeNull();

    // Mutate matches then fire handler — hook reads mq.matches
    mqObject.matches = true;
    await act(async () => {
      capturedHandler!();
    });

    expect(result.current.isDarkMode).toBe(true);
  });
});
