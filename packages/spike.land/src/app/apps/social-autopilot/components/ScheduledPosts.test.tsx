import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ScheduledPosts } from "./ScheduledPosts";
import type { CalendarPost } from "./CalendarView";

const TODAY = new Date();
TODAY.setHours(12, 0, 0, 0);

const TOMORROW = new Date(TODAY);
TOMORROW.setDate(TODAY.getDate() + 1);

const POSTS: CalendarPost[] = [
  {
    id: "p1",
    content: "First scheduled post",
    platform: "twitter",
    scheduledAt: new Date(TODAY),
    status: "SCHEDULED",
  },
  {
    id: "p2",
    content: "Second scheduled post",
    platform: "instagram",
    scheduledAt: new Date(TODAY),
    status: "PUBLISHED",
  },
  {
    id: "p3",
    content: "Tomorrow post",
    platform: "linkedin",
    scheduledAt: new Date(TOMORROW),
    status: "SCHEDULED",
  },
];

describe("ScheduledPosts", () => {
  it("shows loading skeletons when isLoading is true", () => {
    const { container } = render(
      <ScheduledPosts posts={[]} selectedDate={null} onCancelPost={vi.fn()} isLoading={true} />,
    );
    expect(container.querySelector(".animate-pulse")).not.toBeNull();
  });

  it("shows 'No posts scheduled' when there are no posts and no selectedDate", () => {
    render(
      <ScheduledPosts posts={[]} selectedDate={null} onCancelPost={vi.fn()} isLoading={false} />,
    );
    expect(screen.getByText("No posts scheduled")).toBeInTheDocument();
  });

  it("shows 'Upcoming Posts' label when no date is selected", () => {
    render(
      <ScheduledPosts posts={POSTS} selectedDate={null} onCancelPost={vi.fn()} isLoading={false} />,
    );
    expect(screen.getByText("Upcoming Posts")).toBeInTheDocument();
  });

  it("shows the formatted date label when a date is selected", () => {
    render(
      <ScheduledPosts
        posts={POSTS}
        selectedDate={TODAY}
        onCancelPost={vi.fn()}
        isLoading={false}
      />,
    );
    const expected = TODAY.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it("filters posts to the selected date only", () => {
    render(
      <ScheduledPosts
        posts={POSTS}
        selectedDate={TODAY}
        onCancelPost={vi.fn()}
        isLoading={false}
      />,
    );
    expect(screen.getByText("First scheduled post")).toBeInTheDocument();
    expect(screen.getByText("Second scheduled post")).toBeInTheDocument();
    expect(screen.queryByText("Tomorrow post")).not.toBeInTheDocument();
  });

  it("shows all posts (up to 10) when no date is selected", () => {
    render(
      <ScheduledPosts posts={POSTS} selectedDate={null} onCancelPost={vi.fn()} isLoading={false} />,
    );
    expect(screen.getByText("First scheduled post")).toBeInTheDocument();
    expect(screen.getByText("Tomorrow post")).toBeInTheDocument();
  });

  it("shows post count badge", () => {
    render(
      <ScheduledPosts
        posts={POSTS}
        selectedDate={TODAY}
        onCancelPost={vi.fn()}
        isLoading={false}
      />,
    );
    // 2 posts on TODAY
    expect(screen.getByText("2 posts")).toBeInTheDocument();
  });

  it("uses singular 'post' when only 1 post", () => {
    const single = [POSTS[0]!];
    render(
      <ScheduledPosts
        posts={single}
        selectedDate={TODAY}
        onCancelPost={vi.fn()}
        isLoading={false}
      />,
    );
    expect(screen.getByText("1 post")).toBeInTheDocument();
  });

  it("shows the 'SCHEDULED' badge", () => {
    render(
      <ScheduledPosts
        posts={[POSTS[0]!]}
        selectedDate={TODAY}
        onCancelPost={vi.fn()}
        isLoading={false}
      />,
    );
    expect(screen.getByText("Scheduled")).toBeInTheDocument();
  });

  it("shows the 'PUBLISHED' badge", () => {
    render(
      <ScheduledPosts
        posts={[POSTS[1]!]}
        selectedDate={TODAY}
        onCancelPost={vi.fn()}
        isLoading={false}
      />,
    );
    expect(screen.getByText("Published")).toBeInTheDocument();
  });

  it("renders a dropdown menu trigger button per post card", () => {
    render(
      <ScheduledPosts
        posts={[POSTS[0]!]}
        selectedDate={TODAY}
        onCancelPost={vi.fn()}
        isLoading={false}
      />,
    );
    // The MoreVertical trigger button is present in the DOM (Radix portal handles menu open)
    const allButtons = screen.getAllByRole("button");
    // There is at least one button that serves as the dropdown trigger
    expect(allButtons.length).toBeGreaterThanOrEqual(1);
  });

  it("renders the platform icon area for twitter posts", () => {
    const { container } = render(
      <ScheduledPosts
        posts={[POSTS[0]!]}
        selectedDate={TODAY}
        onCancelPost={vi.fn()}
        isLoading={false}
      />,
    );
    // twitter icon wrapper uses blue bg class
    expect(container.querySelector(".bg-blue-500\\/10")).not.toBeNull();
  });

  it("shows 'Select a date to see posts' hint when no selectedDate and no posts", () => {
    render(
      <ScheduledPosts posts={[]} selectedDate={null} onCancelPost={vi.fn()} isLoading={false} />,
    );
    expect(screen.getByText("Select a date to see posts")).toBeInTheDocument();
  });
});
