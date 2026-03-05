import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BadgeDisplay } from "@/components/quiz/BadgeDisplay";

describe("BadgeDisplay", () => {
  beforeEach(() => {
    Object.defineProperty(window, "location", {
      writable: true,
      value: { origin: "https://spike.land" },
    });
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  const defaultProps = {
    token: "abc123",
    topic: "TypeScript Basics",
    score: 85,
    completedAt: "2025-06-15T00:00:00Z",
  };

  it("renders the topic name", () => {
    render(<BadgeDisplay {...defaultProps} />);
    expect(screen.getByText("TypeScript Basics")).toBeInTheDocument();
  });

  it("renders the score percentage", () => {
    render(<BadgeDisplay {...defaultProps} />);
    expect(screen.getByText("85%")).toBeInTheDocument();
  });

  it("shows Excellent label for score >= 80", () => {
    render(<BadgeDisplay {...defaultProps} score={80} />);
    expect(screen.getByText("Excellent")).toBeInTheDocument();
  });

  it("shows Good label for score >= 60 < 80", () => {
    render(<BadgeDisplay {...defaultProps} score={65} />);
    expect(screen.getByText("Good")).toBeInTheDocument();
  });

  it("shows Passing label for score < 60", () => {
    render(<BadgeDisplay {...defaultProps} score={55} />);
    expect(screen.getByText("Passing")).toBeInTheDocument();
  });

  it("shows badge URL in the input", () => {
    render(<BadgeDisplay {...defaultProps} />);
    const input = screen.getByDisplayValue("https://spike.land/learn/badge/abc123");
    expect(input).toBeInTheDocument();
  });

  it("shows completed date formatted", () => {
    render(<BadgeDisplay {...defaultProps} />);
    const date = new Date("2025-06-15T00:00:00Z").toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    expect(screen.getByText(new RegExp(date))).toBeInTheDocument();
  });

  it("copies URL to clipboard on Copy click", async () => {
    render(<BadgeDisplay {...defaultProps} />);
    fireEvent.click(screen.getByText("Copy"));
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        "https://spike.land/learn/badge/abc123"
      );
    });
  });

  it("shows Copied! feedback after successful copy", async () => {
    render(<BadgeDisplay {...defaultProps} />);
    fireEvent.click(screen.getByText("Copy"));
    await waitFor(() => {
      expect(screen.getByText("Copied!")).toBeInTheDocument();
    });
  });

  it("uses fallback document.execCommand when clipboard API fails", async () => {
    // Make writeText reject to trigger fallback path
    Object.defineProperty(navigator, "clipboard", {
      writable: true,
      value: {
        writeText: vi.fn().mockRejectedValue(new Error("Not supported")),
      },
    });

    // jsdom doesn't define execCommand — define it manually
    const execCommandMock = vi.fn().mockReturnValue(true);
    Object.defineProperty(document, "execCommand", {
      writable: true,
      value: execCommandMock,
    });

    render(<BadgeDisplay {...defaultProps} />);
    fireEvent.click(screen.getByText("Copy"));

    await waitFor(() => {
      expect(execCommandMock).toHaveBeenCalledWith("copy");
    });
  });

  it("shows graduation emoji", () => {
    render(<BadgeDisplay {...defaultProps} />);
    expect(screen.getByText("🎓")).toBeInTheDocument();
  });
});
