import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { PagesTemplateChooserApp } from "../../../src/frontend/platform-frontend/ui/apps/pages-template-chooser";

function getSidebar() {
  return screen.getByRole("listbox", { name: "Template categories" });
}

function clickSidebarCategory(name: RegExp) {
  fireEvent.click(within(getSidebar()).getByRole("option", { name }));
}

beforeEach(() => {
  localStorage.clear();
});

describe("PagesTemplateChooserApp", () => {
  it("shows the premium banner on the all templates view", () => {
    render(<PagesTemplateChooserApp />);

    expect(screen.getByText("Included with Apple Creator Studio")).toBeInTheDocument();
    expect(screen.getByText("Elevate Your Documents")).toBeInTheDocument();
  });

  it("filters down to premium templates", () => {
    render(<PagesTemplateChooserApp />);

    clickSidebarCategory(/Premium/);

    expect(screen.getByText("Culinary Plain Proposal")).toBeInTheDocument();
    expect(screen.queryByText("Blank Layout")).not.toBeInTheDocument();
  }, 60_000);

  it("enables create once a template is selected", () => {
    render(<PagesTemplateChooserApp />);

    clickSidebarCategory(/Basic/);

    const createButton = screen.getByRole("button", { name: "Create" });
    expect(createButton).toBeDisabled();

    const grid = screen.getByRole("listbox", { name: "Templates" });
    fireEvent.click(within(grid).getByRole("option", { name: /Blank Black/i }));

    expect(createButton).toBeEnabled();
    expect(screen.getAllByText(/Selected: Blank Black/).length).toBeGreaterThanOrEqual(1);
  }, 60_000);

  it("sidebar has listbox role and options have aria-selected", () => {
    render(<PagesTemplateChooserApp />);

    const sidebar = getSidebar();
    expect(sidebar).toBeInTheDocument();

    const allOption = within(sidebar).getByRole("option", { name: /All Templates/ });
    expect(allOption).toHaveAttribute("aria-selected", "true");

    const premiumOption = within(sidebar).getByRole("option", { name: /Premium/ });
    expect(premiumOption).toHaveAttribute("aria-selected", "false");
  });

  it("sidebar keyboard nav: ArrowDown moves active category", () => {
    render(<PagesTemplateChooserApp />);

    const sidebar = getSidebar();
    const allOption = within(sidebar).getByRole("option", { name: /All Templates/ });
    allOption.focus();

    fireEvent.keyDown(sidebar, { key: "ArrowDown" });

    const premiumOption = within(sidebar).getByRole("option", { name: /Premium/ });
    expect(premiumOption).toHaveAttribute("aria-selected", "true");
    expect(allOption).toHaveAttribute("aria-selected", "false");
  });

  it("grid cards have role=option and aria-selected", () => {
    render(<PagesTemplateChooserApp />);

    clickSidebarCategory(/Basic/);

    const grid = screen.getByRole("listbox", { name: "Templates" });
    const cards = within(grid).getAllByRole("option");
    expect(cards.length).toBeGreaterThan(0);

    for (const card of cards) {
      expect(card).toHaveAttribute("aria-selected");
    }
  });

  it("Escape deselects the selected template", () => {
    render(<PagesTemplateChooserApp />);

    clickSidebarCategory(/Basic/);
    const grid = screen.getByRole("listbox", { name: "Templates" });
    const card = within(grid).getByRole("option", { name: /^Blank$/ });
    fireEvent.click(card);
    expect(card).toHaveAttribute("aria-selected", "true");

    fireEvent.keyDown(grid.parentElement!, { key: "Escape" });

    expect(card).toHaveAttribute("aria-selected", "false");
  });

  it("live region announces template name on selection", () => {
    render(<PagesTemplateChooserApp />);

    clickSidebarCategory(/Basic/);
    const grid = screen.getByRole("listbox", { name: "Templates" });
    const card = within(grid).getByRole("option", { name: /^Blank$/ });
    fireEvent.click(card);

    const liveRegion = screen.getByRole("status");
    expect(liveRegion).toHaveTextContent("Selected: Blank");
  });

  it("recent tracking: selecting templates populates Recent view", () => {
    render(<PagesTemplateChooserApp />);

    clickSidebarCategory(/Basic/);
    const grid = screen.getByRole("listbox", { name: "Templates" });

    fireEvent.click(within(grid).getByRole("option", { name: /^Blank$/ }));
    fireEvent.click(within(grid).getByRole("option", { name: /Blank Layout/ }));
    fireEvent.click(within(grid).getByRole("option", { name: /Blank Black/ }));

    clickSidebarCategory(/Recent/);

    const recentGrid = screen.getByRole("listbox", { name: "Templates" });
    const recentCards = within(recentGrid).getAllByRole("option");
    expect(recentCards).toHaveLength(3);

    expect(recentCards[0]).toHaveAttribute("aria-label", "Blank Black");
    expect(recentCards[1]).toHaveAttribute("aria-label", "Blank Layout");
    expect(recentCards[2]).toHaveAttribute("aria-label", "Blank");
  });

  it("favorites toggle: pin and unpin templates", () => {
    render(<PagesTemplateChooserApp />);

    clickSidebarCategory(/Basic/);
    const grid = screen.getByRole("listbox", { name: "Templates" });

    const pinButtons = within(grid).getAllByRole("button", { name: "Pin as favorite" });
    expect(pinButtons.length).toBeGreaterThan(0);
    fireEvent.click(pinButtons[0]);

    clickSidebarCategory(/Favorites/);

    const favGrid = screen.getByRole("listbox", { name: "Templates" });
    const favCards = within(favGrid).getAllByRole("option");
    expect(favCards).toHaveLength(1);

    const unpinButton = within(favGrid).getByRole("button", { name: "Unpin favorite" });
    fireEvent.click(unpinButton);

    expect(screen.getByText("Pin your favorite templates to see them here.")).toBeInTheDocument();
  });

  it("search empty state includes search term", () => {
    render(<PagesTemplateChooserApp />);

    clickSidebarCategory(/Basic/);

    const input = screen.getByPlaceholderText("Search templates");
    fireEvent.change(input, { target: { value: "zzzznonexistent" } });

    expect(screen.getByText(/No templates match/)).toBeInTheDocument();
    expect(screen.getByText(/zzzznonexistent/)).toBeInTheDocument();
  });

  it("Cancel button resets selection", () => {
    render(<PagesTemplateChooserApp />);

    clickSidebarCategory(/Basic/);
    const grid = screen.getByRole("listbox", { name: "Templates" });
    fireEvent.click(within(grid).getByRole("option", { name: /^Blank$/ }));

    expect(screen.getByRole("button", { name: "Create" })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.getByRole("button", { name: "Create" })).toBeDisabled();
  });

  it("search filters templates correctly", () => {
    render(<PagesTemplateChooserApp />);

    clickSidebarCategory(/Basic/);

    const input = screen.getByPlaceholderText("Search templates");
    fireEvent.change(input, { target: { value: "Blank Black" } });

    const grid = screen.getByRole("listbox", { name: "Templates" });
    const cards = within(grid).getAllByRole("option");
    expect(cards).toHaveLength(1);
    expect(cards[0]).toHaveAttribute("aria-label", "Blank Black");
  });

  it("Recent empty state when no templates selected yet", () => {
    render(<PagesTemplateChooserApp />);

    clickSidebarCategory(/Recent/);

    expect(screen.getByText("You haven't selected any templates yet.")).toBeInTheDocument();
  });

  it("double-click selects and triggers create", () => {
    render(<PagesTemplateChooserApp />);

    clickSidebarCategory(/Basic/);
    const grid = screen.getByRole("listbox", { name: "Templates" });
    const card = within(grid).getByRole("option", { name: /^Blank$/ });

    fireEvent.doubleClick(card);

    expect(card).toHaveAttribute("aria-selected", "true");
    const liveRegion = screen.getByRole("status");
    expect(liveRegion.textContent).toContain("Creating document from Blank");
  });
});
