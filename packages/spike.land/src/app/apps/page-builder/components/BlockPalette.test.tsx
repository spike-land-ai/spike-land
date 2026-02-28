import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BlockPalette } from "./BlockPalette";
import type { BlockType } from "./BlockPalette";

// ScrollArea passthrough
vi.mock("@/components/ui/scroll-area", () => ({
  ScrollArea: ({ children }: { children: React.ReactNode; }) => <div>{children}</div>,
}));

describe("BlockPalette", () => {
  it("renders all category headings", () => {
    render(<BlockPalette onAddBlock={vi.fn()} />);
    expect(screen.getByText("Content")).toBeInTheDocument();
    expect(screen.getByText("Layout")).toBeInTheDocument();
    expect(screen.getByText("Sections")).toBeInTheDocument();
  });

  it("renders block buttons", () => {
    render(<BlockPalette onAddBlock={vi.fn()} />);
    expect(screen.getByText("Heading")).toBeInTheDocument();
    expect(screen.getByText("Paragraph")).toBeInTheDocument();
    expect(screen.getByText("Image")).toBeInTheDocument();
    expect(screen.getByText("Video")).toBeInTheDocument();
    expect(screen.getByText("Embed")).toBeInTheDocument();
    expect(screen.getByText("List")).toBeInTheDocument();
    expect(screen.getByText("Quote")).toBeInTheDocument();
  });

  it("renders layout blocks", () => {
    render(<BlockPalette onAddBlock={vi.fn()} />);
    expect(screen.getByText("Columns")).toBeInTheDocument();
    expect(screen.getByText("Divider")).toBeInTheDocument();
  });

  it("renders section blocks", () => {
    render(<BlockPalette onAddBlock={vi.fn()} />);
    expect(screen.getByText("Hero Section")).toBeInTheDocument();
    expect(screen.getByText("Features Grid")).toBeInTheDocument();
    expect(screen.getByText("Testimonials")).toBeInTheDocument();
    expect(screen.getByText("Pricing Table")).toBeInTheDocument();
    expect(screen.getByText("Contact Form")).toBeInTheDocument();
  });

  it("calls onAddBlock with correct type when heading button is clicked", async () => {
    const onAddBlock = vi.fn();
    render(<BlockPalette onAddBlock={onAddBlock} />);
    await userEvent.click(screen.getByTitle("H1–H6 text"));
    expect(onAddBlock).toHaveBeenCalledWith("heading" satisfies BlockType);
  });

  it("calls onAddBlock with correct type when hero button is clicked", async () => {
    const onAddBlock = vi.fn();
    render(<BlockPalette onAddBlock={onAddBlock} />);
    await userEvent.click(screen.getByTitle("Full-width hero banner"));
    expect(onAddBlock).toHaveBeenCalledWith("hero" satisfies BlockType);
  });

  it("calls onAddBlock with correct type when contact button is clicked", async () => {
    const onAddBlock = vi.fn();
    render(<BlockPalette onAddBlock={onAddBlock} />);
    await userEvent.click(screen.getByTitle("Lead capture form"));
    expect(onAddBlock).toHaveBeenCalledWith("contact" satisfies BlockType);
  });

  it("calls onAddBlock each time a different block is clicked", async () => {
    const onAddBlock = vi.fn();
    render(<BlockPalette onAddBlock={onAddBlock} />);
    await userEvent.click(screen.getByTitle("Rich text block"));
    await userEvent.click(screen.getByTitle("Ordered or unordered list"));
    expect(onAddBlock).toHaveBeenCalledTimes(2);
    expect(onAddBlock).toHaveBeenNthCalledWith(1, "paragraph");
    expect(onAddBlock).toHaveBeenNthCalledWith(2, "list");
  });

  it("renders block descriptions as button titles", () => {
    render(<BlockPalette onAddBlock={vi.fn()} />);
    expect(screen.getByTitle("Multi-column layout")).toBeInTheDocument();
    expect(screen.getByTitle("Horizontal rule")).toBeInTheDocument();
    expect(screen.getByTitle("Customer quotes")).toBeInTheDocument();
    expect(screen.getByTitle("Pricing tiers")).toBeInTheDocument();
  });

  it("renders exactly 14 block buttons", () => {
    render(<BlockPalette onAddBlock={vi.fn()} />);
    // All blocks are rendered as buttons
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(14);
  });
});
