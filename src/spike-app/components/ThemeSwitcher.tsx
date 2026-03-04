import type { ReactNode } from "react";
import type { ThemePreference } from "@/hooks/useDarkMode";

interface ThemeSwitcherProps {
  theme: ThemePreference;
  setTheme: (t: ThemePreference) => void;
}

const MonitorIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="2" width="14" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.25" />
    <path d="M5 13.5h6M8 11v2.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
  </svg>
);

const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.25" />
    <path
      d="M8 1.5v1.25M8 13.25V14.5M14.5 8h-1.25M2.75 8H1.5M12.36 3.64l-.88.88M4.52 11.48l-.88.88M12.36 12.36l-.88-.88M4.52 4.52l-.88-.88"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
    />
  </svg>
);

const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M13.5 9.5A5.5 5.5 0 0 1 6.5 2.5a5.5 5.5 0 1 0 7 7z"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinejoin="round"
    />
  </svg>
);

const options: { value: ThemePreference; label: string; Icon: () => ReactNode }[] = [
  { value: "system", label: "System", Icon: MonitorIcon },
  { value: "light", label: "Light", Icon: SunIcon },
  { value: "dark", label: "Dark", Icon: MoonIcon },
];

export function ThemeSwitcher({ theme, setTheme }: ThemeSwitcherProps) {
  return (
    <div className="rounded-lg p-0.5 flex gap-0.5 bg-muted">
      {options.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          aria-label={`${label} theme`}
          aria-pressed={theme === value}
          onClick={() => setTheme(value)}
          className={[
            "rounded-md p-1.5 transition-colors",
            theme === value
              ? "bg-card shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground",
          ].join(" ")}
        >
          <Icon />
        </button>
      ))}
    </div>
  );
}
