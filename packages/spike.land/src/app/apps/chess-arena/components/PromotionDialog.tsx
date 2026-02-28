"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ChessColor } from "@/lib/chess/types";
import type { ChessTheme } from "../themes";
import { PIECE_UNICODE } from "../themes";

interface PromotionDialogProps {
  open: boolean;
  turn: ChessColor;
  theme: ChessTheme;
  onSelect: (piece: string) => void;
  onCancel: () => void;
}

const PROMOTION_PIECES = ["q", "r", "b", "n"] as const;

export function PromotionDialog(
  { open, turn, theme, onSelect, onCancel }: PromotionDialogProps,
) {
  const pieceColor = turn === "w"
    ? theme.whitePieceColor
    : theme.blackPieceColor;
  const pieceShadow = turn === "w"
    ? theme.whitePieceShadow
    : theme.blackPieceShadow;

  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && onCancel()}>
      <DialogContent
        className="sm:max-w-[280px]"
        style={{ backgroundColor: theme.panelBg }}
      >
        <DialogHeader>
          <DialogTitle className="text-center text-gray-200">
            Promote Pawn
          </DialogTitle>
        </DialogHeader>
        <div className="flex justify-center gap-3 py-4">
          {PROMOTION_PIECES.map(piece => (
            <button
              key={piece}
              type="button"
              className="w-16 h-16 flex items-center justify-center rounded-lg border transition-all hover:scale-110"
              style={{
                backgroundColor: theme.panelBg,
                borderColor: theme.panelBorder,
              }}
              onClick={() => onSelect(piece)}
            >
              <span
                style={{
                  color: pieceColor,
                  textShadow: pieceShadow,
                  fontSize: "2.5rem",
                  lineHeight: 1,
                }}
              >
                {PIECE_UNICODE[turn]?.[piece]}
              </span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
