import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { CookieConsent } from "@/components/CookieConsent";

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-router")>();
  return {
    ...actual,
    Link: ({ children, to, className }: { children: React.ReactNode; to: string; className?: string }) => (
      <a href={to} className={className}>{children}</a>
    ),
  };
});

describe("CookieConsent", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function renderAndReveal() {
    render(<CookieConsent />);
    await act(async () => {
      vi.advanceTimersByTime(100);
    });
  }

  it("renders consent dialog when no prior consent", async () => {
    await renderAndReveal();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("does not render when consent is already accepted", async () => {
    localStorage.setItem("cookie_consent", "accepted");
    render(<CookieConsent />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("does not render when consent is already rejected", async () => {
    localStorage.setItem("cookie_consent", "rejected");
    render(<CookieConsent />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders cookie consent title", async () => {
    await renderAndReveal();
    expect(screen.getByText("Cookie Preferences")).toBeInTheDocument();
  });

  it("shows accept and reject buttons", async () => {
    await renderAndReveal();
    expect(screen.getByText("Accept All")).toBeInTheDocument();
    expect(screen.getByText("Reject Non-Essential")).toBeInTheDocument();
  });

  it("clicking Accept All hides the dialog", async () => {
    await renderAndReveal();
    fireEvent.click(screen.getByText("Accept All"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(localStorage.getItem("cookie_consent")).toBe("accepted");
  });

  it("clicking Reject Non-Essential hides the dialog", async () => {
    await renderAndReveal();
    fireEvent.click(screen.getByText("Reject Non-Essential"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(localStorage.getItem("cookie_consent")).toBe("rejected");
  });

  it("has Learn more link pointing to /privacy", async () => {
    await renderAndReveal();
    const link = screen.getByText("Learn more").closest("a");
    expect(link).toHaveAttribute("href", "/privacy");
  });

  it("dialog starts invisible then becomes visible after 50ms delay", async () => {
    const { container } = render(<CookieConsent />);
    // Before delay fires
    const dialogBefore = container.querySelector("[role='dialog']");
    expect(dialogBefore).toHaveStyle({ opacity: "0" });

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    const dialogAfter = container.querySelector("[role='dialog']");
    expect(dialogAfter).toHaveStyle({ opacity: "1" });
  });
});
