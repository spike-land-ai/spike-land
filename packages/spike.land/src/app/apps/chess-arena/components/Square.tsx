"use client";

import { memo } from "react";
import type { ChessColor } from "@/lib/chess/types";
import type { ChessTheme } from "../themes";
import { PIECE_UNICODE } from "../themes";

interface SquareProps {
  square: string;
  piece: { type: string; color: ChessColor; } | null;
  isLight: boolean;
  isSelected: boolean;
  isLastMove: boolean;
  isLegalMove: boolean;
  isCheck: boolean;
  theme: ChessTheme;
  onClick: (square: string) => void;
  fileLabel?: string;
  rankLabel?: string;
}

export const Square = memo(function Square({
  square,
  piece,
  isLight,
  isSelected,
  isLastMove,
  isLegalMove,
  isCheck,
  theme,
  onClick,
  fileLabel,
  rankLabel,
}: SquareProps) {
  const handleClick = () => onClick(square);
  const bgColor = isLight ? theme.lightSquare : theme.darkSquare;

  let overlayColor = "transparent";
  if (isCheck) overlayColor = theme.checkHighlight;
  else if (isSelected) overlayColor = theme.selectedSquare;
  else if (isLastMove) overlayColor = theme.lastMoveHighlight;

  const pieceColor = piece
    ? piece.color === "w" ? theme.whitePieceColor : theme.blackPieceColor
    : undefined;
  const pieceShadow = piece
    ? piece.color === "w" ? theme.whitePieceShadow : theme.blackPieceShadow
    : undefined;

  return (
    <div
      role="button"
      tabIndex={0}
      className="relative flex items-center justify-center cursor-pointer select-none transition-colors duration-150 hover:brightness-110 active:brightness-90 group"
      style={{ backgroundColor: bgColor }}
      onClick={handleClick}
      onKeyDown={e => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* Hover Highlight Overlay */}
      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors pointer-events-none" />

      <div
        className="absolute inset-0"
        style={{ backgroundColor: overlayColor }}
      />

      {piece && (
        <span
          className="relative z-10"
          style={{
            color: pieceColor,
            textShadow: pieceShadow,
            fontSize: "clamp(1.5rem, 5vw, 3.5rem)",
            lineHeight: 1,
          }}
        >
          {PIECE_UNICODE[piece.color]?.[piece.type]}
        </span>
      )}

      {isLegalMove && !piece && (
        <div
          className="absolute z-10 rounded-full"
          style={{
            width: "30%",
            height: "30%",
            backgroundColor: theme.legalMoveDot,
          }}
        />
      )}

      {isLegalMove && piece && (
        <div
          className="absolute inset-[5%] z-10 rounded-full"
          style={{
            border: `3px solid ${theme.captureDot}`,
            backgroundColor: "transparent",
          }}
        />
      )}

      {fileLabel && (
        <span
          className="absolute bottom-0.5 right-1 z-10 font-medium"
          style={{ color: theme.coordinateColor, fontSize: "0.6rem" }}
        >
          {fileLabel}
        </span>
      )}
      {rankLabel && (
        <span
          className="absolute top-0.5 left-1 z-10 font-medium"
          style={{ color: theme.coordinateColor, fontSize: "0.6rem" }}
        >
          {rankLabel}
        </span>
      )}
    </div>
  );
});
