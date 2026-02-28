import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UniqueResult } from "./UniqueResult";

const defaultAnswers = [
  { question: "Do you prefer mountains?", answer: true, tags: ["outdoors"] },
  { question: "Do you like cooking?", answer: false, tags: ["lifestyle"] },
];

const defaultProfile = {
  tags: ["outdoors", "creative"],
  leafNodeId: "leaf-abc",
  answerCount: 2,
};

const defaultProps = {
  answers: defaultAnswers,
  profile: defaultProfile,
  onPlayAgain: vi.fn(),
  onBackToWelcome: vi.fn(),
  isLoading: false,
};

describe("UniqueResult", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the You're Unique heading", () => {
    render(<UniqueResult {...defaultProps} />);
    expect(screen.getByText(/You're Unique!/i)).toBeInTheDocument();
  });

  it("shows the answer count in the subtitle", () => {
    render(<UniqueResult {...defaultProps} />);
    expect(screen.getByText(/2 answers/i)).toBeInTheDocument();
  });

  it("uses singular 'answer' when only 1 answer", () => {
    render(
      <UniqueResult
        {...defaultProps}
        answers={[{ question: "Q?", answer: true, tags: [] }]}
      />,
    );
    expect(screen.getByText(/1 answer/)).toBeInTheDocument();
    // Should NOT say "1 answers"
    expect(screen.queryByText(/1 answers/)).not.toBeInTheDocument();
  });

  it("renders the answer path section", () => {
    render(<UniqueResult {...defaultProps} />);
    expect(screen.getByText("Your Answer Path")).toBeInTheDocument();
  });

  it("renders all questions in the answer journey", () => {
    render(<UniqueResult {...defaultProps} />);
    expect(screen.getByText("Do you prefer mountains?")).toBeInTheDocument();
    expect(screen.getByText("Do you like cooking?")).toBeInTheDocument();
  });

  it("renders YES labels for true answers", () => {
    render(<UniqueResult {...defaultProps} />);
    expect(screen.getAllByText("YES")[0]).toBeInTheDocument();
  });

  it("renders NO labels for false answers", () => {
    render(<UniqueResult {...defaultProps} />);
    expect(screen.getAllByText("NO")[0]).toBeInTheDocument();
  });

  it("renders profile tags when profile has tags", () => {
    render(<UniqueResult {...defaultProps} />);
    expect(screen.getByText("Your Profile Tags")).toBeInTheDocument();
    expect(screen.getByText("outdoors")).toBeInTheDocument();
    expect(screen.getByText("creative")).toBeInTheDocument();
  });

  it("does not render tags section when profile has no tags", () => {
    render(
      <UniqueResult
        {...defaultProps}
        profile={{ tags: [], leafNodeId: "leaf-x", answerCount: 2 }}
      />,
    );
    expect(screen.queryByText("Your Profile Tags")).not.toBeInTheDocument();
  });

  it("does not render tags section when profile is null", () => {
    render(<UniqueResult {...defaultProps} profile={null} />);
    expect(screen.queryByText("Your Profile Tags")).not.toBeInTheDocument();
  });

  it("renders Home button", () => {
    render(<UniqueResult {...defaultProps} />);
    expect(screen.getByRole("button", { name: /Home/i })).toBeInTheDocument();
  });

  it("renders Play Again button", () => {
    render(<UniqueResult {...defaultProps} />);
    expect(screen.getByRole("button", { name: /Play Again/i })).toBeInTheDocument();
  });

  it("calls onBackToWelcome when Home is clicked", () => {
    const onBackToWelcome = vi.fn();
    render(<UniqueResult {...defaultProps} onBackToWelcome={onBackToWelcome} />);
    fireEvent.click(screen.getByRole("button", { name: /Home/i }));
    expect(onBackToWelcome).toHaveBeenCalledOnce();
  });

  it("calls onPlayAgain when Play Again is clicked", () => {
    const onPlayAgain = vi.fn();
    render(<UniqueResult {...defaultProps} onPlayAgain={onPlayAgain} />);
    fireEvent.click(screen.getByRole("button", { name: /Play Again/i }));
    expect(onPlayAgain).toHaveBeenCalledOnce();
  });

  it("disables Play Again button while loading", () => {
    render(<UniqueResult {...defaultProps} isLoading />);
    expect(screen.getByRole("button", { name: /Play Again/i })).toBeDisabled();
  });

  it("hides confetti after 5 seconds", () => {
    const { container } = render(<UniqueResult {...defaultProps} />);
    // Confetti container exists initially
    expect(container.querySelector(".fixed.inset-0")).toBeTruthy();
    // Advance timers past 5s and flush React state updates
    act(() => {
      vi.advanceTimersByTime(5001);
    });
    expect(container.querySelector(".fixed.inset-0")).toBeFalsy();
  });
});
