import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { PostComposer } from "./PostComposer";

const TODAY = new Date();
TODAY.setHours(10, 0, 0, 0);

describe("PostComposer", () => {
  it("renders the 'Compose Post' heading", () => {
    render(
      <PostComposer scheduledDate={TODAY} onSchedule={vi.fn()} onClose={vi.fn()} />,
    );
    expect(screen.getByText("Compose Post")).toBeInTheDocument();
  });

  it("renders all four platform toggle buttons", () => {
    render(
      <PostComposer scheduledDate={TODAY} onSchedule={vi.fn()} onClose={vi.fn()} />,
    );
    expect(screen.getByText("Twitter / X")).toBeInTheDocument();
    expect(screen.getByText("Instagram")).toBeInTheDocument();
    expect(screen.getByText("LinkedIn")).toBeInTheDocument();
    expect(screen.getByText("Facebook")).toBeInTheDocument();
  });

  it("shows 'Schedule Post' button", () => {
    render(
      <PostComposer scheduledDate={TODAY} onSchedule={vi.fn()} onClose={vi.fn()} />,
    );
    expect(screen.getByRole("button", { name: /schedule post/i })).toBeInTheDocument();
  });

  it("Schedule Post button is disabled when content is empty", () => {
    render(
      <PostComposer scheduledDate={TODAY} onSchedule={vi.fn()} onClose={vi.fn()} />,
    );
    expect(screen.getByRole("button", { name: /schedule post/i })).toBeDisabled();
  });

  it("Schedule Post button is enabled when content is provided", () => {
    render(
      <PostComposer scheduledDate={TODAY} onSchedule={vi.fn()} onClose={vi.fn()} />,
    );
    fireEvent.change(screen.getByPlaceholderText(/what's on your mind/i), {
      target: { value: "Hello world!" },
    });
    expect(screen.getByRole("button", { name: /schedule post/i })).not.toBeDisabled();
  });

  it("calls onClose when Cancel is clicked", () => {
    const onClose = vi.fn();
    render(
      <PostComposer scheduledDate={TODAY} onSchedule={vi.fn()} onClose={onClose} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when X icon button is clicked", () => {
    const onClose = vi.fn();
    render(
      <PostComposer scheduledDate={TODAY} onSchedule={vi.fn()} onClose={onClose} />,
    );
    // The X icon button has no text — find by its position (first ghost icon button in header)
    const buttons = screen.getAllByRole("button");
    const xButton = buttons.find(
      b => b.className.includes("h-7") && b.className.includes("w-7"),
    );
    if (xButton) fireEvent.click(xButton);
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onSchedule with correct arguments when submitted", async () => {
    const onSchedule = vi.fn().mockResolvedValue(undefined);
    render(
      <PostComposer scheduledDate={TODAY} onSchedule={onSchedule} onClose={vi.fn()} />,
    );
    fireEvent.change(screen.getByPlaceholderText(/what's on your mind/i), {
      target: { value: "Test post content" },
    });
    fireEvent.click(screen.getByRole("button", { name: /schedule post/i }));
    await waitFor(() => {
      expect(onSchedule).toHaveBeenCalledWith(
        "Test post content",
        expect.arrayContaining(["twitter"]),
        expect.any(Date),
      );
    });
  });

  it("shows the formatted scheduled date when scheduledDate is provided", () => {
    render(
      <PostComposer scheduledDate={TODAY} onSchedule={vi.fn()} onClose={vi.fn()} />,
    );
    const expected = TODAY.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it("shows 'Today' when scheduledDate is null", () => {
    render(
      <PostComposer scheduledDate={null} onSchedule={vi.fn()} onClose={vi.fn()} />,
    );
    expect(screen.getByText("Today")).toBeInTheDocument();
  });

  it("displays char counter that decrements as text is typed", () => {
    render(
      <PostComposer scheduledDate={TODAY} onSchedule={vi.fn()} onClose={vi.fn()} />,
    );
    // Twitter selected by default, limit=280
    expect(screen.getByText("280")).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText(/what's on your mind/i), {
      target: { value: "Hello" },
    });
    expect(screen.getByText("275")).toBeInTheDocument();
  });

  it("shows the Twitter char limit note when twitter is selected", () => {
    render(
      <PostComposer scheduledDate={TODAY} onSchedule={vi.fn()} onClose={vi.fn()} />,
    );
    expect(screen.getByText("Twitter: 280 char limit applies")).toBeInTheDocument();
  });

  it("disables Schedule Post button when content exceeds char limit", () => {
    render(
      <PostComposer scheduledDate={TODAY} onSchedule={vi.fn()} onClose={vi.fn()} />,
    );
    fireEvent.change(screen.getByPlaceholderText(/what's on your mind/i), {
      target: { value: "x".repeat(281) },
    });
    expect(screen.getByRole("button", { name: /schedule post/i })).toBeDisabled();
  });

  it("toggles platform selection when a platform button is clicked", () => {
    render(
      <PostComposer scheduledDate={TODAY} onSchedule={vi.fn()} onClose={vi.fn()} />,
    );
    // Instagram is not selected by default — click to add it
    fireEvent.click(screen.getByText("Instagram"));
    // "Posting to:" section should now show instagram badge
    expect(screen.getByText("instagram")).toBeInTheDocument();
  });

  it("shows Scheduling... text while submitting", async () => {
    let resolveSchedule: () => void;
    const onSchedule = vi.fn(
      () =>
        new Promise<void>(resolve => {
          resolveSchedule = resolve;
        }),
    );
    render(
      <PostComposer scheduledDate={TODAY} onSchedule={onSchedule} onClose={vi.fn()} />,
    );
    fireEvent.change(screen.getByPlaceholderText(/what's on your mind/i), {
      target: { value: "Some content" },
    });
    fireEvent.click(screen.getByRole("button", { name: /schedule post/i }));
    expect(await screen.findByText("Scheduling...")).toBeInTheDocument();
    resolveSchedule!();
  });
});
