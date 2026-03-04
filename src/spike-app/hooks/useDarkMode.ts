import { useCallback, useEffect, useState } from "react";

export type ThemePreference = "system" | "light" | "dark";

const STORAGE_KEY = "theme-preference";

const getStoredPreference = (): ThemePreference => {
  if (typeof window === "undefined") return "system";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") return stored;
  return "system";
};

const getSystemDark = (): boolean => {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

const resolveIsDark = (pref: ThemePreference): boolean => {
  if (pref === "dark") return true;
  if (pref === "light") return false;
  return getSystemDark();
};

const applyTheme = (isDark: boolean) => {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("dark", isDark);
  root.classList.toggle("light", !isDark);
};

/**
 * Hook to handle dark mode with localStorage persistence.
 * Supports three modes: system (follows OS), light, dark.
 */
export const useDarkMode = () => {
  const [theme, setThemeState] = useState<ThemePreference>(getStoredPreference);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => resolveIsDark(getStoredPreference()));

  const setTheme = useCallback((newTheme: ThemePreference) => {
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);
    const dark = resolveIsDark(newTheme);
    setIsDarkMode(dark);
    applyTheme(dark);
  }, []);

  // Listen for system preference changes (only matters when theme === "system")
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (theme === "system") {
        const dark = mq.matches;
        setIsDarkMode(dark);
        applyTheme(dark);
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  // Apply on mount
  useEffect(() => {
    applyTheme(isDarkMode);
  }, [isDarkMode]);

  return { isDarkMode, theme, setTheme };
};
