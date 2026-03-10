import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StoreSection } from "../StoreSection";
import type { McpAppSummary } from "../../../hooks/useApps";

describe("StoreSection", () => {
  const mockApps: McpAppSummary[] = [
    {
      slug: "app1",
      name: "App 1",
      description: "Desc 1",
      emoji: "🔧",
      category: "Cat 1",
      tags: [],
      tagline: "Tag 1",
      pricing: "free",
      is_featured: false,
      is_new: false,
      tool_count: 1,
      sort_order: 1,
    },
    {
      slug: "app2",
      name: "App 2",
      description: "Desc 2",
      emoji: "🔧",
      category: "Cat 1",
      tags: [],
      tagline: "Tag 2",
      pricing: "free",
      is_featured: false,
      is_new: false,
      tool_count: 1,
      sort_order: 2,
    },
  ];

  it("renders nothing when no apps provided", () => {
    const { container } = render(<StoreSection title="Testing" apps={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders title, subtitle, and apps", () => {
    render(<StoreSection title="Featured" subtitle="Best apps" apps={mockApps} layout="grid" />);

    expect(screen.getByText("Featured")).toBeInTheDocument();
    expect(screen.getByText("Best apps")).toBeInTheDocument();
    expect(screen.getByText("App 1")).toBeInTheDocument();
    expect(screen.getByText("App 2")).toBeInTheDocument();
  });
});
