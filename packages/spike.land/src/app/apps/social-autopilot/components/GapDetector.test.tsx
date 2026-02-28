import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { GapDetector } from "./GapDetector";

function futureDateStr(daysOffset: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split("T")[0]!;
}

describe("GapDetector", () => {
  it("shows loading skeleton when isLoading is true", () => {
    const { container } = render(
      <GapDetector gapDays={[]} daysAhead={7} onFillGap={vi.fn()} isLoading={true} />,
    );
    expect(container.querySelector(".animate-pulse")).not.toBeNull();
  });

  it("shows 'All days covered' when no gaps", () => {
    render(
      <GapDetector gapDays={[]} daysAhead={7} onFillGap={vi.fn()} isLoading={false} />,
    );
    expect(screen.getByText(/All days covered/)).toBeInTheDocument();
  });

  it("shows 'Calendar is full' message when no gaps", () => {
    render(
      <GapDetector gapDays={[]} daysAhead={7} onFillGap={vi.fn()} isLoading={false} />,
    );
    expect(screen.getByText("Calendar is full")).toBeInTheDocument();
  });

  it("shows gap count in header when gaps exist", () => {
    const gaps = [futureDateStr(2), futureDateStr(5)];
    render(
      <GapDetector gapDays={gaps} daysAhead={7} onFillGap={vi.fn()} isLoading={false} />,
    );
    expect(screen.getByText(/2 gaps found/)).toBeInTheDocument();
  });

  it("uses singular 'gap' for exactly 1 gap", () => {
    const gaps = [futureDateStr(4)];
    render(
      <GapDetector gapDays={gaps} daysAhead={7} onFillGap={vi.fn()} isLoading={false} />,
    );
    expect(screen.getByText(/1 gap found/)).toBeInTheDocument();
  });

  it("renders a Fill button for each gap day", () => {
    const gaps = [futureDateStr(2), futureDateStr(5), futureDateStr(6)];
    render(
      <GapDetector gapDays={gaps} daysAhead={7} onFillGap={vi.fn()} isLoading={false} />,
    );
    expect(screen.getAllByRole("button", { name: /fill/i })).toHaveLength(3);
  });

  it("calls onFillGap with the correct dateStr when Fill is clicked", () => {
    const onFillGap = vi.fn();
    const dateStr = futureDateStr(4);
    render(
      <GapDetector gapDays={[dateStr]} daysAhead={7} onFillGap={onFillGap} isLoading={false} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /fill/i }));
    expect(onFillGap).toHaveBeenCalledWith(dateStr);
  });

  it("shows urgent count badge for gaps 0-1 days ahead", () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0]!;
    render(
      <GapDetector gapDays={[todayStr]} daysAhead={7} onFillGap={vi.fn()} isLoading={false} />,
    );
    expect(screen.getByText(/urgent/)).toBeInTheDocument();
  });

  it("shows warning count badge for gaps 2-3 days ahead", () => {
    const gaps = [futureDateStr(2), futureDateStr(3)];
    render(
      <GapDetector gapDays={gaps} daysAhead={7} onFillGap={vi.fn()} isLoading={false} />,
    );
    expect(screen.getByText(/soon/)).toBeInTheDocument();
  });

  it("renders the daysAhead count in the description", () => {
    render(
      <GapDetector gapDays={[]} daysAhead={14} onFillGap={vi.fn()} isLoading={false} />,
    );
    expect(screen.getByText(/Next 14 days/)).toBeInTheDocument();
  });

  it("does not show loading skeleton when not loading", () => {
    const { container } = render(
      <GapDetector gapDays={[]} daysAhead={7} onFillGap={vi.fn()} isLoading={false} />,
    );
    expect(container.querySelector(".animate-pulse")).toBeNull();
  });
});
