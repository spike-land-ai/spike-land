import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ConflictAlert } from "@/components/quiz/ConflictAlert";

describe("ConflictAlert", () => {
  it("renders nothing when conflicts is empty", () => {
    const { container } = render(<ConflictAlert conflicts={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("shows contradiction detected heading with count", () => {
    render(<ConflictAlert conflicts={[
      { concept: "Variables", round: 1, detail: "Contradicts round 1" },
    ]} />);
    expect(screen.getByText("Contradiction Detected (1)")).toBeInTheDocument();
  });

  it("shows all conflict items", () => {
    render(<ConflictAlert conflicts={[
      { concept: "Variables", round: 1, detail: "Contradicts round 1" },
      { concept: "Loops", round: 2, detail: "Contradicts round 2" },
    ]} />);
    expect(screen.getByText("Variables")).toBeInTheDocument();
    expect(screen.getByText("Loops")).toBeInTheDocument();
    expect(screen.getByText("Contradiction Detected (2)")).toBeInTheDocument();
  });

  it("shows detail text for each conflict", () => {
    render(<ConflictAlert conflicts={[
      { concept: "Functions", round: 1, detail: "Answer changed from true to false" },
    ]} />);
    expect(screen.getByText(/Answer changed from true to false/)).toBeInTheDocument();
  });

  it("shows mastery reset message", () => {
    render(<ConflictAlert conflicts={[
      { concept: "Arrays", round: 1, detail: "Conflict detail" },
    ]} />);
    expect(screen.getByText(/Concept mastery has been reset/)).toBeInTheDocument();
  });

  it("has warning styling", () => {
    const { container } = render(<ConflictAlert conflicts={[
      { concept: "Test", round: 1, detail: "detail" },
    ]} />);
    expect(container.firstChild).toHaveClass("border-warning");
  });
});
