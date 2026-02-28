"use client";

import { Badge } from "@/components/ui/badge";
import { PIECE_UNICODE, PIECE_VALUES } from "../themes";
import type { ChessTheme } from "../themes";

interface CapturedPiecesProps {
  capturedPieces: { w: string[]; b: string[]; };
  theme: ChessTheme;
}

function sortByValue(pieces: string[]): string[] {
  return [...pieces].sort((a, b) => (PIECE_VALUES[b] ?? 0) - (PIECE_VALUES[a] ?? 0));
}

function materialValue(pieces: string[]): number {
  return pieces.reduce((sum, p) => sum + (PIECE_VALUES[p] ?? 0), 0);
}

export function CapturedPieces({ capturedPieces, theme }: CapturedPiecesProps) {
  const whiteCaptures = sortByValue(capturedPieces.w);
  const blackCaptures = sortByValue(capturedPieces.b);

  const whiteMaterial = materialValue(whiteCaptures);
  const blackMaterial = materialValue(blackCaptures);
  const advantage = whiteMaterial - blackMaterial;

  return (
    <div
      className="rounded-lg p-3"
      style={{
        backgroundColor: theme.panelBg,
        border: `1px solid ${theme.panelBorder}`,
      }}
    >
      <div className="flex items-center gap-1 mb-1 min-h-[1.5rem]">
        <span className="text-sm" style={{ color: theme.blackPieceColor }}>
          {whiteCaptures.map((p, i) => <span key={i}>{PIECE_UNICODE.b[p]}</span>)}
        </span>
        {advantage > 0 && (
          <Badge variant="secondary" className="text-xs ml-1">
            +{advantage}
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-1 min-h-[1.5rem]">
        <span className="text-sm" style={{ color: theme.whitePieceColor }}>
          {blackCaptures.map((p, i) => <span key={i}>{PIECE_UNICODE.w[p]}</span>)}
        </span>
        {advantage < 0 && (
          <Badge variant="secondary" className="text-xs ml-1">
            +{Math.abs(advantage)}
          </Badge>
        )}
      </div>
    </div>
  );
}
