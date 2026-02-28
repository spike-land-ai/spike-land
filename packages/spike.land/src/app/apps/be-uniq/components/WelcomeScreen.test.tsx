import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WelcomeScreen } from "./WelcomeScreen";

const defaultProps = {
  treeStats: null,
  onStart: vi.fn(),
  isLoading: false,
};

describe("WelcomeScreen", () => {
  it("renders the beUniq title", () => {
    render(<WelcomeScreen {...defaultProps} />);
    expect(screen.getByText("beUniq")).toBeInTheDocument();
  });

  it("renders Start Playing button when not loading", () => {
    render(<WelcomeScreen {...defaultProps} />);
    expect(
      screen.getByRole("button", { name: /Start Playing/i }),
    ).toBeInTheDocument();
  });

  it("shows Loading... when isLoading is true", () => {
    render(<WelcomeScreen {...defaultProps} isLoading />);
    expect(screen.getByRole("button", { name: /Loading/i })).toBeInTheDocument();
  });

  it("disables button while loading", () => {
    render(<WelcomeScreen {...defaultProps} isLoading />);
    expect(screen.getByRole("button", { name: /Loading/i })).toBeDisabled();
  });

  it("calls onStart when button is clicked", () => {
    const onStart = vi.fn();
    render(<WelcomeScreen {...defaultProps} onStart={onStart} />);
    fireEvent.click(screen.getByRole("button", { name: /Start Playing/i }));
    expect(onStart).toHaveBeenCalledOnce();
  });

  it("does not render TreeStats when treeStats is null", () => {
    render(<WelcomeScreen {...defaultProps} treeStats={null} />);
    expect(screen.queryByText("Players")).not.toBeInTheDocument();
  });

  it("does not render TreeStats when userCount is 0", () => {
    render(
      <WelcomeScreen
        {...defaultProps}
        treeStats={{ userCount: 0, maxDepth: 5, nodeCount: 10, occupiedLeaves: 0 }}
      />,
    );
    expect(screen.queryByText("Players")).not.toBeInTheDocument();
  });

  it("renders TreeStats when treeStats has users", () => {
    render(
      <WelcomeScreen
        {...defaultProps}
        treeStats={{ userCount: 42, maxDepth: 8, nodeCount: 63, occupiedLeaves: 12 }}
      />,
    );
    expect(screen.getByText("Players")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("renders the three how-it-works steps", () => {
    render(<WelcomeScreen {...defaultProps} />);
    expect(screen.getByText("Answer")).toBeInTheDocument();
    expect(screen.getByText("Navigate")).toBeInTheDocument();
    expect(screen.getByText("Be Unique")).toBeInTheDocument();
  });

  it("renders tagline text about uniqueness", () => {
    render(<WelcomeScreen {...defaultProps} />);
    expect(
      screen.getByText(/one nobody else has chosen/i),
    ).toBeInTheDocument();
  });
});
