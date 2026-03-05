import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AppFooter } from "@/components/AppFooter";
import { createMemoryRouter, RouterProvider } from "@tanstack/react-router";
import { routeTree } from "../../../src/spike-app/routeTree.gen";

// Simpler approach: mock the router Link
vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-router")>();
  return {
    ...actual,
    Link: ({ to, children, className }: { to: string; children: React.ReactNode; className?: string }) => (
      <a href={to} className={className}>{children}</a>
    ),
  };
});

describe("AppFooter", () => {
  it("renders the spike.land brand name", () => {
    render(<AppFooter />);
    expect(screen.getByText("spike.land")).toBeInTheDocument();
  });

  it("renders current year in copyright notice", () => {
    render(<AppFooter />);
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(new RegExp(String(currentYear)))).toBeInTheDocument();
  });

  it("renders platform navigation links", () => {
    render(<AppFooter />);
    expect(screen.getByText("App Registry")).toBeInTheDocument();
    expect(screen.getByText("Pricing")).toBeInTheDocument();
    expect(screen.getByText("App Store")).toBeInTheDocument();
  });

  it("renders resources links", () => {
    render(<AppFooter />);
    expect(screen.getByText("Documentation")).toBeInTheDocument();
    expect(screen.getByText("Blog")).toBeInTheDocument();
    expect(screen.getByText("About Us")).toBeInTheDocument();
  });

  it("renders legal links", () => {
    render(<AppFooter />);
    expect(screen.getByText("Privacy Policy")).toBeInTheDocument();
    expect(screen.getByText("Terms of Service")).toBeInTheDocument();
  });

  it("renders social links with proper rel attributes", () => {
    render(<AppFooter />);
    const githubLink = screen.getByText("GitHub").closest("a");
    expect(githubLink).toHaveAttribute("rel", "noopener noreferrer");
    expect(githubLink).toHaveAttribute("target", "_blank");

    const twitterLink = screen.getByText("Twitter").closest("a");
    expect(twitterLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("shows system status indicator", () => {
    render(<AppFooter />);
    expect(screen.getByRole("status")).toHaveTextContent("All systems operational");
  });

  it("renders all four section headings", () => {
    render(<AppFooter />);
    expect(screen.getByText("Platform")).toBeInTheDocument();
    expect(screen.getByText("Resources")).toBeInTheDocument();
    expect(screen.getByText("Legal & Social")).toBeInTheDocument();
  });
});
