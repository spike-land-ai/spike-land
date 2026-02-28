"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface GameOverDialogProps {
  open: boolean;
  gameOver: { reason: string; winner: string | null; } | null;
  onRematch: () => void;
  onNewGame: () => void;
  onDismiss?: () => void;
}

const REASON_TEXT: Record<string, string> = {
  checkmate: "Checkmate",
  stalemate: "Stalemate",
  resignation: "Resignation",
  timeout: "Time ran out",
  draw_agreement: "Draw by agreement",
  insufficient_material: "Insufficient material",
  threefold_repetition: "Threefold repetition",
  fifty_move_rule: "50-move rule",
};

export function GameOverDialog(
  { open, gameOver, onRematch, onNewGame, onDismiss }: GameOverDialogProps,
) {
  if (!gameOver) return null;

  const resultText = gameOver.winner
    ? gameOver.winner === "w" ? "White wins!" : "Black wins!"
    : "Draw!";

  return (
    <Dialog
      open={open}
      onOpenChange={isOpen => {
        if (!isOpen) onDismiss?.();
      }}
    >
      <DialogContent className="sm:max-w-[320px]">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">
            {resultText}
          </DialogTitle>
          <DialogDescription className="text-center">
            {REASON_TEXT[gameOver.reason] ?? "Game ended"}
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-3 justify-center mt-4">
          <Button onClick={onRematch}>Rematch</Button>
          <Button variant="outline" onClick={onNewGame}>
            New Game
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
