import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "@/components/StatusBadge";
import type { AppStatus } from "@/components/StatusBadge";

describe("StatusBadge", () => {
  const statuses: AppStatus[] = ["prompting", "drafting", "building", "live", "archived", "deleted"];

  it.each(statuses)("renders status text for %s", (status) => {
    render(<StatusBadge status={status} />);
    expect(screen.getByText(status)).toBeInTheDocument();
  });

  it("applies success color class for live status", () => {
    const { container } = render(<StatusBadge status="live" />);
    expect(container.firstChild).toHaveClass("bg-success");
  });

  it("applies destructive color class for deleted status", () => {
    const { container } = render(<StatusBadge status="deleted" />);
    expect(container.firstChild).toHaveClass("bg-destructive");
  });

  it("applies muted color class for archived status", () => {
    const { container } = render(<StatusBadge status="archived" />);
    expect(container.firstChild).toHaveClass("bg-muted");
  });

  it("renders icon character for live status (bullet)", () => {
    const { container } = render(<StatusBadge status="live" />);
    expect(container.textContent).toContain("\u25CF");
  });

  it("renders icon character for deleted status (x)", () => {
    const { container } = render(<StatusBadge status="deleted" />);
    expect(container.textContent).toContain("\u2715");
  });
});
