import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

async function renderWelcomeModal(props?: { userName?: string | null }) {
  const { WelcomeModal } = await import("../WelcomeModal");
  return render(<WelcomeModal {...props} />);
}

describe("WelcomeModal", () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.style.overflow = "";
    document.documentElement.style.overflow = "";
    vi.restoreAllMocks();
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(new Response(null, { status: 204 }))),
    );
  });

  it("shows modal when not previously shown", async () => {
    await renderWelcomeModal();
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("does not show modal when already shown", async () => {
    localStorage.setItem("spike_onboarding_shown", "1");
    await renderWelcomeModal();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("locks document scrolling while open", async () => {
    await renderWelcomeModal();

    await screen.findByRole("dialog");

    expect(document.body.style.overflow).toBe("hidden");
    expect(document.documentElement.style.overflow).toBe("hidden");
  });

  it("restores document scrolling after dismiss", async () => {
    document.body.style.overflow = "auto";
    document.documentElement.style.overflow = "clip";

    await renderWelcomeModal();
    await screen.findByRole("dialog");

    fireEvent.click(screen.getByText("Skip intro"));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    expect(document.body.style.overflow).toBe("auto");
    expect(document.documentElement.style.overflow).toBe("clip");
  });

  it("restores document scrolling on unmount", async () => {
    document.body.style.overflow = "scroll";
    document.documentElement.style.overflow = "auto";

    const { unmount } = await renderWelcomeModal();
    await screen.findByRole("dialog");

    unmount();

    expect(document.body.style.overflow).toBe("scroll");
    expect(document.documentElement.style.overflow).toBe("auto");
  });

  it("shows welcome message with userName when provided", async () => {
    await renderWelcomeModal({ userName: "Alice" });
    expect(await screen.findByText("Welcome, Alice!")).toBeInTheDocument();
  });

  it("shows generic welcome when no userName", async () => {
    await renderWelcomeModal();
    expect(await screen.findByText("Welcome!")).toBeInTheDocument();
  });

  it("closes on Skip intro click and saves to localStorage", async () => {
    await renderWelcomeModal();
    await screen.findByRole("dialog");

    fireEvent.click(screen.getByText("Skip intro"));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    expect(localStorage.getItem("spike_onboarding_shown")).toBe("1");
  });

  it("closes on X button click", async () => {
    await renderWelcomeModal();
    await screen.findByRole("dialog");

    fireEvent.click(screen.getByLabelText("Close"));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("navigates to step 1 on Get started click", async () => {
    await renderWelcomeModal();
    await screen.findByText("Get started");

    fireEvent.click(screen.getByText("Get started"));

    expect(screen.getByText("What's your focus?")).toBeInTheDocument();
  });

  it("navigates back to step 0 on Back click", async () => {
    await renderWelcomeModal();
    await screen.findByText("Get started");

    fireEvent.click(screen.getByText("Get started"));
    fireEvent.click(screen.getByText("Back"));

    expect(screen.getByText("Welcome!")).toBeInTheDocument();
  });

  it("navigates to step 2 on Next click", async () => {
    await renderWelcomeModal();
    await screen.findByText("Get started");

    fireEvent.click(screen.getByText("Get started"));
    fireEvent.click(screen.getByText("Next"));

    expect(screen.getByText("Top tools for you")).toBeInTheDocument();
  });

  it("toggles interest selection on step 1", async () => {
    await renderWelcomeModal();
    await screen.findByText("Get started");

    fireEvent.click(screen.getByText("Get started"));

    const button = screen.getByRole("button", { name: /AI Chat & Assistants/i });
    expect(button.className).not.toContain("bg-primary/5");

    fireEvent.click(button);
    expect(button.className).toContain("bg-primary/5");

    fireEvent.click(button);
    expect(button.className).not.toContain("bg-primary/5");
  });

  it("shows selected interest tools on step 2", async () => {
    await renderWelcomeModal();
    await screen.findByText("Get started");

    fireEvent.click(screen.getByText("Get started"));
    fireEvent.click(screen.getByRole("button", { name: /AI Chat & Assistants/i }));
    fireEvent.click(screen.getByText("Next"));

    expect(screen.getByText("claude-chat")).toBeInTheDocument();
  });

  it("shows default tools on step 2 when no interests selected", async () => {
    await renderWelcomeModal();
    await screen.findByText("Get started");

    fireEvent.click(screen.getByText("Get started"));
    fireEvent.click(screen.getByText("Next"));

    expect(screen.getByText("spike-land-mcp")).toBeInTheDocument();
  });

  it("closes on Start exploring click from step 2", async () => {
    await renderWelcomeModal();
    await screen.findByText("Get started");

    fireEvent.click(screen.getByText("Get started"));
    fireEvent.click(screen.getByText("Next"));
    fireEvent.click(screen.getByText("Start exploring"));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("shows step indicators", async () => {
    const { container } = await renderWelcomeModal();
    await screen.findByRole("dialog");

    const indicators = container.querySelectorAll('[role="progressbar"] > div');
    expect(indicators).toHaveLength(3);
  });
});
