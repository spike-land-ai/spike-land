import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QuizRound } from "@/components/quiz/QuizRound";

const questions = [
  { conceptIndex: 0, question: "Q1?", options: ["Apple", "Banana", "Cherry", "Date"] as [string, string, string, string] },
  { conceptIndex: 1, question: "Q2?", options: ["Dog", "Elephant", "Fox", "Goat"] as [string, string, string, string] },
  { conceptIndex: 2, question: "Q3?", options: ["Red", "Green", "Blue", "Yellow"] as [string, string, string, string] },
];

describe("QuizRound", () => {
  it("renders round number", () => {
    render(<QuizRound roundNumber={2} questions={questions} onSubmit={vi.fn()} />);
    expect(screen.getByText("Round 2")).toBeInTheDocument();
  });

  it("renders all questions", () => {
    render(<QuizRound roundNumber={1} questions={questions} onSubmit={vi.fn()} />);
    expect(screen.getByText("Q1?")).toBeInTheDocument();
    expect(screen.getByText("Q2?")).toBeInTheDocument();
    expect(screen.getByText("Q3?")).toBeInTheDocument();
  });

  it("shows Submit Answers button initially disabled", () => {
    render(<QuizRound roundNumber={1} questions={questions} onSubmit={vi.fn()} />);
    const btn = screen.getByText("Submit Answers");
    expect(btn).toBeDisabled();
  });

  it("enables Submit Answers after all questions answered", () => {
    render(<QuizRound roundNumber={1} questions={questions} onSubmit={vi.fn()} />);

    fireEvent.click(screen.getByText("Apple"));
    fireEvent.click(screen.getByText("Dog"));
    fireEvent.click(screen.getByText("Red"));

    expect(screen.getByText("Submit Answers")).not.toBeDisabled();
  });

  it("calls onSubmit with correct answer indices", () => {
    const onSubmit = vi.fn();
    render(<QuizRound roundNumber={1} questions={questions} onSubmit={onSubmit} />);

    // Select index 1 (Banana), index 2 (Fox), index 0 (Red)
    fireEvent.click(screen.getByText("Banana"));
    fireEvent.click(screen.getByText("Fox"));
    fireEvent.click(screen.getByText("Red"));

    fireEvent.click(screen.getByText("Submit Answers"));
    expect(onSubmit).toHaveBeenCalledWith([1, 2, 0]);
  });

  it("shows results score after submission", () => {
    const results = [
      { questionIndex: 0, concept: "c1", correct: true, conflict: false },
      { questionIndex: 1, concept: "c2", correct: false, conflict: false },
      { questionIndex: 2, concept: "c3", correct: true, conflict: false },
    ];
    render(<QuizRound roundNumber={1} questions={questions} onSubmit={vi.fn()} results={results} />);
    expect(screen.getByText("2/3 correct")).toBeInTheDocument();
  });

  it("hides Submit button when results are shown", () => {
    const results = [
      { questionIndex: 0, concept: "c1", correct: true, conflict: false },
      { questionIndex: 1, concept: "c2", correct: true, conflict: false },
      { questionIndex: 2, concept: "c3", correct: true, conflict: false },
    ];
    render(<QuizRound roundNumber={1} questions={questions} onSubmit={vi.fn()} results={results} />);
    expect(screen.queryByText("Submit Answers")).not.toBeInTheDocument();
  });

  it("shows Checking... when submitting", () => {
    render(<QuizRound roundNumber={1} questions={questions} onSubmit={vi.fn()} submitting={true} />);
    expect(screen.getByText("Checking...")).toBeInTheDocument();
  });

  it("disables submit button while submitting", () => {
    render(<QuizRound roundNumber={1} questions={questions} onSubmit={vi.fn()} submitting={true} />);
    expect(screen.getByText("Checking...")).toBeDisabled();
  });

  it("prevents changing answers after results are shown (all buttons disabled)", () => {
    const results = [
      { questionIndex: 0, concept: "c1", correct: true, conflict: false },
      { questionIndex: 1, concept: "c2", correct: false, conflict: false },
      { questionIndex: 2, concept: "c3", correct: true, conflict: false },
    ];
    render(<QuizRound roundNumber={1} questions={questions} onSubmit={vi.fn()} results={results} />);
    // All option buttons should be disabled when results exist
    const optionButtons = screen.getAllByRole("button");
    optionButtons.forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });
});
