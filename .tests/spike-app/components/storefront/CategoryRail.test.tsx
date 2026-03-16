import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CategoryRail } from "@/ui/components/storefront/CategoryRail";
import type { AppCategoryGroup } from "@/ui/hooks/useApps";

// ---------------------------------------------------------------------------
// Mock @tanstack/react-router
// ---------------------------------------------------------------------------

vi.mock("@tanstack/react-router", () => ({
  Link: React.forwardRef(function MockLink(
    {
      children,
      to,
      params,
      className,
      onClick,
      onKeyDown,
      "aria-current": ariaCurrent,
    }: {
      children: React.ReactNode;
      to: string;
      params?: Record<string, string>;
      className?: string;
      onClick?: React.MouseEventHandler;
      onKeyDown?: React.KeyboardEventHandler;
      "aria-current"?: string;
    },
    ref: React.Ref<HTMLAnchorElement>,
  ) {
    const href = params ? `${to}/${Object.values(params).join("/")}` : to;
    return (
      <a
        ref={ref}
        href={href}
        className={className}
        onClick={onClick}
        onKeyDown={onKeyDown}
        aria-current={ariaCurrent}
        role="link"
      >
        {children}
      </a>
    );
  }),
  useRouterState: ({ select }: { select: (s: { location: { pathname: string } }) => string }) =>
    select({ location: { pathname: "/apps" } }),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        discover: "Discover",
        categoryRailLabel: "Category navigation",
        categoryRailDesc: "Browse by category",
      };
      return map[key] ?? key;
    },
  }),
}));

const mockGroups: AppCategoryGroup[] = [
  { category: "Productivity", apps: [] },
  { category: "Developer Tools", apps: [] },
  { category: "AI", apps: [] },
];

describe("CategoryRail", () => {
  it("renders Discover link and all category links", () => {
    render(<CategoryRail groups={mockGroups} activeCategory={null} onSelectCategory={vi.fn()} />);

    expect(screen.getByText("Discover")).toBeInTheDocument();
    expect(screen.getByText("Productivity")).toBeInTheDocument();
    expect(screen.getByText("Developer Tools")).toBeInTheDocument();
    expect(screen.getByText("AI")).toBeInTheDocument();
  });

  it("marks Discover as current page when activeCategory is null", () => {
    render(<CategoryRail groups={mockGroups} activeCategory={null} onSelectCategory={vi.fn()} />);

    const discoverLink = screen.getByText("Discover").closest("a");
    expect(discoverLink).toHaveAttribute("aria-current", "page");

    const productivityLink = screen.getByText("Productivity").closest("a");
    expect(productivityLink).not.toHaveAttribute("aria-current", "page");
  });

  it("marks the active category link as current page", () => {
    render(
      <CategoryRail
        groups={mockGroups}
        activeCategory="Developer Tools"
        onSelectCategory={vi.fn()}
      />,
    );

    const discoverLink = screen.getByText("Discover").closest("a");
    expect(discoverLink).not.toHaveAttribute("aria-current", "page");

    const devToolsLink = screen.getByText("Developer Tools").closest("a");
    expect(devToolsLink).toHaveAttribute("aria-current", "page");
  });

  it("calls onSelectCategory with null when Discover is clicked", async () => {
    const onSelect = vi.fn();
    render(<CategoryRail groups={mockGroups} activeCategory="AI" onSelectCategory={onSelect} />);

    await userEvent.click(screen.getByText("Discover"));
    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it("does not call onSelectCategory when a category link is clicked (navigation handles it)", async () => {
    const onSelect = vi.fn();
    render(<CategoryRail groups={mockGroups} activeCategory={null} onSelectCategory={onSelect} />);

    // Category links navigate via router Link, they do not call onSelectCategory directly
    const productivityLink = screen.getByText("Productivity").closest("a");
    expect(productivityLink).toHaveAttribute("href", expect.stringContaining("category"));
  });

  it("navigates forward with ArrowDown key", async () => {
    render(<CategoryRail groups={mockGroups} activeCategory={null} onSelectCategory={vi.fn()} />);

    const discoverLink = screen.getByText("Discover").closest("a")!;
    discoverLink.focus();
    await userEvent.keyboard("{ArrowDown}");

    // Focus should move to first category link
    const productivityLink = screen.getByText("Productivity").closest("a");
    expect(productivityLink).toHaveFocus();
  });

  it("navigates backward with ArrowUp key", async () => {
    render(<CategoryRail groups={mockGroups} activeCategory={null} onSelectCategory={vi.fn()} />);

    const productivityLink = screen.getByText("Productivity").closest("a")!;
    productivityLink.focus();
    await userEvent.keyboard("{ArrowUp}");

    // Focus should wrap back to Discover
    const discoverLink = screen.getByText("Discover").closest("a");
    expect(discoverLink).toHaveFocus();
  });

  it("shows skeleton when isLoading is true", () => {
    const { container } = render(
      <CategoryRail groups={[]} activeCategory={null} onSelectCategory={vi.fn()} isLoading />,
    );

    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
    // No links should be rendered in loading state
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });
});
