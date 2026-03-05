import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ArticleView } from "@/components/quiz/ArticleView";

describe("ArticleView", () => {
  it("renders the Article heading", () => {
    render(<ArticleView content="Hello world" />);
    expect(screen.getByText("Article")).toBeInTheDocument();
  });

  it("renders paragraph content", () => {
    const content = "First paragraph\n\nSecond paragraph";
    render(<ArticleView content={content} />);
    expect(screen.getByText("First paragraph")).toBeInTheDocument();
    expect(screen.getByText("Second paragraph")).toBeInTheDocument();
  });

  it("splits on double newlines into multiple paragraphs", () => {
    const content = "Para one\n\nPara two\n\nPara three";
    const { container } = render(<ArticleView content={content} />);
    const paragraphs = container.querySelectorAll("p.mb-3");
    expect(paragraphs).toHaveLength(3);
  });

  it("filters out empty paragraphs", () => {
    const content = `Real content\n\n\n\n   \n\nMore content`;
    const { container } = render(<ArticleView content={content} />);
    const paragraphs = container.querySelectorAll("p.mb-3");
    expect(paragraphs).toHaveLength(2);
  });

  it("does not show content when collapsed=true", () => {
    render(<ArticleView content="Hidden text" collapsed={true} />);
    expect(screen.queryByText("Hidden text")).not.toBeInTheDocument();
  });

  it("shows content when collapsed=false (default)", () => {
    render(<ArticleView content="Visible text" />);
    expect(screen.getByText("Visible text")).toBeInTheDocument();
  });

  it("renders toggle button when onToggle provided", () => {
    render(<ArticleView content="Content" onToggle={vi.fn()} />);
    expect(screen.getByText("Hide Article")).toBeInTheDocument();
  });

  it("shows Show Article when collapsed with onToggle", () => {
    render(<ArticleView content="Content" collapsed={true} onToggle={vi.fn()} />);
    expect(screen.getByText("Show Article")).toBeInTheDocument();
  });

  it("calls onToggle when toggle button clicked", () => {
    const onToggle = vi.fn();
    render(<ArticleView content="Content" onToggle={onToggle} />);
    fireEvent.click(screen.getByText("Hide Article"));
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it("does not render toggle button when onToggle not provided", () => {
    render(<ArticleView content="Content" />);
    expect(screen.queryByText("Hide Article")).not.toBeInTheDocument();
    expect(screen.queryByText("Show Article")).not.toBeInTheDocument();
  });
});
