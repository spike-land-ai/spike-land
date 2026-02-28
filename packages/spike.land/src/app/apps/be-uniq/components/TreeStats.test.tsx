import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TreeStats } from "./TreeStats";

const defaultProps = {
  userCount: 42,
  maxDepth: 10,
  nodeCount: 100,
  occupiedLeaves: 15,
};

describe("TreeStats", () => {
  it("renders Players label and user count", () => {
    render(<TreeStats {...defaultProps} />);
    expect(screen.getByText("Players")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("renders Depth label and maxDepth value", () => {
    render(<TreeStats {...defaultProps} />);
    expect(screen.getByText("Depth")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("renders Nodes label and nodeCount value", () => {
    render(<TreeStats {...defaultProps} />);
    expect(screen.getByText("Nodes")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
  });

  it("renders Taken label and occupiedLeaves value", () => {
    render(<TreeStats {...defaultProps} />);
    expect(screen.getByText("Taken")).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument();
  });

  it("renders all four stat pills", () => {
    render(<TreeStats {...defaultProps} />);
    const labels = ["Players", "Depth", "Nodes", "Taken"];
    for (const label of labels) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("renders with zero values", () => {
    render(<TreeStats userCount={0} maxDepth={0} nodeCount={0} occupiedLeaves={0} />);
    expect(screen.getAllByText("0")).toHaveLength(4);
  });

  it("renders large values correctly", () => {
    render(<TreeStats userCount={9999} maxDepth={20} nodeCount={1048575} occupiedLeaves={500} />);
    expect(screen.getByText("9999")).toBeInTheDocument();
    expect(screen.getByText("1048575")).toBeInTheDocument();
  });
});
