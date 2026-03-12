import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChessArenaApp } from "../chess-arena";

describe("ChessArenaApp", () => {
  it("starts a match and lets the user play a legal move", () => {
    render(<ChessArenaApp />);

    fireEvent.click(screen.getByRole("button", { name: "Start match" }));
    fireEvent.click(screen.getByRole("button", { name: /Square e2, white pawn/i }));
    fireEvent.click(screen.getByRole("button", { name: /Square e4, empty square/i }));

    expect(screen.getByText(/You played e4\./i)).toBeInTheDocument();
    expect(screen.getByText("e4")).toBeInTheDocument();
  }, 60_000);

  it("wires the supporting controls and presets", () => {
    render(<ChessArenaApp />);

    fireEvent.click(screen.getByRole("button", { name: /rookie\.dev vs ops-bot/i }));
    expect(screen.getByText(/tuned the board to rapid/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Hint" }));
    expect(screen.getByText(/Start a match first/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Flip board" }));
    expect(screen.getByText(/Board flipped\./i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Start match" }));
    fireEvent.click(screen.getByRole("button", { name: /Square e2, white pawn/i }));
    fireEvent.click(screen.getByRole("button", { name: /Square e4, empty square/i }));

    fireEvent.click(screen.getByRole("button", { name: "Undo turn" }));
    expect(screen.getByText(/Took back e4/i)).toBeInTheDocument();
    expect(screen.getByText("No moves yet.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Resign" }));
    expect(screen.getByText(/You resigned\./i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Play again" })).toBeInTheDocument();
  }, 60_000);

  it("starts correctly from the black side", () => {
    render(<ChessArenaApp />);

    fireEvent.click(screen.getByRole("button", { name: "Black" }));
    fireEvent.click(screen.getByRole("button", { name: "Start match" }));

    expect(screen.getByText(/opened with/i)).toBeInTheDocument();
    expect(screen.getByText(/Black at the bottom/i)).toBeInTheDocument();
  }, 60_000);
});
