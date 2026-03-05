import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { VersionHistory } from "@/components/VersionHistory";

const versions = [
  { version: 1, changeDescription: "Initial release", author: "Alice", timestamp: "2025-01-01T00:00:00Z" },
  { version: 3, changeDescription: "Added dark mode", author: "Bob", timestamp: "2025-03-01T00:00:00Z" },
  { version: 2, changeDescription: "Bug fixes", timestamp: "2025-02-01T00:00:00Z" },
];

describe("VersionHistory", () => {
  it("shows 'No versions yet' when empty", () => {
    render(<VersionHistory versions={[]} />);
    expect(screen.getByText("No versions yet.")).toBeInTheDocument();
  });

  it("renders all versions", () => {
    render(<VersionHistory versions={versions} />);
    expect(screen.getByText("Initial release")).toBeInTheDocument();
    expect(screen.getByText("Added dark mode")).toBeInTheDocument();
    expect(screen.getByText("Bug fixes")).toBeInTheDocument();
  });

  it("sorts versions descending (latest first)", () => {
    const { container } = render(<VersionHistory versions={versions} />);
    const vLabels = container.querySelectorAll("span.font-bold");
    // First shown should be v3
    expect(vLabels[0].textContent).toBe("v3");
  });

  it("shows Current badge for latest version", () => {
    render(<VersionHistory versions={versions} />);
    expect(screen.getByText("Current")).toBeInTheDocument();
  });

  it("does not show Current badge for older versions", () => {
    render(<VersionHistory versions={versions} />);
    // Only one "Current" badge should exist
    expect(screen.getAllByText("Current")).toHaveLength(1);
  });

  it("shows author when provided", () => {
    render(<VersionHistory versions={versions} />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("does not crash when author is missing", () => {
    render(<VersionHistory versions={[
      { version: 1, changeDescription: "No author", timestamp: "2025-01-01T00:00:00Z" },
    ]} />);
    expect(screen.getByText("No author")).toBeInTheDocument();
  });

  it("renders formatted timestamp", () => {
    render(<VersionHistory versions={[
      { version: 1, changeDescription: "Release", timestamp: "2025-06-15T10:30:00Z" },
    ]} />);
    // Just verify something date-like is present; locale-dependent
    const dateText = new Date("2025-06-15T10:30:00Z").toLocaleString();
    expect(screen.getByText(dateText)).toBeInTheDocument();
  });
});
