import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { QuizProgress } from "@/components/quiz/QuizProgress";

const sampleProgress = [
  { concept: "Variables", mastered: true, correctCount: 2, attempts: 2 },
  { concept: "Functions", mastered: false, correctCount: 1, attempts: 3 },
  { concept: "Loops", mastered: false, correctCount: 0, attempts: 1 },
];

describe("QuizProgress", () => {
  it("renders concept mastery heading", () => {
    render(<QuizProgress progress={sampleProgress} />);
    expect(screen.getByText("Concept Mastery")).toBeInTheDocument();
  });

  it("shows correct mastered count out of total", () => {
    render(<QuizProgress progress={sampleProgress} />);
    expect(screen.getByText("1/3 mastered")).toBeInTheDocument();
  });

  it("renders all concepts", () => {
    render(<QuizProgress progress={sampleProgress} />);
    expect(screen.getByText("Variables")).toBeInTheDocument();
    expect(screen.getByText("Functions")).toBeInTheDocument();
    expect(screen.getByText("Loops")).toBeInTheDocument();
  });

  it("shows checkmark for mastered concept", () => {
    render(<QuizProgress progress={sampleProgress} />);
    // Mastered concept shows checkmark character
    expect(screen.getByText("✓")).toBeInTheDocument();
  });

  it("shows correct count for partially correct concept", () => {
    render(<QuizProgress progress={sampleProgress} />);
    // Functions has correctCount 1
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("shows 0 for unattempted concept", () => {
    render(<QuizProgress progress={sampleProgress} />);
    // Loops has correctCount 0
    const zeros = screen.getAllByText("0");
    expect(zeros.length).toBeGreaterThan(0);
  });

  it("shows progress bar widths based on mastery", () => {
    const { container } = render(<QuizProgress progress={sampleProgress} />);
    // Overall bar: 1/3 = 33.33%
    const progressBars = container.querySelectorAll("[style*='width']");
    expect(progressBars.length).toBeGreaterThan(0);
  });

  it("handles empty progress array", () => {
    render(<QuizProgress progress={[]} />);
    expect(screen.getByText("0/0 mastered")).toBeInTheDocument();
  });

  it("uses custom masteryThreshold in progress display", () => {
    const progress = [
      { concept: "Arrays", mastered: false, correctCount: 1, attempts: 1 },
    ];
    render(<QuizProgress progress={progress} masteryThreshold={3} />);
    // Shows correctCount/masteryThreshold
    expect(screen.getByText("1/3")).toBeInTheDocument();
  });

  it("applies success styling to mastered concepts", () => {
    const { container } = render(<QuizProgress progress={sampleProgress} />);
    const successBars = container.querySelectorAll(".bg-success");
    expect(successBars.length).toBeGreaterThan(0);
  });

  it("applies warning styling to partially correct concepts", () => {
    const { container } = render(<QuizProgress progress={sampleProgress} />);
    const warningIcons = container.querySelectorAll("[class*='warning']");
    expect(warningIcons.length).toBeGreaterThan(0);
  });
});
