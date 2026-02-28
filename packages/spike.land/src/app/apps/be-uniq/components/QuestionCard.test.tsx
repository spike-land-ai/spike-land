import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { QuestionCard } from "./QuestionCard";

const defaultProps = {
  question: "Do you prefer mountains over beaches?",
  questionNumber: 1,
  answers: [],
  onYes: vi.fn(),
  onNo: vi.fn(),
  isLoading: false,
};

describe("QuestionCard", () => {
  it("renders the question text", () => {
    render(<QuestionCard {...defaultProps} />);
    expect(
      screen.getByText("Do you prefer mountains over beaches?"),
    ).toBeInTheDocument();
  });

  it("renders the question number", () => {
    render(<QuestionCard {...defaultProps} questionNumber={3} />);
    expect(screen.getByText("Question 3")).toBeInTheDocument();
  });

  it("renders YES button", () => {
    render(<QuestionCard {...defaultProps} />);
    expect(screen.getByRole("button", { name: /YES/i })).toBeInTheDocument();
  });

  it("renders NO button", () => {
    render(<QuestionCard {...defaultProps} />);
    expect(screen.getByRole("button", { name: /NO/i })).toBeInTheDocument();
  });

  it("calls onYes when YES is clicked", () => {
    const onYes = vi.fn();
    render(<QuestionCard {...defaultProps} onYes={onYes} />);
    fireEvent.click(screen.getByRole("button", { name: /YES/i }));
    expect(onYes).toHaveBeenCalledOnce();
  });

  it("calls onNo when NO is clicked", () => {
    const onNo = vi.fn();
    render(<QuestionCard {...defaultProps} onNo={onNo} />);
    fireEvent.click(screen.getByRole("button", { name: /NO/i }));
    expect(onNo).toHaveBeenCalledOnce();
  });

  it("disables YES and NO buttons while loading", () => {
    render(<QuestionCard {...defaultProps} isLoading />);
    expect(screen.getByRole("button", { name: /YES/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /NO/i })).toBeDisabled();
  });

  it("shows a spinner when loading", () => {
    const { container } = render(<QuestionCard {...defaultProps} isLoading />);
    // Loader2 renders as an svg — verify question text is replaced
    expect(
      screen.queryByText("Do you prefer mountains over beaches?"),
    ).not.toBeInTheDocument();
    // The Loader2 icon renders as an SVG in the card
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("renders progress dots for previous answers", () => {
    const answers = [
      { question: "Q1", answer: true },
      { question: "Q2", answer: false },
    ];
    const { container } = render(
      <QuestionCard {...defaultProps} answers={answers} questionNumber={3} />,
    );
    // Yes answer dot + No answer dot + current (fuchsia pulsing) dot = 3 dots
    // Each dot is a rounded-full div
    const dots = container.querySelectorAll(".rounded-full");
    // At least 3 dots (2 prior + 1 current)
    expect(dots.length).toBeGreaterThanOrEqual(3);
  });

  it("renders question number 1 for first question with no answers", () => {
    render(<QuestionCard {...defaultProps} questionNumber={1} answers={[]} />);
    expect(screen.getByText("Question 1")).toBeInTheDocument();
  });
});
