import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { WelcomeModal } from "@/components/WelcomeModal";

describe("WelcomeModal", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows modal when not previously shown", () => {
    render(<WelcomeModal />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("does not show modal when already shown", () => {
    localStorage.setItem("spike_welcome_shown", "1");
    render(<WelcomeModal />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows welcome message with userName when provided", () => {
    render(<WelcomeModal userName="Alice" />);
    expect(screen.getByText("Welcome, Alice!")).toBeInTheDocument();
  });

  it("shows generic welcome when no userName", () => {
    render(<WelcomeModal />);
    expect(screen.getByText("Welcome!")).toBeInTheDocument();
  });

  it("closes on Skip click and saves to localStorage", () => {
    render(<WelcomeModal />);
    fireEvent.click(screen.getByText("Skip"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(localStorage.getItem("spike_welcome_shown")).toBe("1");
  });

  it("closes on X button click", () => {
    render(<WelcomeModal />);
    fireEvent.click(screen.getByLabelText("Close"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("navigates to step 1 on Get started click", () => {
    render(<WelcomeModal />);
    fireEvent.click(screen.getByText("Get started"));
    expect(screen.getByText("What are you building?")).toBeInTheDocument();
  });

  it("navigates back to step 0 on Back click", () => {
    render(<WelcomeModal />);
    fireEvent.click(screen.getByText("Get started"));
    fireEvent.click(screen.getByText("Back"));
    expect(screen.getByText(/Welcome/)).toBeInTheDocument();
  });

  it("navigates to step 2 on Next click", () => {
    render(<WelcomeModal />);
    fireEvent.click(screen.getByText("Get started"));
    fireEvent.click(screen.getByText("Next"));
    expect(screen.getByText("Suggested tools for you")).toBeInTheDocument();
  });

  it("toggles interest selection on step 1", () => {
    render(<WelcomeModal />);
    fireEvent.click(screen.getByText("Get started"));

    const btn = screen.getByText("AI Chat & Assistants");
    // Initially not selected — hover classes present but not active selection
    expect(btn.className).not.toContain("bg-primary/10");

    fireEvent.click(btn);
    // After clicking, active styles applied
    expect(btn.className).toContain("bg-primary/10");

    // Toggle off
    fireEvent.click(btn);
    expect(btn.className).not.toContain("bg-primary/10");
  });

  it("shows selected interest tools on step 2", () => {
    render(<WelcomeModal />);
    fireEvent.click(screen.getByText("Get started"));
    fireEvent.click(screen.getByText("AI Chat & Assistants"));
    fireEvent.click(screen.getByText("Next"));

    expect(screen.getByText("claude-chat")).toBeInTheDocument();
  });

  it("shows default tools on step 2 when no interests selected", () => {
    render(<WelcomeModal />);
    fireEvent.click(screen.getByText("Get started"));
    fireEvent.click(screen.getByText("Next"));

    // Default popular tools shown
    expect(screen.getByText("spike-land-mcp")).toBeInTheDocument();
  });

  it("closes on Start exploring click from step 2", () => {
    render(<WelcomeModal />);
    fireEvent.click(screen.getByText("Get started"));
    fireEvent.click(screen.getByText("Next"));
    fireEvent.click(screen.getByText("Start exploring"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows step indicators (3 dots)", () => {
    const { container } = render(<WelcomeModal />);
    const dots = container.querySelectorAll(".h-2.w-8.rounded-full");
    expect(dots).toHaveLength(3);
  });
});
