import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProfileInsight } from "./ProfileInsight";

const defaultProfile = {
  tags: ["tech", "music"],
  leafNodeId: "leaf-existing",
  answerCount: 3,
};

const defaultProps = {
  profile: defaultProfile,
  onPlayAgain: vi.fn(),
  onBackToWelcome: vi.fn(),
  isLoading: false,
};

describe("ProfileInsight", () => {
  it("renders 'Already Profiled' heading", () => {
    render(<ProfileInsight {...defaultProps} />);
    expect(screen.getByText("Already Profiled")).toBeInTheDocument();
  });

  it("renders the explanation subtitle", () => {
    render(<ProfileInsight {...defaultProps} />);
    expect(
      screen.getByText(/You've already found your unique spot/i),
    ).toBeInTheDocument();
  });

  it("renders the profile card when profile is provided", () => {
    render(<ProfileInsight {...defaultProps} />);
    expect(screen.getByText("Your Profile")).toBeInTheDocument();
  });

  it("does not render profile card when profile is null", () => {
    render(<ProfileInsight {...defaultProps} profile={null} />);
    expect(screen.queryByText("Your Profile")).not.toBeInTheDocument();
  });

  it("displays the answer count", () => {
    render(<ProfileInsight {...defaultProps} />);
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("Questions Answered")).toBeInTheDocument();
  });

  it("displays the tag count", () => {
    render(<ProfileInsight {...defaultProps} />);
    // Profile has 2 tags
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("Profile Tags")).toBeInTheDocument();
  });

  it("renders profile tags when present", () => {
    render(<ProfileInsight {...defaultProps} />);
    expect(screen.getByText("tech")).toBeInTheDocument();
    expect(screen.getByText("music")).toBeInTheDocument();
  });

  it("does not render tags section when profile has no tags", () => {
    render(
      <ProfileInsight
        {...defaultProps}
        profile={{ tags: [], leafNodeId: "leaf-x", answerCount: 0 }}
      />,
    );
    expect(screen.queryByText("Derived Tags")).not.toBeInTheDocument();
  });

  it("renders the leaf node ID", () => {
    render(<ProfileInsight {...defaultProps} />);
    expect(screen.getByText(/Leaf: leaf-existing/i)).toBeInTheDocument();
  });

  it("renders Home button", () => {
    render(<ProfileInsight {...defaultProps} />);
    expect(screen.getByRole("button", { name: /Home/i })).toBeInTheDocument();
  });

  it("renders Reset & Play Again button", () => {
    render(<ProfileInsight {...defaultProps} />);
    expect(
      screen.getByRole("button", { name: /Reset & Play Again/i }),
    ).toBeInTheDocument();
  });

  it("calls onBackToWelcome when Home is clicked", () => {
    const onBackToWelcome = vi.fn();
    render(<ProfileInsight {...defaultProps} onBackToWelcome={onBackToWelcome} />);
    fireEvent.click(screen.getByRole("button", { name: /Home/i }));
    expect(onBackToWelcome).toHaveBeenCalledOnce();
  });

  it("calls onPlayAgain when Reset & Play Again is clicked", () => {
    const onPlayAgain = vi.fn();
    render(<ProfileInsight {...defaultProps} onPlayAgain={onPlayAgain} />);
    fireEvent.click(screen.getByRole("button", { name: /Reset & Play Again/i }));
    expect(onPlayAgain).toHaveBeenCalledOnce();
  });

  it("disables Reset & Play Again button when loading", () => {
    render(<ProfileInsight {...defaultProps} isLoading />);
    expect(
      screen.getByRole("button", { name: /Reset & Play Again/i }),
    ).toBeDisabled();
  });

  it("shows tag count as 0 when profile has no tags", () => {
    render(
      <ProfileInsight
        {...defaultProps}
        profile={{ tags: [], leafNodeId: "leaf-y", answerCount: 5 }}
      />,
    );
    expect(screen.getByText("0")).toBeInTheDocument();
  });
});
