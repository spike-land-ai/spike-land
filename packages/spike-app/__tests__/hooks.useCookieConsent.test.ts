import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCookieConsent } from "@/hooks/useCookieConsent";

describe("useCookieConsent", () => {
  beforeEach(() => {
    localStorage.clear();
    document.cookie = "";
  });

  it("returns null consentGiven when no stored value", () => {
    const { result } = renderHook(() => useCookieConsent());
    expect(result.current.consentGiven).toBeNull();
  });

  it("returns true when localStorage has 'accepted'", () => {
    localStorage.setItem("cookie_consent", "accepted");
    const { result } = renderHook(() => useCookieConsent());
    expect(result.current.consentGiven).toBe(true);
  });

  it("returns false when localStorage has 'rejected'", () => {
    localStorage.setItem("cookie_consent", "rejected");
    const { result } = renderHook(() => useCookieConsent());
    expect(result.current.consentGiven).toBe(false);
  });

  it("accept() sets consentGiven to true and persists to localStorage", async () => {
    const { result } = renderHook(() => useCookieConsent());
    expect(result.current.consentGiven).toBeNull();

    await act(async () => {
      result.current.accept();
    });

    expect(result.current.consentGiven).toBe(true);
    expect(localStorage.getItem("cookie_consent")).toBe("accepted");
  });

  it("reject() sets consentGiven to false and persists to localStorage", async () => {
    const { result } = renderHook(() => useCookieConsent());

    await act(async () => {
      result.current.reject();
    });

    expect(result.current.consentGiven).toBe(false);
    expect(localStorage.getItem("cookie_consent")).toBe("rejected");
  });

  it("accept() after reject() updates consent to true", async () => {
    const { result } = renderHook(() => useCookieConsent());

    await act(async () => {
      result.current.reject();
    });
    expect(result.current.consentGiven).toBe(false);

    await act(async () => {
      result.current.accept();
    });
    expect(result.current.consentGiven).toBe(true);
  });
});
