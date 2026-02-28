"use client";

import { Button } from "@/components/ui/button";
import type { ThemeKey } from "../themes";
import { ThemeSelector } from "./ThemeSelector";

const TIME_CONTROLS = [
  { key: "BULLET_1", label: "1 min", description: "Bullet" },
  { key: "BLITZ_5", label: "5 min", description: "Blitz" },
  { key: "RAPID_10", label: "10 min", description: "Rapid" },
  { key: "RAPID_15", label: "15 min", description: "Rapid" },
  { key: "CLASSICAL_30", label: "30 min", description: "Classical" },
  { key: "UNLIMITED", label: "\u221E", description: "Unlimited" },
];

interface GameSetupProps {
  themeKey: ThemeKey;
  timeControl: string;
  onThemeChange: (key: ThemeKey) => void;
  onTimeControlChange: (key: string) => void;
  onStart: () => void;
  onJoin: (gameId: string) => void;
  isConnecting?: boolean;
  connectionError?: Error;
  onRetry?: () => void;
}

export function GameSetup({
  themeKey,
  timeControl,
  onThemeChange,
  onTimeControlChange,
  onStart,
  onJoin,
  isConnecting,
  connectionError,
  onRetry,
}: GameSetupProps) {
  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-2xl mx-auto p-4">
      <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
        Chess Arena
      </h1>

      <div className="w-full space-y-2">
        <h2 className="text-lg font-semibold text-gray-200">Choose Theme</h2>
        <ThemeSelector selectedTheme={themeKey} onSelectTheme={onThemeChange} />
      </div>

      <div className="w-full space-y-2">
        <h2 className="text-lg font-semibold text-gray-200">Time Control</h2>
        <div className="grid grid-cols-3 gap-2">
          {TIME_CONTROLS.map(tc => (
            <button
              key={tc.key}
              type="button"
              className={`rounded-lg p-3 text-center transition-all border ${
                timeControl === tc.key
                  ? "bg-white/10 border-white/30 text-white"
                  : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-gray-200"
              }`}
              onClick={() => onTimeControlChange(tc.key)}
            >
              <div className="text-lg font-bold">{tc.label}</div>
              <div className="text-xs opacity-70">{tc.description}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="w-full space-y-2">
        <h2 className="text-lg font-semibold text-gray-200">Start New Game</h2>
        {connectionError
          ? (
            <div className="p-3 rounded bg-red-500/10 border border-red-500/20 text-red-200 text-sm text-center space-y-2">
              <p>
                {connectionError.message.includes("401")
                    || connectionError.message.includes("Unauthorized")
                  ? "Please sign in to play multiplayer."
                  : connectionError.message.includes("429")
                  ? "Rate limited. Retrying automatically..."
                  : "Failed to connect to game server."}
              </p>
              {onRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-500/30 text-red-200 hover:bg-red-500/20"
                  onClick={() => onRetry()}
                >
                  Retry
                </Button>
              )}
            </div>
          )
          : (
            <Button
              size="lg"
              className="w-full text-lg font-semibold"
              onClick={onStart}
              disabled={isConnecting}
            >
              {isConnecting ? "Connecting..." : "Create Game"}
            </Button>
          )}
      </div>

      <div className="flex items-center gap-4 w-full">
        <div className="h-px bg-white/10 flex-1" />
        <span className="text-sm text-gray-500 font-medium">OR</span>
        <div className="h-px bg-white/10 flex-1" />
      </div>

      <div className="w-full space-y-2">
        <h2 className="text-lg font-semibold text-gray-200">
          Join Existing Game
        </h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter Game ID"
            className="flex-1 bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            id="game-id-input"
          />
          <Button
            variant="secondary"
            onClick={() => {
              const input = document.getElementById(
                "game-id-input",
              ) as HTMLInputElement;
              if (input.value) onJoin(input.value);
            }}
          >
            Join
          </Button>
        </div>
      </div>
    </div>
  );
}
