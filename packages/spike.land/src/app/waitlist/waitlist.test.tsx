import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

// Mock the WaitlistInlineForm to avoid fetch dependency
vi.mock("@/components/waitlist/WaitlistInlineForm", () => ({
  WaitlistInlineForm: ({ source }: { source?: string; }) => (
    <form data-testid="waitlist-form" data-source={source}>
      <input type="email" placeholder="Enter your email" />
      <button type="submit">Join</button>
    </form>
  ),
}));

import WaitlistPage from "./page";

describe("WaitlistPage", () => {
  it("renders the waitlist page with form", () => {
    render(<WaitlistPage />);
    expect(screen.getByText("Your AI. Your tools. Zero wasted context."))
      .toBeDefined();
    expect(screen.getByTestId("waitlist-form")).toBeDefined();
  });

  it("shows social proof stats", () => {
    render(<WaitlistPage />);
    expect(screen.getByText("Lazy-load toolsets")).toBeDefined();
    expect(screen.getByText("100% open source")).toBeDefined();
  });
});
