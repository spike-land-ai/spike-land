import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CategoryRail } from "../CategoryRail";
import type { AppCategoryGroup, McpAppSummary } from "../../../hooks/useApps";

describe("CategoryRail", () => {
  const mockGroups: AppCategoryGroup[] = [
    {
      category: "Code & Developer Tools",
      apps: [{ slug: "app1", name: "App 1", description: "Desc 1", emoji: "🔧", category: "Code & Developer Tools", tags: [], tagline: "Tag 1", pricing: "free", is_featured: false, is_new: false, tool_count: 1, sort_order: 1 } as McpAppSummary],
    },
    {
      category: "Agents & Collaboration",
      apps: [{ slug: "app2", name: "App 2", description: "Desc 2", emoji: "🔧", category: "Agents & Collaboration", tags: [], tagline: "Tag 2", pricing: "free", is_featured: false, is_new: false, tool_count: 1, sort_order: 2 } as McpAppSummary],
    },
  ];

  it("renders Discover option and handles click", () => {
    const mockOnSelect = vi.fn();
    render(
      <CategoryRail
        groups={mockGroups}
        activeCategory={null}
        onSelectCategory={mockOnSelect}
      />
    );

    const discoverBtn = screen.getByRole("button", { name: /Discover/i });
    expect(discoverBtn).toBeInTheDocument();

    // Test styling when active
    expect(discoverBtn.className).toContain("bg-primary");

    fireEvent.click(discoverBtn);
    expect(mockOnSelect).toHaveBeenCalledWith(null);
  });

  it("renders group categories and displays app count when active", () => {
    const mockOnSelect = vi.fn();
    render(
      <CategoryRail
        groups={mockGroups}
        activeCategory="Code & Developer Tools"
        onSelectCategory={mockOnSelect}
      />
    );

    const activeBtn = screen.getByRole("button", { name: /Code & Developer Tools 1/i });
    expect(activeBtn).toBeInTheDocument();
    expect(activeBtn.className).toContain("bg-muted");

    const inactiveBtn = screen.getByRole("button", { name: /Agents & Collaboration/i });
    expect(inactiveBtn).toBeInTheDocument();

    fireEvent.click(inactiveBtn);
    expect(mockOnSelect).toHaveBeenCalledWith("Agents & Collaboration");
  });
});
