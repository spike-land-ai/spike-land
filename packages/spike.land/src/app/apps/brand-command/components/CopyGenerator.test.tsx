import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CopyGenerator } from "./CopyGenerator";

vi.mock("lucide-react", () => ({
  PenTool: () => <svg data-testid="icon-pen-tool" />,
  Sparkles: () => <svg data-testid="icon-sparkles" />,
  Loader2: () => <svg data-testid="icon-loader" />,
  Copy: () => <svg data-testid="icon-copy" />,
  RefreshCw: () => <svg data-testid="icon-refresh" />,
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    disabled,
    ...rest
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: string;
    size?: string;
  }) => (
    <button onClick={onClick} disabled={disabled} {...rest}>
      {children}
    </button>
  ),
}));

const defaultProps = {
  isLoading: false,
  result: undefined,
  onGenerate: vi.fn(),
  onReset: vi.fn(),
};

describe("CopyGenerator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the AI Copy Generator heading", () => {
    render(<CopyGenerator {...defaultProps} />);
    expect(screen.getByText("AI Copy Generator")).toBeInTheDocument();
  });

  it("renders all four copy type buttons", () => {
    render(<CopyGenerator {...defaultProps} />);
    expect(screen.getByRole("button", { name: "Ad Copy" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tagline" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Email Subject" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Social Post" }),
    ).toBeInTheDocument();
  });

  it("renders the prompt textarea", () => {
    render(<CopyGenerator {...defaultProps} />);
    expect(
      screen.getByPlaceholderText(
        "Describe your brand, product, or campaign goal...",
      ),
    ).toBeInTheDocument();
  });

  it("renders the Generate Copy button disabled when prompt is empty", () => {
    render(<CopyGenerator {...defaultProps} />);
    const generateBtn = screen.getByRole("button", { name: /generate copy/i });
    expect(generateBtn).toBeDisabled();
  });

  it("enables Generate Copy button when prompt has text", async () => {
    render(<CopyGenerator {...defaultProps} />);
    const textarea = screen.getByPlaceholderText(
      "Describe your brand, product, or campaign goal...",
    );
    await userEvent.type(textarea, "Premium sports wear brand");
    const generateBtn = screen.getByRole("button", { name: /generate copy/i });
    expect(generateBtn).not.toBeDisabled();
  });

  it("calls onGenerate with selectedType and prompt when clicked", async () => {
    const onGenerate = vi.fn();
    render(<CopyGenerator {...defaultProps} onGenerate={onGenerate} />);
    const textarea = screen.getByPlaceholderText(
      "Describe your brand, product, or campaign goal...",
    );
    await userEvent.type(textarea, "Our product description");
    const generateBtn = screen.getByRole("button", { name: /generate copy/i });
    await userEvent.click(generateBtn);
    expect(onGenerate).toHaveBeenCalledWith({
      type: "ad",
      prompt: "Our product description",
    });
  });

  it("changes selectedType when a type button is clicked", async () => {
    const onGenerate = vi.fn();
    render(<CopyGenerator {...defaultProps} onGenerate={onGenerate} />);
    const textarea = screen.getByPlaceholderText(
      "Describe your brand, product, or campaign goal...",
    );
    await userEvent.type(textarea, "Test prompt");
    const taglineBtn = screen.getByRole("button", { name: "Tagline" });
    await userEvent.click(taglineBtn);
    const generateBtn = screen.getByRole("button", { name: /generate copy/i });
    await userEvent.click(generateBtn);
    expect(onGenerate).toHaveBeenCalledWith({
      type: "tagline",
      prompt: "Test prompt",
    });
  });

  it("shows Generating... when isLoading is true", () => {
    render(<CopyGenerator {...defaultProps} isLoading />);
    expect(screen.getByText("Generating...")).toBeInTheDocument();
  });

  it("does not show result section when result is undefined", () => {
    render(<CopyGenerator {...defaultProps} />);
    expect(screen.queryByText("Generated Copy")).not.toBeInTheDocument();
  });

  it("shows generated text when result is a string", () => {
    render(
      <CopyGenerator {...defaultProps} result="Launch your brand to the stars!" />,
    );
    expect(
      screen.getByText("Launch your brand to the stars!"),
    ).toBeInTheDocument();
    expect(screen.getByText("Generated Copy")).toBeInTheDocument();
  });

  it("extracts content from result.content string", () => {
    render(
      <CopyGenerator
        {...defaultProps}
        result={{ content: "Extracted from content field" }}
      />,
    );
    expect(
      screen.getByText("Extracted from content field"),
    ).toBeInTheDocument();
  });

  it("extracts content from result.text string", () => {
    render(
      <CopyGenerator {...defaultProps} result={{ text: "Text field value" }} />,
    );
    expect(screen.getByText("Text field value")).toBeInTheDocument();
  });

  it("extracts content from result.result string", () => {
    render(
      <CopyGenerator
        {...defaultProps}
        result={{ result: "Result field value" }}
      />,
    );
    expect(screen.getByText("Result field value")).toBeInTheDocument();
  });

  it("shows reset button when result is present and calls onReset", async () => {
    const onReset = vi.fn();
    render(
      <CopyGenerator {...defaultProps} result="Some copy" onReset={onReset} />,
    );
    const resetBtn = screen.getAllByRole("button").find(
      btn => btn.querySelector("[data-testid='icon-refresh']"),
    );
    expect(resetBtn).toBeTruthy();
    if (resetBtn) await userEvent.click(resetBtn);
    expect(onReset).toHaveBeenCalledOnce();
  });

  it("does not call onGenerate when prompt is only whitespace", async () => {
    const onGenerate = vi.fn();
    render(<CopyGenerator {...defaultProps} onGenerate={onGenerate} />);
    const textarea = screen.getByPlaceholderText(
      "Describe your brand, product, or campaign goal...",
    );
    await userEvent.type(textarea, "   ");
    // Generate button should still be disabled for whitespace-only
    const generateBtn = screen.getByRole("button", { name: /generate copy/i });
    expect(generateBtn).toBeDisabled();
    expect(onGenerate).not.toHaveBeenCalled();
  });
});
