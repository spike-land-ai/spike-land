import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import type { ThemePreference } from "@/hooks/useDarkMode";

describe("ThemeSwitcher", () => {
  const themes: ThemePreference[] = ["system", "light", "dark"];

  it("renders all three theme buttons", () => {
    const setTheme = vi.fn();
    render(<ThemeSwitcher theme="system" setTheme={setTheme} />);
    expect(screen.getByLabelText("System theme")).toBeInTheDocument();
    expect(screen.getByLabelText("Light theme")).toBeInTheDocument();
    expect(screen.getByLabelText("Dark theme")).toBeInTheDocument();
  });

  it.each(themes)("marks %s button as pressed when active", (theme) => {
    const setTheme = vi.fn();
    render(<ThemeSwitcher theme={theme} setTheme={setTheme} />);
    const label = theme.charAt(0).toUpperCase() + theme.slice(1);
    const button = screen.getByLabelText(`${label} theme`);
    expect(button).toHaveAttribute("aria-pressed", "true");
  });

  it("calls setTheme with 'dark' when dark button is clicked", () => {
    const setTheme = vi.fn();
    render(<ThemeSwitcher theme="system" setTheme={setTheme} />);
    fireEvent.click(screen.getByLabelText("Dark theme"));
    expect(setTheme).toHaveBeenCalledWith("dark");
  });

  it("calls setTheme with 'light' when light button is clicked", () => {
    const setTheme = vi.fn();
    render(<ThemeSwitcher theme="dark" setTheme={setTheme} />);
    fireEvent.click(screen.getByLabelText("Light theme"));
    expect(setTheme).toHaveBeenCalledWith("light");
  });

  it("calls setTheme with 'system' when system button is clicked", () => {
    const setTheme = vi.fn();
    render(<ThemeSwitcher theme="dark" setTheme={setTheme} />);
    fireEvent.click(screen.getByLabelText("System theme"));
    expect(setTheme).toHaveBeenCalledWith("system");
  });

  it("active theme button has different styling", () => {
    const setTheme = vi.fn();
    render(<ThemeSwitcher theme="light" setTheme={setTheme} />);
    const lightBtn = screen.getByLabelText("Light theme");
    const darkBtn = screen.getByLabelText("Dark theme");
    expect(lightBtn.className).toContain("bg-card");
    expect(darkBtn.className).not.toContain("bg-card");
  });
});
