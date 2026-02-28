"use client";

import { useChessMcp } from "./hooks/useChessMcp";
import { GameSetup } from "./components/GameSetup";
import { ChessBoard } from "./components/ChessBoard";
import { GameControls } from "./components/GameControls";
import { MoveHistory } from "./components/MoveHistory";
import { CapturedPieces } from "./components/CapturedPieces";
import { PromotionDialog } from "./components/PromotionDialog";
import { GameOverDialog } from "./components/GameOverDialog";
import { Copy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function ChessArenaClient() {
  const game = useChessMcp();

  if (game.phase === "setup") {
    return (
      <div className="min-h-[calc(100dvh-3.5rem)] bg-zinc-950 text-white flex items-center justify-center p-6">
        <GameSetup
          themeKey={game.themeKey}
          timeControl={game.timeControl}
          onThemeChange={game.setTheme}
          onTimeControlChange={game.setTimeControl}
          onStart={game.startGame}
          onJoin={game.joinGame}
          isConnecting={game.isConnecting}
          connectionError={game.connectionError}
          onRetry={game.retryConnection}
        />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-zinc-950 text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">
        <div className="flex-shrink-0 w-full flex flex-col items-center lg:items-start">
          {/* Game ID Header */}
          {game.gameId && (
            <div className="w-full mb-6 flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Users className="w-4 h-4 text-purple-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">
                    Session ID
                  </span>
                  <code className="text-sm font-mono text-purple-300">
                    {game.gameId}
                  </code>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-9 border-white/10 bg-white/5 hover:bg-white/10 gap-2"
                onClick={() => {
                  navigator.clipboard.writeText(game.gameId!);
                  toast.success("Game ID copied to clipboard");
                }}
              >
                <Copy className="w-3.5 h-3.5" />
                Copy Link
              </Button>
            </div>
          )}

          <div className="w-full flex flex-col items-center">
            <div className="w-full max-w-[600px] mb-2">
              <CapturedPieces
                capturedPieces={game.capturedPieces}
                theme={game.theme}
              />
            </div>

            <ChessBoard
              board={game.board}
              selectedSquare={game.selectedSquare}
              legalMoves={game.legalMoves}
              lastMove={game.lastMove}
              isFlipped={game.isFlipped}
              isCheck={game.isCheck}
              turn={game.turn}
              theme={game.theme}
              onSquareClick={game.selectSquare}
            />

            <div className="w-full max-w-[600px] mt-4">
              <GameControls
                clocks={game.clocks}
                turn={game.turn}
                timeControl={game.timeControl}
                drawOffer={game.drawOffer}
                theme={game.theme}
                onResign={game.resign}
                onOfferDraw={game.offerDraw}
                onAcceptDraw={game.acceptDraw}
                onDeclineDraw={game.declineDraw}
                onFlipBoard={game.flipBoard}
              />
            </div>
          </div>
        </div>

        <div className="w-full flex flex-col gap-4 sticky top-20">
          <div
            className="rounded-xl p-6 text-center shadow-xl transition-all"
            style={{
              backgroundColor: game.theme.panelBg,
              border: `1px solid ${game.theme.panelBorder}`,
            }}
          >
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs uppercase tracking-widest text-zinc-500 font-bold">
                Current Turn
              </span>
              <div className="flex items-center gap-3">
                <div
                  className={`w-4 h-4 rounded-full border border-white/20 ${
                    game.turn === "w"
                      ? "bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                      : "bg-zinc-800"
                  }`}
                />
                <span
                  className="text-2xl font-black tracking-tight"
                  style={{ color: game.theme.accentColor }}
                >
                  {game.turn === "w" ? "White" : "Black"}
                </span>
              </div>
              {game.isCheck && (
                <div className="mt-2 px-3 py-1 rounded bg-red-500/20 text-red-400 text-sm font-bold animate-pulse border border-red-500/30">
                  CHECK!
                </div>
              )}
            </div>
          </div>

          <MoveHistory moves={game.moveHistory} theme={game.theme} />
        </div>
      </div>

      <PromotionDialog
        open={!!game.pendingPromotion}
        turn={game.turn}
        theme={game.theme}
        onSelect={game.promoteWith}
        onCancel={game.cancelPromotion}
      />

      <GameOverDialog
        open={game.phase === "game_over"}
        gameOver={game.gameOver}
        onRematch={game.rematch}
        onNewGame={game.newGame}
      />
    </div>
  );
}
