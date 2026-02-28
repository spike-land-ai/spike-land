import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PolicyChecker } from "./PolicyChecker";

vi.mock("lucide-react", () => ({
  ShieldCheck: () => <svg data-testid="icon-shield-check" />,
  ShieldAlert: () => <svg data-testid="icon-shield-alert" />,
  AlertCircle: () => <svg data-testid="icon-alert-circle" />,
  CheckCircle2: () => <svg data-testid="icon-check-circle" />,
  XCircle: () => <svg data-testid="icon-x-circle" />,
  Loader2: () => <svg data-testid="icon-loader" />,
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
  onCheck: vi.fn(),
  onReset: vi.fn(),
};

describe("PolicyChecker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the Brand Policy Checker heading", () => {
    render(<PolicyChecker {...defaultProps} />);
    expect(screen.getByText("Brand Policy Checker")).toBeInTheDocument();
  });

  it("renders the description text", () => {
    render(<PolicyChecker {...defaultProps} />);
    expect(
      screen.getByText(
        /Paste any content to verify it meets your brand guidelines/,
      ),
    ).toBeInTheDocument();
  });

  it("renders the content textarea with placeholder", () => {
    render(<PolicyChecker {...defaultProps} />);
    expect(
      screen.getByPlaceholderText("Paste your copy, headline, or message here..."),
    ).toBeInTheDocument();
  });

  it("renders Check Policy button disabled when content is empty", () => {
    render(<PolicyChecker {...defaultProps} />);
    expect(
      screen.getByRole("button", { name: /check policy/i }),
    ).toBeDisabled();
  });

  it("enables Check Policy button when content is typed", async () => {
    render(<PolicyChecker {...defaultProps} />);
    const textarea = screen.getByPlaceholderText(
      "Paste your copy, headline, or message here...",
    );
    await userEvent.type(textarea, "Our amazing product");
    expect(
      screen.getByRole("button", { name: /check policy/i }),
    ).not.toBeDisabled();
  });

  it("calls onCheck with content when button is clicked", async () => {
    const onCheck = vi.fn();
    render(<PolicyChecker {...defaultProps} onCheck={onCheck} />);
    const textarea = screen.getByPlaceholderText(
      "Paste your copy, headline, or message here...",
    );
    await userEvent.type(textarea, "Content to check");
    await userEvent.click(screen.getByRole("button", { name: /check policy/i }));
    expect(onCheck).toHaveBeenCalledWith({ content: "Content to check" });
  });

  it("shows Checking... when isLoading is true", () => {
    render(<PolicyChecker {...defaultProps} isLoading />);
    expect(screen.getByText("Checking...")).toBeInTheDocument();
  });

  it("does not show result section when result is undefined", () => {
    render(<PolicyChecker {...defaultProps} />);
    expect(screen.queryByText("Policy Compliant")).not.toBeInTheDocument();
    expect(screen.queryByText("Policy Violations Found")).not.toBeInTheDocument();
  });

  it("shows Policy Compliant when result.passed is true", () => {
    render(
      <PolicyChecker
        {...defaultProps}
        result={{ passed: true, score: 95, issues: [] }}
      />,
    );
    expect(screen.getByText("Policy Compliant")).toBeInTheDocument();
    expect(screen.getByText("95%")).toBeInTheDocument();
  });

  it("shows Policy Violations Found when result.passed is false", () => {
    render(
      <PolicyChecker
        {...defaultProps}
        result={{
          passed: false,
          score: 40,
          issues: [{ severity: "error", message: "Violation detected" }],
        }}
      />,
    );
    expect(screen.getByText("Policy Violations Found")).toBeInTheDocument();
    expect(screen.getByText("40%")).toBeInTheDocument();
  });

  it("renders issues list when issues are present", () => {
    render(
      <PolicyChecker
        {...defaultProps}
        result={{
          passed: false,
          score: 60,
          issues: [
            { severity: "error", message: "Missing disclaimer" },
            { severity: "warning", message: "Tone too informal" },
            { severity: "info", message: "Consider adding CTA" },
          ],
        }}
      />,
    );
    expect(screen.getByText("Missing disclaimer")).toBeInTheDocument();
    expect(screen.getByText("Tone too informal")).toBeInTheDocument();
    expect(screen.getByText("Consider adding CTA")).toBeInTheDocument();
  });

  it("handles issues as string array in result", () => {
    render(
      <PolicyChecker
        {...defaultProps}
        result={{
          passed: false,
          score: 50,
          issues: ["Use proper capitalization"],
        }}
      />,
    );
    expect(screen.getByText("Use proper capitalization")).toBeInTheDocument();
  });

  it("shows compliant message when passed and no issues", () => {
    render(
      <PolicyChecker
        {...defaultProps}
        result={{ passed: true, score: 100, issues: [] }}
      />,
    );
    expect(
      screen.getByText("Your content fully meets all brand policy guidelines."),
    ).toBeInTheDocument();
  });

  it("uses compliant field as fallback for passed", () => {
    render(
      <PolicyChecker
        {...defaultProps}
        result={{ compliant: true, score: 88, issues: [] }}
      />,
    );
    expect(screen.getByText("Policy Compliant")).toBeInTheDocument();
  });

  it("shows Clear button when result is present and calls onReset", async () => {
    const onReset = vi.fn();
    render(
      <PolicyChecker
        {...defaultProps}
        result={{ passed: true, score: 100, issues: [] }}
        onReset={onReset}
      />,
    );
    const clearBtn = screen.getByRole("button", { name: "Clear" });
    await userEvent.click(clearBtn);
    expect(onReset).toHaveBeenCalledOnce();
  });

  it("shows correct issue count label", () => {
    render(
      <PolicyChecker
        {...defaultProps}
        result={{
          passed: false,
          score: 70,
          issues: [
            { severity: "warning", message: "Issue A" },
            { severity: "error", message: "Issue B" },
          ],
        }}
      />,
    );
    expect(screen.getByText("2 issues detected")).toBeInTheDocument();
  });

  it("shows singular issue label for 1 issue", () => {
    render(
      <PolicyChecker
        {...defaultProps}
        result={{
          passed: false,
          score: 70,
          issues: [{ severity: "warning", message: "Just one issue" }],
        }}
      />,
    );
    expect(screen.getByText("1 issue detected")).toBeInTheDocument();
  });
});
