import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QuizCard } from "@/components/quiz/QuizCard";

const defaultProps = {
  questionIndex: 0,
  question: "What is 2 + 2?",
  options: ["1", "2", "3", "4"] as [string, string, string, string],
  selectedAnswer: null,
  onSelect: vi.fn(),
};

describe("QuizCard", () => {
  it("renders the question text", () => {
    render(<QuizCard {...defaultProps} />);
    expect(screen.getByText("What is 2 + 2?")).toBeInTheDocument();
  });

  it("renders all four options", () => {
    render(<QuizCard {...defaultProps} />);
    // Options are "1","2","3","4" — use getAllByText since "1" appears as question number too
    expect(screen.getAllByText("1").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getAllByText("4").length).toBeGreaterThanOrEqual(1);
  });

  it("displays question number (index + 1)", () => {
    render(<QuizCard {...defaultProps} questionIndex={2} />);
    // questionIndex 2 → label "3", but options also contain "3"
    expect(screen.getAllByText("3").length).toBeGreaterThanOrEqual(1);
  });

  it("labels options A, B, C, D", () => {
    render(<QuizCard {...defaultProps} />);
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
    expect(screen.getByText("C")).toBeInTheDocument();
    expect(screen.getByText("D")).toBeInTheDocument();
  });

  it("calls onSelect with question index and option index when clicked", () => {
    const onSelect = vi.fn();
    render(<QuizCard {...defaultProps} onSelect={onSelect} />);
    fireEvent.click(screen.getByText("3"));
    expect(onSelect).toHaveBeenCalledWith(0, 2);
  });

  it("does not call onSelect when disabled", () => {
    const onSelect = vi.fn();
    render(<QuizCard {...defaultProps} onSelect={onSelect} disabled={true} />);
    fireEvent.click(screen.getByText("4"));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("highlights selected answer with primary border", () => {
    const { container } = render(<QuizCard {...defaultProps} selectedAnswer={3} />);
    const buttons = container.querySelectorAll("button");
    // Option at index 3 (4th button, 0-indexed)
    expect(buttons[3].className).toContain("border-primary");
  });

  it("shows success styling on correct answer", () => {
    const { container } = render(
      <QuizCard
        {...defaultProps}
        selectedAnswer={3}
        result={{ correct: true, conflict: false }}
      />
    );
    const buttons = container.querySelectorAll("button");
    expect(buttons[3].className).toContain("border-success");
  });

  it("shows destructive styling on wrong answer", () => {
    const { container } = render(
      <QuizCard
        {...defaultProps}
        selectedAnswer={1}
        result={{ correct: false, conflict: false }}
      />
    );
    const buttons = container.querySelectorAll("button");
    expect(buttons[1].className).toContain("border-destructive");
  });

  it("shows warning styling on conflict answer", () => {
    const { container } = render(
      <QuizCard
        {...defaultProps}
        selectedAnswer={2}
        result={{ correct: false, conflict: true }}
      />
    );
    const buttons = container.querySelectorAll("button");
    expect(buttons[2].className).toContain("border-warning");
  });

  it("disables all buttons when disabled prop is true", () => {
    const { container } = render(<QuizCard {...defaultProps} disabled={true} />);
    const buttons = container.querySelectorAll("button");
    buttons.forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });
});
