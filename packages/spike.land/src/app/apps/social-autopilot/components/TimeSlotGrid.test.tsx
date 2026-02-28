import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { TimeSlotGrid } from "./TimeSlotGrid";
import type { CalendarPost } from "./CalendarView";

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

const BEST_TIMES = [
  { day: "Monday", hour: 9, score: 95, reason: "High engagement morning window" },
  { day: "Wednesday", hour: 12, score: 88, reason: "Lunch break peak traffic" },
];

describe("TimeSlotGrid", () => {
  it("shows 'Select a date' label when no date is selected", () => {
    render(
      <TimeSlotGrid
        selectedDate={null}
        scheduledPosts={[]}
        bestTimes={[]}
        onTimeSlotSelect={vi.fn()}
      />,
    );
    expect(screen.getByText("Select a date")).toBeInTheDocument();
  });

  it("shows the formatted date label when a date is selected", () => {
    render(
      <TimeSlotGrid
        selectedDate={TODAY}
        scheduledPosts={[]}
        bestTimes={[]}
        onTimeSlotSelect={vi.fn()}
      />,
    );
    const expected = TODAY.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it("renders time slots for each hour in the HOURS array", () => {
    render(
      <TimeSlotGrid
        selectedDate={TODAY}
        scheduledPosts={[]}
        bestTimes={[]}
        onTimeSlotSelect={vi.fn()}
      />,
    );
    // HOURS = [6..21], check a few
    expect(screen.getByText("6 AM")).toBeInTheDocument();
    expect(screen.getByText("12 PM")).toBeInTheDocument();
    expect(screen.getByText("9 PM")).toBeInTheDocument();
  });

  it("calls onTimeSlotSelect when a non-past hour is clicked", () => {
    const onTimeSlotSelect = vi.fn();
    const tomorrow = new Date(TODAY);
    tomorrow.setDate(tomorrow.getDate() + 1);
    render(
      <TimeSlotGrid
        selectedDate={tomorrow}
        scheduledPosts={[]}
        bestTimes={[]}
        onTimeSlotSelect={onTimeSlotSelect}
      />,
    );
    // Click "9 AM" slot
    fireEvent.click(screen.getByText("9 AM").closest("button")!);
    expect(onTimeSlotSelect).toHaveBeenCalledWith(9);
  });

  it("shows 'Best' badge for best time slots with no posts", () => {
    const tomorrow = new Date(TODAY);
    tomorrow.setDate(tomorrow.getDate() + 1);
    render(
      <TimeSlotGrid
        selectedDate={tomorrow}
        scheduledPosts={[]}
        bestTimes={BEST_TIMES}
        onTimeSlotSelect={vi.fn()}
      />,
    );
    // 2 best-time slots with no posts → 2 "Best" badges
    expect(screen.getAllByText("Best")).toHaveLength(2);
  });

  it("does not show 'Best' badge when the best-time slot already has a post", () => {
    const tomorrow = new Date(TODAY);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const postAtBestHour: CalendarPost = {
      id: "x",
      content: "Content",
      platform: "twitter",
      scheduledAt: (() => {
        const d = new Date(tomorrow);
        d.setHours(9, 0, 0, 0);
        return d;
      })(),
      status: "SCHEDULED",
    };
    render(
      <TimeSlotGrid
        selectedDate={tomorrow}
        scheduledPosts={[postAtBestHour]}
        bestTimes={[{ day: "Any", hour: 9, score: 95, reason: "Best" }]}
        onTimeSlotSelect={vi.fn()}
      />,
    );
    // "Best" badge should not appear because slot is occupied
    expect(screen.queryByText("Best")).not.toBeInTheDocument();
  });

  it("shows post count badge when a slot has posts", () => {
    const tomorrow = new Date(TODAY);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const postAt9: CalendarPost = {
      id: "y",
      content: "Content",
      platform: "instagram",
      scheduledAt: (() => {
        const d = new Date(tomorrow);
        d.setHours(9, 0, 0, 0);
        return d;
      })(),
      status: "SCHEDULED",
    };
    render(
      <TimeSlotGrid
        selectedDate={tomorrow}
        scheduledPosts={[postAt9]}
        bestTimes={[]}
        onTimeSlotSelect={vi.fn()}
      />,
    );
    expect(screen.getByText("1x")).toBeInTheDocument();
  });

  it("shows 'Click a slot to compose' hint", () => {
    render(
      <TimeSlotGrid
        selectedDate={TODAY}
        scheduledPosts={[]}
        bestTimes={[]}
        onTimeSlotSelect={vi.fn()}
      />,
    );
    expect(screen.getByText("Click a slot to compose")).toBeInTheDocument();
  });
});
