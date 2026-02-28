import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { type CalendarPost, CalendarView } from "./CalendarView";

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

function makeDateRelative(daysOffset: number, hour = 10): Date {
  const d = new Date(TODAY);
  d.setDate(d.getDate() + daysOffset);
  d.setHours(hour, 0, 0, 0);
  return d;
}

describe("CalendarView", () => {
  it("renders the month label", () => {
    const onDateSelect = vi.fn();
    const onMonthChange = vi.fn();
    render(
      <CalendarView
        posts={[]}
        gapDays={[]}
        currentDate={TODAY}
        selectedDate={null}
        onDateSelect={onDateSelect}
        onMonthChange={onMonthChange}
      />,
    );
    const expected = TODAY.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it("renders 7 day-of-week headers", () => {
    const onDateSelect = vi.fn();
    const onMonthChange = vi.fn();
    render(
      <CalendarView
        posts={[]}
        gapDays={[]}
        currentDate={TODAY}
        selectedDate={null}
        onDateSelect={onDateSelect}
        onMonthChange={onMonthChange}
      />,
    );
    for (const day of ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]) {
      expect(screen.getByText(day)).toBeInTheDocument();
    }
  });

  it("calls onMonthChange('prev') when previous button clicked", () => {
    const onDateSelect = vi.fn();
    const onMonthChange = vi.fn();
    render(
      <CalendarView
        posts={[]}
        gapDays={[]}
        currentDate={TODAY}
        selectedDate={null}
        onDateSelect={onDateSelect}
        onMonthChange={onMonthChange}
      />,
    );
    const buttons = screen.getAllByRole("button");
    // prev button is first of the nav pair
    fireEvent.click(buttons[0]!);
    expect(onMonthChange).toHaveBeenCalledWith("prev");
  });

  it("calls onMonthChange('next') when next button clicked", () => {
    const onDateSelect = vi.fn();
    const onMonthChange = vi.fn();
    render(
      <CalendarView
        posts={[]}
        gapDays={[]}
        currentDate={TODAY}
        selectedDate={null}
        onDateSelect={onDateSelect}
        onMonthChange={onMonthChange}
      />,
    );
    const buttons = screen.getAllByRole("button");
    // next button is second of the nav pair
    fireEvent.click(buttons[1]!);
    expect(onMonthChange).toHaveBeenCalledWith("next");
  });

  it("calls onDateSelect when a day cell is clicked", () => {
    const onDateSelect = vi.fn();
    const onMonthChange = vi.fn();
    render(
      <CalendarView
        posts={[]}
        gapDays={[]}
        currentDate={TODAY}
        selectedDate={null}
        onDateSelect={onDateSelect}
        onMonthChange={onMonthChange}
      />,
    );
    // click the first day number visible (all day cells are buttons)
    const dayCells = screen.getAllByRole("button").slice(2);
    fireEvent.click(dayCells[0]!);
    expect(onDateSelect).toHaveBeenCalled();
  });

  it("shows overflow badge when a day has more than 2 posts", () => {
    const onDateSelect = vi.fn();
    const onMonthChange = vi.fn();
    const manyPosts: CalendarPost[] = [
      {
        id: "a",
        content: "A",
        platform: "twitter",
        scheduledAt: makeDateRelative(0, 9),
        status: "SCHEDULED",
      },
      {
        id: "b",
        content: "B",
        platform: "instagram",
        scheduledAt: makeDateRelative(0, 11),
        status: "SCHEDULED",
      },
      {
        id: "c",
        content: "C",
        platform: "linkedin",
        scheduledAt: makeDateRelative(0, 13),
        status: "SCHEDULED",
      },
    ];
    render(
      <CalendarView
        posts={manyPosts}
        gapDays={[]}
        currentDate={TODAY}
        selectedDate={TODAY}
        onDateSelect={onDateSelect}
        onMonthChange={onMonthChange}
      />,
    );
    expect(screen.getByText("+1")).toBeInTheDocument();
  });

  it("highlights selected date with a distinct style", () => {
    const onDateSelect = vi.fn();
    const onMonthChange = vi.fn();
    const { container } = render(
      <CalendarView
        posts={[]}
        gapDays={[]}
        currentDate={TODAY}
        selectedDate={TODAY}
        onDateSelect={onDateSelect}
        onMonthChange={onMonthChange}
      />,
    );
    // selected day has ring class
    expect(container.querySelector(".ring-1")).not.toBeNull();
  });

  it("renders a gap indicator for gap days", () => {
    const onDateSelect = vi.fn();
    const onMonthChange = vi.fn();
    const gapDay = new Date(TODAY);
    // Use a date guaranteed to be within the current month
    gapDay.setDate(
      Math.min(
        gapDay.getDate() + 2,
        new Date(TODAY.getFullYear(), TODAY.getMonth() + 1, 0).getDate(),
      ),
    );
    const gapStr = gapDay.toISOString().split("T")[0]!;
    const { container } = render(
      <CalendarView
        posts={[]}
        gapDays={[gapStr]}
        currentDate={TODAY}
        selectedDate={null}
        onDateSelect={onDateSelect}
        onMonthChange={onMonthChange}
      />,
    );
    // gap day has red dot indicator
    expect(container.querySelector(".bg-red-500")).not.toBeNull();
  });
});
