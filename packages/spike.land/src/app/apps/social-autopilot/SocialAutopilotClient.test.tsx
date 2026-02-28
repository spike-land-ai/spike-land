import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { SocialAutopilotClient } from "./SocialAutopilotClient";

// Mock Next.js Link
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

describe("SocialAutopilotClient", () => {
  it("renders the app header with 'Social Autopilot' title", () => {
    render(<SocialAutopilotClient />);
    expect(screen.getByText("Social Autopilot")).toBeInTheDocument();
  });

  it("renders the 'Connected' status badge", () => {
    render(<SocialAutopilotClient />);
    expect(screen.getByText("Connected")).toBeInTheDocument();
  });

  it("renders the Compose button in the header", () => {
    render(<SocialAutopilotClient />);
    expect(screen.getByRole("button", { name: /compose/i })).toBeInTheDocument();
  });

  it("renders the navigation rail with all 5 tabs", () => {
    render(<SocialAutopilotClient />);
    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText("Calendar")).toBeInTheDocument();
    expect(screen.getByText("Analytics")).toBeInTheDocument();
    expect(screen.getByText("Boost")).toBeInTheDocument();
    expect(screen.getByText("Setup")).toBeInTheDocument();
  });

  it("shows the Calendar view by default", () => {
    render(<SocialAutopilotClient />);
    // CalendarView renders month label
    const today = new Date();
    const monthLabel = today.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
    expect(screen.getByText(monthLabel)).toBeInTheDocument();
  });

  it("switches to Overview tab when Overview nav item is clicked", () => {
    render(<SocialAutopilotClient />);
    fireEvent.click(screen.getByText("Overview"));
    expect(screen.getByText("Total Reach")).toBeInTheDocument();
    expect(screen.getByText("Engagement")).toBeInTheDocument();
  });

  it("shows stats values in Overview tab", () => {
    render(<SocialAutopilotClient />);
    fireEvent.click(screen.getByText("Overview"));
    expect(screen.getByText("248.5K")).toBeInTheDocument();
    expect(screen.getByText("18.2K")).toBeInTheDocument();
  });

  it("shows 'Upcoming Queue' section in Overview tab", () => {
    render(<SocialAutopilotClient />);
    fireEvent.click(screen.getByText("Overview"));
    expect(screen.getByText("Upcoming Queue")).toBeInTheDocument();
  });

  it("switches back to Calendar from Overview via 'View Calendar' button", () => {
    render(<SocialAutopilotClient />);
    fireEvent.click(screen.getByText("Overview"));
    fireEvent.click(screen.getByRole("button", { name: /view calendar/i }));
    const today = new Date();
    const monthLabel = today.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
    expect(screen.getByText(monthLabel)).toBeInTheDocument();
  });

  it("shows 'coming soon' placeholder for Analytics tab", () => {
    render(<SocialAutopilotClient />);
    fireEvent.click(screen.getByText("Analytics"));
    expect(screen.getByText("This section is coming soon.")).toBeInTheDocument();
  });

  it("shows 'coming soon' placeholder for Boost tab", () => {
    render(<SocialAutopilotClient />);
    fireEvent.click(screen.getByText("Boost"));
    expect(screen.getByText("This section is coming soon.")).toBeInTheDocument();
  });

  it("shows 'coming soon' placeholder for Setup tab", () => {
    render(<SocialAutopilotClient />);
    fireEvent.click(screen.getByText("Setup"));
    expect(screen.getByText("This section is coming soon.")).toBeInTheDocument();
  });

  it("opens PostComposer when Compose button is clicked", () => {
    render(<SocialAutopilotClient />);
    fireEvent.click(screen.getByRole("button", { name: /compose/i }));
    expect(screen.getByText("Compose Post")).toBeInTheDocument();
  });

  it("closes PostComposer when cancel is clicked inside it", () => {
    render(<SocialAutopilotClient />);
    fireEvent.click(screen.getByRole("button", { name: /compose/i }));
    expect(screen.getByText("Compose Post")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^cancel$/i }));
    expect(screen.queryByText("Compose Post")).not.toBeInTheDocument();
  });

  it("renders seed posts in the calendar view", () => {
    render(<SocialAutopilotClient />);
    // GapDetector is shown in Calendar tab by default (no composer open)
    expect(screen.getByText("Gap Detector")).toBeInTheDocument();
  });

  it("renders back link to /store", () => {
    render(<SocialAutopilotClient />);
    const backLink = screen.getByRole("link");
    expect(backLink).toHaveAttribute("href", "/store");
  });

  it("renders TimeSlotGrid with 'Click a slot to compose' hint", () => {
    render(<SocialAutopilotClient />);
    expect(screen.getByText("Click a slot to compose")).toBeInTheDocument();
  });
});
