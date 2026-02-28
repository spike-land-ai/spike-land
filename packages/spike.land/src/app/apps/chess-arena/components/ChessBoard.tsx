"use client";

import type { ChessColor, LegalMove } from "@/lib/chess/types";
import type { ChessTheme } from "../themes";
import { Square } from "./Square";

interface ChessBoardProps {
  board: (({ type: string; color: ChessColor; } | null)[])[];
  selectedSquare: string | null;
  legalMoves: LegalMove[];
  lastMove: { from: string; to: string; } | null;
  isFlipped: boolean;
  isCheck: boolean;
  turn: ChessColor;
  theme: ChessTheme;
  onSquareClick: (square: string) => void;
}

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"];

export function ChessBoard({
  board,
  selectedSquare,
  legalMoves,
  lastMove,
  isFlipped,
  isCheck,
  turn,
  theme,
  onSquareClick,
}: ChessBoardProps) {
  const legalSquares = new Set(legalMoves.map(m => m.to));

  let kingSquare: string | null = null;
  if (isCheck) {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row]?.[col] ?? null;
        if (piece && piece.type === "k" && piece.color === turn) {
          kingSquare = (FILES[col] ?? "") + (RANKS[row] ?? "");
        }
      }
    }
  }

  const rows = isFlipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
  const cols = isFlipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];

  return (
    <div
      className="w-full aspect-square"
      style={{
        maxWidth: "min(80vh, 600px)",
        border: `3px solid ${theme.boardBorder}`,
        borderRadius: "4px",
      }}
    >
      <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
        {rows.map(row =>
          cols.map(col => {
            const file = FILES[col] ?? "a";
            const rank = RANKS[row] ?? "8";
            const square = file + rank;
            const piece = board[row]?.[col] ?? null;
            const isLight = (row + col) % 2 === 0;
            const isBottomRow = isFlipped ? row === 0 : row === 7;
            const isLeftCol = isFlipped ? col === 7 : col === 0;

            return (
              <Square
                key={square}
                square={square}
                piece={piece}
                isLight={isLight}
                isSelected={selectedSquare === square}
                isLastMove={lastMove?.from === square
                  || lastMove?.to === square}
                isLegalMove={legalSquares.has(square)}
                isCheck={kingSquare === square}
                theme={theme}
                onClick={onSquareClick}
                fileLabel={isBottomRow ? file : undefined}
                rankLabel={isLeftCol ? rank : undefined}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
