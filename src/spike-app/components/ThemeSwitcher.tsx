import type { ReactNode } from "react";
import type { ThemePreference } from "@/hooks/useDarkMode";
import { Monitor, Sun, Moon } from "lucide-react";

interface ThemeSwitcherProps {
  theme: ThemePreference;
  setTheme: (t: ThemePreference) => void;
}

const options: { value: ThemePreference; label: string; Icon: (props: { className?: string }) => ReactNode }[] = [
  { value: "system", label: "System", Icon: (props) => <Monitor {...props} /> },
  { value: "light", label: "Light", Icon: (props) => <Sun {...props} /> },
  { value: "dark", label: "Dark", Icon: (props) => <Moon {...props} /> },
];

export function ThemeSwitcher({ theme, setTheme }: ThemeSwitcherProps) {
  return (
    <div
      className="rounded-lg p-0.5 flex gap-0.5 bg-muted dark:bg-white/5 dark:border dark:border-white/10 dark:backdrop-blur-sm"
      role="group"
      aria-label="Theme preference"
    >
      {options.map(({ value, label, Icon }) => {
        const isActive = theme === value;
        const isDarkOption = value === "dark";
        return (
          <button
            key={value}
            type="button"
            aria-label={`${label} theme`}
            aria-pressed={isActive}
            title={`${label} mode`}
            onClick={() => setTheme(value)}
            className={[
              "rounded-md p-1.5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
              "tracking-wider text-[0.9rem]",
              isActive
                ? "dark:bg-primary dark:text-primary-foreground bg-card shadow-sm text-foreground"
                : [
                    "text-muted-foreground hover:text-foreground",
                    "hover:bg-card/50 dark:hover:bg-white/10",
                    "dark:hover:brightness-125",
                  ].join(" "),
            ].join(" ")}
          >
            <Icon
              className={[
                "size-4",
                isActive && isDarkOption
                  ? "dark:text-primary-light dark:drop-shadow-[0_0_6px_var(--primary-glow)]"
                  : "",
              ].join(" ")}
            />
          </button>
        );
      })}
    </div>
  );
}
