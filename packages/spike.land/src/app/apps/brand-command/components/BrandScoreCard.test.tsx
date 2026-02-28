import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrandScoreCard } from "./BrandScoreCard";

vi.mock("lucide-react", () => ({
  ShieldCheck: () => <svg data-testid="icon-shield-check" />,
  TrendingUp: () => <svg data-testid="icon-trending-up" />,
  TrendingDown: () => <svg data-testid="icon-trending-down" />,
  Minus: () => <svg data-testid="icon-minus" />,
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

const ITEMS = [
  { name: "Homepage", score: 98, status: "Perfect Match" },
  { name: "Twitter Thread", score: 82, status: "Slightly Off-Tone" },
  { name: "Support Email", score: 60, status: "Off-Brand" },
];

describe("BrandScoreCard", () => {
  it("renders the section heading", () => {
    render(<BrandScoreCard items={ITEMS} onReview={vi.fn()} />);
    expect(screen.getByText("Brand Voice Integrity")).toBeInTheDocument();
  });

  it("renders all item names", () => {
    render(<BrandScoreCard items={ITEMS} onReview={vi.fn()} />);
    expect(screen.getByText("Homepage")).toBeInTheDocument();
    expect(screen.getByText("Twitter Thread")).toBeInTheDocument();
    expect(screen.getByText("Support Email")).toBeInTheDocument();
  });

  it("renders scores with percent sign", () => {
    render(<BrandScoreCard items={ITEMS} onReview={vi.fn()} />);
    expect(screen.getByText("98%")).toBeInTheDocument();
    expect(screen.getByText("82%")).toBeInTheDocument();
    expect(screen.getByText("60%")).toBeInTheDocument();
  });

  it("renders status labels for each item", () => {
    render(<BrandScoreCard items={ITEMS} onReview={vi.fn()} />);
    expect(screen.getByText("Perfect Match")).toBeInTheDocument();
    expect(screen.getByText("Slightly Off-Tone")).toBeInTheDocument();
    expect(screen.getByText("Off-Brand")).toBeInTheDocument();
  });

  it("renders a Review button for each item", () => {
    render(<BrandScoreCard items={ITEMS} onReview={vi.fn()} />);
    const reviewButtons = screen.getAllByRole("button", { name: "Review" });
    expect(reviewButtons).toHaveLength(ITEMS.length);
  });

  it("calls onReview with the item name when Review is clicked", async () => {
    const onReview = vi.fn();
    render(<BrandScoreCard items={ITEMS} onReview={onReview} />);
    const reviewButtons = screen.getAllByRole("button", { name: "Review" });
    await userEvent.click(reviewButtons[0]!);
    expect(onReview).toHaveBeenCalledWith("Homepage");
  });

  it("calls onReview with the correct name for each item", async () => {
    const onReview = vi.fn();
    render(<BrandScoreCard items={ITEMS} onReview={onReview} />);
    const reviewButtons = screen.getAllByRole("button", { name: "Review" });
    await userEvent.click(reviewButtons[1]!);
    expect(onReview).toHaveBeenCalledWith("Twitter Thread");
    await userEvent.click(reviewButtons[2]!);
    expect(onReview).toHaveBeenCalledWith("Support Email");
  });

  it("renders with an empty items array without crashing", () => {
    render(<BrandScoreCard items={[]} onReview={vi.fn()} />);
    expect(screen.getByText("Brand Voice Integrity")).toBeInTheDocument();
    expect(screen.queryAllByRole("button", { name: "Review" })).toHaveLength(0);
  });
});
