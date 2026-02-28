"use client";

import { CHESS_THEMES, type ThemeKey } from "../themes";

interface ThemeSelectorProps {
  selectedTheme: ThemeKey;
  onSelectTheme: (themeKey: ThemeKey) => void;
}

export function ThemeSelector(
  { selectedTheme, onSelectTheme }: ThemeSelectorProps,
) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {(Object.entries(CHESS_THEMES) as [
        ThemeKey,
        typeof CHESS_THEMES[ThemeKey],
      ][]).map(([key, theme]) => (
        <button
          key={key}
          type="button"
          className={`rounded-xl p-4 text-left transition-all hover:scale-[1.02] ${
            selectedTheme === key ? "ring-2" : "opacity-70 hover:opacity-100"
          }`}
          style={{
            backgroundColor: theme.panelBg,
            borderColor: selectedTheme === key
              ? theme.accentColor
              : theme.panelBorder,
            border: `1px solid ${selectedTheme === key ? theme.accentColor : theme.panelBorder}`,
            ...(selectedTheme === key
              ? {
                ringColor: theme.accentColor,
                boxShadow: `0 0 12px ${theme.accentColor}40`,
              }
              : {}),
          }}
          onClick={() => onSelectTheme(key)}
        >
          <h3 className="text-white font-semibold mb-1">{theme.name}</h3>
          <p className="text-gray-400 text-sm mb-3">{theme.description}</p>
          <div className="grid grid-cols-4 grid-rows-4 aspect-square rounded overflow-hidden">
            {Array.from({ length: 16 }).map((_, i) => {
              const r = Math.floor(i / 4);
              const c = i % 4;
              const isLight = (r + c) % 2 === 0;
              return (
                <div
                  key={i}
                  style={{
                    backgroundColor: isLight
                      ? theme.lightSquare
                      : theme.darkSquare,
                  }}
                />
              );
            })}
          </div>
        </button>
      ))}
    </div>
  );
}
