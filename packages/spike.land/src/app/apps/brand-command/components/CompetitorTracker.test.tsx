import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CompetitorTracker } from "./CompetitorTracker";

vi.mock("lucide-react", () => ({
  Activity: () => <svg data-testid="icon-activity" />,
  Loader2: () => <svg data-testid="icon-loader" />,
  RefreshCw: () => <svg data-testid="icon-refresh" />,
  Tag: () => <svg data-testid="icon-tag" />,
  TrendingUp: () => <svg data-testid="icon-trending-up" />,
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
  trendLoading: false,
  competitorData: undefined,
  trendData: undefined,
  onFetchCompetitors: vi.fn(),
  onFetchTrends: vi.fn(),
};

describe("CompetitorTracker", () => {
  it("renders the Market Pulse heading", () => {
    render(<CompetitorTracker {...defaultProps} />);
    expect(screen.getByText("Market Pulse")).toBeInTheDocument();
  });

  it("renders default trending keywords when trendData is undefined", () => {
    render(<CompetitorTracker {...defaultProps} />);
    expect(screen.getByText("AI First")).toBeInTheDocument();
    expect(screen.getByText("Composable Architecture")).toBeInTheDocument();
    expect(screen.getByText("Autonomous Swarms")).toBeInTheDocument();
    expect(screen.getByText("Token Economy")).toBeInTheDocument();
  });

  it("renders default competitors when competitorData is undefined", () => {
    render(<CompetitorTracker {...defaultProps} />);
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.getByText("New SaaS Launch")).toBeInTheDocument();
    expect(screen.getByText("Global Dyn")).toBeInTheDocument();
    expect(screen.getByText("Series B Raised")).toBeInTheDocument();
  });

  it("renders competitor data from props when provided as array", () => {
    const competitorData = [
      { name: "Rival Inc", event: "Product Launch", time: "1h ago" },
    ];
    render(<CompetitorTracker {...defaultProps} competitorData={competitorData} />);
    expect(screen.getByText("Rival Inc")).toBeInTheDocument();
    expect(screen.getByText("Product Launch")).toBeInTheDocument();
    expect(screen.getByText("1h ago")).toBeInTheDocument();
  });

  it("renders trend data from props when provided as string array", () => {
    const trendData = ["Web3", "Edge Computing"];
    render(<CompetitorTracker {...defaultProps} trendData={trendData} />);
    expect(screen.getByText("Web3")).toBeInTheDocument();
    expect(screen.getByText("Edge Computing")).toBeInTheDocument();
  });

  it("renders trend data from props when provided as object array with topic key", () => {
    const trendData = [{ topic: "Generative AI" }, { topic: "RAG Pipelines" }];
    render(<CompetitorTracker {...defaultProps} trendData={trendData} />);
    expect(screen.getByText("Generative AI")).toBeInTheDocument();
    expect(screen.getByText("RAG Pipelines")).toBeInTheDocument();
  });

  it("calls onFetchTrends when trend refresh button is clicked", async () => {
    const onFetchTrends = vi.fn();
    render(<CompetitorTracker {...defaultProps} onFetchTrends={onFetchTrends} />);
    const buttons = screen.getAllByRole("button");
    // First button is the trend refresh
    await userEvent.click(buttons[0]!);
    expect(onFetchTrends).toHaveBeenCalledOnce();
  });

  it("calls onFetchCompetitors when competitor refresh button is clicked", async () => {
    const onFetchCompetitors = vi.fn();
    render(
      <CompetitorTracker {...defaultProps} onFetchCompetitors={onFetchCompetitors} />,
    );
    const buttons = screen.getAllByRole("button");
    // Second button is the competitor refresh
    await userEvent.click(buttons[1]!);
    expect(onFetchCompetitors).toHaveBeenCalledOnce();
  });

  it("disables trend button when trendLoading is true", () => {
    render(<CompetitorTracker {...defaultProps} trendLoading />);
    const buttons = screen.getAllByRole("button");
    expect(buttons[0]).toBeDisabled();
  });

  it("disables competitor button when isLoading is true", () => {
    render(<CompetitorTracker {...defaultProps} isLoading />);
    const buttons = screen.getAllByRole("button");
    expect(buttons[1]).toBeDisabled();
  });

  it("falls back to defaults when competitorData is an empty array", () => {
    render(<CompetitorTracker {...defaultProps} competitorData={[]} />);
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
  });

  it("falls back to defaults when trendData is an empty array", () => {
    render(<CompetitorTracker {...defaultProps} trendData={[]} />);
    expect(screen.getByText("AI First")).toBeInTheDocument();
  });
});
