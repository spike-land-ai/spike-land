export interface ChessTheme {
  name: string;
  description: string;
  lightSquare: string;
  darkSquare: string;
  selectedSquare: string;
  lastMoveHighlight: string;
  checkHighlight: string;
  legalMoveDot: string;
  captureDot: string;
  whitePieceColor: string;
  whitePieceShadow: string;
  blackPieceColor: string;
  blackPieceShadow: string;
  boardBorder: string;
  activeClockBg: string;
  inactiveClockBg: string;
  clockText: string;
  clockLowText: string;
  panelBg: string;
  panelBorder: string;
  coordinateColor: string;
  accentColor: string;
  accentHover: string;
}

export type ThemeKey = "classic" | "neon" | "minimal";

export const CHESS_THEMES: Record<ThemeKey, ChessTheme> = {
  classic: {
    name: "Classic",
    description: "Traditional tournament style",
    lightSquare: "#F0D9B5",
    darkSquare: "#B58863",
    selectedSquare: "rgba(255, 255, 0, 0.4)",
    lastMoveHighlight: "rgba(255, 255, 0, 0.3)",
    checkHighlight: "rgba(255, 0, 0, 0.5)",
    legalMoveDot: "rgba(0, 0, 0, 0.25)",
    captureDot: "rgba(0, 0, 0, 0.25)",
    whitePieceColor: "#FFFFFF",
    whitePieceShadow: "1px 1px 2px rgba(0,0,0,0.5)",
    blackPieceColor: "#000000",
    blackPieceShadow: "1px 1px 2px rgba(255,255,255,0.3)",
    boardBorder: "#8B6914",
    activeClockBg: "#2D5016",
    inactiveClockBg: "#1a1a1a",
    clockText: "#FFFFFF",
    clockLowText: "#FF4444",
    panelBg: "#1C1C1C",
    panelBorder: "#8B6914",
    coordinateColor: "rgba(0,0,0,0.5)",
    accentColor: "#D4A843",
    accentHover: "#B8902E",
  },
  neon: {
    name: "Neon",
    description: "Cyber arena style",
    lightSquare: "#1a1a2e",
    darkSquare: "#0d0d1a",
    selectedSquare: "rgba(0, 255, 255, 0.3)",
    lastMoveHighlight: "rgba(0, 255, 255, 0.15)",
    checkHighlight: "rgba(255, 0, 100, 0.5)",
    legalMoveDot: "rgba(0, 255, 255, 0.5)",
    captureDot: "rgba(255, 0, 255, 0.5)",
    whitePieceColor: "#00FFFF",
    whitePieceShadow: "0 0 10px rgba(0,255,255,0.7)",
    blackPieceColor: "#FF00FF",
    blackPieceShadow: "0 0 10px rgba(255,0,255,0.7)",
    boardBorder: "#0d0d1a",
    activeClockBg: "rgba(0, 255, 255, 0.15)",
    inactiveClockBg: "rgba(13, 13, 26, 0.8)",
    clockText: "#00FFFF",
    clockLowText: "#FF0064",
    panelBg: "rgba(13, 13, 26, 0.9)",
    panelBorder: "rgba(0, 255, 255, 0.3)",
    coordinateColor: "rgba(0, 255, 255, 0.4)",
    accentColor: "#00FFFF",
    accentHover: "#00CCCC",
  },
  minimal: {
    name: "Minimal",
    description: "Clean modern style",
    lightSquare: "#E8E8E8",
    darkSquare: "#B0B0B0",
    selectedSquare: "rgba(59, 130, 246, 0.3)",
    lastMoveHighlight: "rgba(59, 130, 246, 0.2)",
    checkHighlight: "rgba(239, 68, 68, 0.4)",
    legalMoveDot: "rgba(59, 130, 246, 0.5)",
    captureDot: "rgba(59, 130, 246, 0.5)",
    whitePieceColor: "#FFFFFF",
    whitePieceShadow: "none",
    blackPieceColor: "#1F2937",
    blackPieceShadow: "none",
    boardBorder: "#D1D5DB",
    activeClockBg: "#1E40AF",
    inactiveClockBg: "#374151",
    clockText: "#FFFFFF",
    clockLowText: "#EF4444",
    panelBg: "#1F2937",
    panelBorder: "#374151",
    coordinateColor: "rgba(0,0,0,0.35)",
    accentColor: "#3B82F6",
    accentHover: "#2563EB",
  },
};

export const PIECE_UNICODE = {
  w: {
    k: "\u2654",
    q: "\u2655",
    r: "\u2656",
    b: "\u2657",
    n: "\u2658",
    p: "\u2659",
  } as Record<string, string>,
  b: {
    k: "\u265A",
    q: "\u265B",
    r: "\u265C",
    b: "\u265D",
    n: "\u265E",
    p: "\u265F",
  } as Record<string, string>,
};

export const PIECE_VALUES: Record<string, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
};

export function formatClockTime(ms: number): string {
  if (ms <= 0) return "0:00";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (ms < 10_000) {
    const tenths = Math.floor((ms % 1000) / 100);
    return `${minutes}:${seconds.toString().padStart(2, "0")}.${tenths}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
