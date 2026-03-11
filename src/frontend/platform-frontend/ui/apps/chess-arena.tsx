import {
  Activity,
  Clock3,
  Crown,
  Flag,
  Lightbulb,
  Play,
  Repeat2,
  Sparkles,
  Swords,
  Undo2,
  Users,
} from "lucide-react";
import { Fragment, startTransition, useEffect, useMemo, useState } from "react";
import { Chess, type Color, type Move, type PieceSymbol, type Square } from "chess.js";

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
const RANKS = [8, 7, 6, 5, 4, 3, 2, 1] as const;
const PIECE_GLYPHS = {
  w: { p: "♙", n: "♘", b: "♗", r: "♖", q: "♕", k: "♔" },
  b: { p: "♟", n: "♞", b: "♝", r: "♜", q: "♛", k: "♚" },
} as const;
const PIECE_LABELS: Record<PieceSymbol, string> = {
  p: "pawn",
  n: "knight",
  b: "bishop",
  r: "rook",
  q: "queen",
  k: "king",
};
const PIECE_SCORES: Record<PieceSymbol, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 100,
};
const LIVE_MATCHES = [
  {
    players: "zerdos vs atlas-31",
    mode: "Blitz",
    status: "move 23",
    accent: "text-primary",
    note: "Sharp Semi-Slav tension. Crowd wants ...c5.",
  },
  {
    players: "rookie.dev vs ops-bot",
    mode: "Rapid",
    status: "analysis",
    accent: "text-foreground",
    note: "Quiet Catalan squeeze with a stable center.",
  },
  {
    players: "queen-side vs pair-coder",
    mode: "Arena",
    status: "finals",
    accent: "text-success-foreground",
    note: "Kingside attack race. One mistake ends it.",
  },
] as const;

type QueueMode = "Arena" | "Blitz" | "Rapid";
type SeatSide = "Black" | "White";
type ChessColor = Color;
type MatchPhase = "lobby" | "playing" | "finished";
type MatchActionBy = "opponent" | "player";

interface PlayedMove {
  by: MatchActionBy;
  color: ChessColor;
  from: string;
  to: string;
  san: string;
  piece: PieceSymbol;
  captured?: PieceSymbol | undefined;
  promotion?: PieceSymbol | undefined;
}

interface HintMove {
  from: string;
  to: string;
  san: string;
}

declare global {
  interface Window {
    advanceTime?: (ms: number) => void;
    render_game_to_text?: () => string;
  }
}

function buildGame(moves: PlayedMove[]) {
  const game = new Chess();

  for (const move of moves) {
    game.move({
      from: move.from,
      to: move.to,
      ...(move.promotion ? { promotion: move.promotion } : {}),
    });
  }

  return game;
}

function colorFromSeat(side: SeatSide): ChessColor {
  return side === "White" ? "w" : "b";
}

function seatFromColor(color: ChessColor): SeatSide {
  return color === "w" ? "White" : "Black";
}

function oppositeColor(color: ChessColor): ChessColor {
  return color === "w" ? "b" : "w";
}

function botHandleForMode(mode: QueueMode) {
  if (mode === "Arena") return "arena-rival";
  if (mode === "Rapid") return "ops-bot";
  return "atlas-31";
}

function queueDescriptor(mode: QueueMode) {
  if (mode === "Arena") return "continuous knockout pressure";
  if (mode === "Rapid") return "10+0 positional ladder";
  return "3+2 live pool";
}

function moveScore(move: Move, mode: QueueMode) {
  const targetFile = move.to.charCodeAt(0) - 97;
  const filePressure = 4 - Math.abs(targetFile - 3.5);
  const targetRank = Number.parseInt(move.to[1] ?? "0", 10);
  const forwardPressure = move.color === "w" ? targetRank : 9 - targetRank;
  const capturePressure = move.captured ? PIECE_SCORES[move.captured] * 16 : 0;
  const promotionPressure = move.promotion ? 28 : 0;
  const checkPressure = move.san.includes("#") ? 10_000 : move.san.includes("+") ? 60 : 0;
  const castlePressure = move.flags.includes("k") || move.flags.includes("q") ? 14 : 0;
  const developmentPressure =
    move.piece === "n" || move.piece === "b" ? 7 : move.piece === "p" ? 3 : 1;
  const arenaBias = mode === "Arena" ? (move.san.includes("x") ? 14 : 4) : 0;
  const blitzBias = mode === "Blitz" ? filePressure * 2 : 0;
  const rapidBias = mode === "Rapid" ? forwardPressure + filePressure * 2 : 0;

  return (
    capturePressure +
    promotionPressure +
    checkPressure +
    castlePressure +
    developmentPressure +
    forwardPressure +
    filePressure +
    arenaBias +
    blitzBias +
    rapidBias
  );
}

function chooseBotMove(game: Chess, mode: QueueMode): Move | null {
  const moves = game.moves({ verbose: true });

  if (moves.length === 0) {
    return null;
  }

  return (
    [...moves].sort((left, right) => {
      const delta = moveScore(right, mode) - moveScore(left, mode);
      if (delta !== 0) return delta;
      const sanDelta = left.san.localeCompare(right.san);
      if (sanDelta !== 0) return sanDelta;
      const fromDelta = left.from.localeCompare(right.from);
      if (fromDelta !== 0) return fromDelta;
      return left.to.localeCompare(right.to);
    })[0] ?? null
  );
}

function asPlayedMove(move: Move, by: MatchActionBy): PlayedMove {
  return {
    by,
    color: move.color as ChessColor,
    from: move.from,
    to: move.to,
    san: move.san,
    piece: move.piece,
    captured: move.captured,
    promotion: move.promotion,
  };
}

function promotionFor(move: Move) {
  return move.promotion ?? (move.flags.includes("p") ? "q" : undefined);
}

function finishMessage(game: Chess, playerColor: ChessColor, botHandle: string) {
  if (game.isCheckmate()) {
    const winner = oppositeColor(game.turn() as ChessColor);
    return winner === playerColor
      ? `Checkmate. You beat ${botHandle}.`
      : `Checkmate. ${botHandle} closes the match.`;
  }

  if (game.isStalemate()) {
    return "Stalemate. The board locked up.";
  }

  if (game.isThreefoldRepetition()) {
    return "Draw by repetition.";
  }

  if (game.isInsufficientMaterial()) {
    return "Draw by insufficient material.";
  }

  return "Draw. No winning line remains.";
}

function describePiece(piece: { color: ChessColor; type: PieceSymbol } | null) {
  if (!piece) return "empty square";
  return `${piece.color === "w" ? "white" : "black"} ${PIECE_LABELS[piece.type]}`;
}

function moveRows(moves: PlayedMove[]) {
  const rows: { turn: number; white: string | null; black: string | null }[] = [];

  for (let index = 0; index < moves.length; index += 2) {
    rows.push({
      turn: Math.floor(index / 2) + 1,
      white: moves[index]?.san ?? null,
      black: moves[index + 1]?.san ?? null,
    });
  }

  return rows.slice(-8);
}

function arenaPulse(mode: QueueMode) {
  return LIVE_MATCHES.find((match) => match.mode === mode) ?? LIVE_MATCHES[0];
}

function actionLabel(phase: MatchPhase) {
  if (phase === "lobby") return "Start match";
  if (phase === "playing") return "Restart match";
  return "Play again";
}

export function ChessArenaApp() {
  const [queueMode, setQueueMode] = useState<QueueMode>("Blitz");
  const [seatSide, setSeatSide] = useState<SeatSide>("White");
  const [matchPhase, setMatchPhase] = useState<MatchPhase>("lobby");
  const [activeQueueMode, setActiveQueueMode] = useState<QueueMode>("Blitz");
  const [playerColor, setPlayerColor] = useState<ChessColor>("w");
  const [moves, setMoves] = useState<PlayedMove[]>([]);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [hintMove, setHintMove] = useState<HintMove | null>(null);
  const [isBoardFlipped, setIsBoardFlipped] = useState(false);
  const [featuredMatch, setFeaturedMatch] = useState(LIVE_MATCHES[0].players);
  const [announcement, setAnnouncement] = useState(
    "Pick a queue, choose a side, then start a local match to play immediately.",
  );

  const game = useMemo(() => buildGame(moves), [moves]);
  const previewColor = matchPhase === "lobby" ? colorFromSeat(seatSide) : playerColor;
  const boardOrientation = isBoardFlipped ? oppositeColor(previewColor) : previewColor;
  const displayedFiles = boardOrientation === "w" ? FILES : [...FILES].reverse();
  const displayedRanks = boardOrientation === "w" ? RANKS : [...RANKS].reverse();
  const currentMode = matchPhase === "lobby" ? queueMode : activeQueueMode;
  const botHandle = botHandleForMode(currentMode);
  const selectedMoves = useMemo(
    () =>
      selectedSquare &&
      matchPhase === "playing" &&
      game.turn() === playerColor &&
      !game.isGameOver()
        ? game.moves({ verbose: true, square: selectedSquare as Square })
        : [],
    [selectedSquare, matchPhase, game, playerColor],
  );
  const legalTargets = useMemo(
    () => new Set(selectedMoves.map((move) => move.to)),
    [selectedMoves],
  );
  const canInteract = matchPhase === "playing" && !game.isGameOver() && game.turn() === playerColor;
  const pulse = arenaPulse(currentMode);
  const queueCount = queueMode === "Arena" ? 124 : queueMode === "Rapid" ? 78 : 124;
  const waitTime = queueMode === "Arena" ? "11s" : queueMode === "Rapid" ? "26s" : "18s";
  const playerSeatLabel = seatFromColor(previewColor);

  function launchMatch(nextMode: QueueMode, nextSeat: SeatSide) {
    const nextPlayerColor = colorFromSeat(nextSeat);
    const seededMoves: PlayedMove[] = [];
    const openingGame = new Chess();
    let nextAnnouncement = `Paired with ${botHandleForMode(nextMode)}. Make your first move.`;

    if (nextPlayerColor === "b") {
      const openingMove = chooseBotMove(openingGame, nextMode);

      if (openingMove) {
        const appliedOpening = openingGame.move({
          from: openingMove.from,
          to: openingMove.to,
          ...(promotionFor(openingMove) ? { promotion: promotionFor(openingMove) } : {}),
        });

        seededMoves.push(asPlayedMove(appliedOpening, "opponent"));
        nextAnnouncement = `${botHandleForMode(nextMode)} opened with ${appliedOpening.san}. Your move.`;
      }
    }

    startTransition(() => {
      setActiveQueueMode(nextMode);
      setPlayerColor(nextPlayerColor);
      setMoves(seededMoves);
      setSelectedSquare(null);
      setHintMove(null);
      setMatchPhase("playing");
      setIsBoardFlipped(false);
      setAnnouncement(nextAnnouncement);
    });
  }

  function handleQueuePreset(match: (typeof LIVE_MATCHES)[number]) {
    startTransition(() => {
      setQueueMode(match.mode);
      setFeaturedMatch(match.players);
      setAnnouncement(
        `${match.players} tuned the board to ${match.mode.toLowerCase()}. Press start to play your own match.`,
      );
    });
  }

  function handleSquarePress(square: string) {
    if (matchPhase !== "playing") {
      setAnnouncement("Start a match first. Then click one of your pieces to begin.");
      return;
    }

    if (game.isGameOver()) {
      setAnnouncement("This match is over. Restart to play another one.");
      return;
    }

    if (game.turn() !== playerColor) {
      setAnnouncement(`${botHandle} has the move right now.`);
      return;
    }

    const piece = game.get(square as Square);

    if (selectedSquare) {
      const chosenMove = selectedMoves.find((move) => move.to === square);

      if (chosenMove) {
        const nextGame = buildGame(moves);
        const appliedPlayerMove = nextGame.move({
          from: chosenMove.from,
          to: chosenMove.to,
          ...(promotionFor(chosenMove) ? { promotion: promotionFor(chosenMove) } : {}),
        });
        const nextMoves = [...moves, asPlayedMove(appliedPlayerMove, "player")];

        if (nextGame.isGameOver()) {
          startTransition(() => {
            setMoves(nextMoves);
            setSelectedSquare(null);
            setHintMove(null);
            setMatchPhase("finished");
            setAnnouncement(finishMessage(nextGame, playerColor, botHandle));
          });
          return;
        }

        const reply = chooseBotMove(nextGame, activeQueueMode);

        if (!reply) {
          startTransition(() => {
            setMoves(nextMoves);
            setSelectedSquare(null);
            setHintMove(null);
            setMatchPhase("finished");
            setAnnouncement(finishMessage(nextGame, playerColor, botHandle));
          });
          return;
        }

        const appliedReply = nextGame.move({
          from: reply.from,
          to: reply.to,
          ...(promotionFor(reply) ? { promotion: promotionFor(reply) } : {}),
        });
        const settledMoves = [...nextMoves, asPlayedMove(appliedReply, "opponent")];
        const nextPhase = nextGame.isGameOver() ? "finished" : "playing";
        const nextAnnouncement =
          nextPhase === "finished"
            ? finishMessage(nextGame, playerColor, botHandle)
            : `You played ${appliedPlayerMove.san}. ${botHandle} replied with ${appliedReply.san}.`;

        startTransition(() => {
          setMoves(settledMoves);
          setSelectedSquare(null);
          setHintMove(null);
          setMatchPhase(nextPhase);
          setAnnouncement(nextAnnouncement);
        });
        return;
      }

      if (square === selectedSquare) {
        setSelectedSquare(null);
        setHintMove(null);
        setAnnouncement("Selection cleared.");
        return;
      }
    }

    if (piece?.color === playerColor) {
      setSelectedSquare(square);
      setHintMove(null);
      setAnnouncement(
        `Selected ${describePiece(piece)} on ${square}. Choose a highlighted square.`,
      );
      return;
    }

    setSelectedSquare(null);
    setHintMove(null);
    setAnnouncement("Choose one of your own pieces to move.");
  }

  function handleHint() {
    if (matchPhase !== "playing") {
      setAnnouncement("Start a match first, then request a hint.");
      return;
    }

    if (game.isGameOver()) {
      setAnnouncement("No hint needed. The match is already finished.");
      return;
    }

    if (game.turn() !== playerColor) {
      setAnnouncement(`Wait for ${botHandle} to finish the turn before asking for a hint.`);
      return;
    }

    const suggestion = chooseBotMove(game, activeQueueMode);

    if (!suggestion) {
      setAnnouncement("No legal moves remain.");
      return;
    }

    setSelectedSquare(suggestion.from);
    setHintMove({ from: suggestion.from, to: suggestion.to, san: suggestion.san });
    setAnnouncement(`Suggested move: ${suggestion.san}.`);
  }

  function handleUndoTurn() {
    if (matchPhase === "lobby") {
      setAnnouncement("Nothing to undo yet. Start a match first.");
      return;
    }

    const minimumMoves = playerColor === "w" ? 0 : 1;

    if (moves.length <= minimumMoves) {
      setAnnouncement(
        playerColor === "w"
          ? "You are already at the starting position."
          : "You are already back to Black's first decision.",
      );
      return;
    }

    const nextMoves = [...moves];
    const undone: string[] = [];

    while (nextMoves.length > minimumMoves) {
      const removed = nextMoves.pop();
      if (!removed) break;
      undone.unshift(removed.san);

      const nextGame = buildGame(nextMoves);
      if (nextGame.turn() === playerColor) {
        break;
      }
    }

    startTransition(() => {
      setMoves(nextMoves);
      setSelectedSquare(null);
      setHintMove(null);
      setMatchPhase("playing");
      setAnnouncement(`Took back ${undone.join(" / ")}.`);
    });
  }

  function handleResign() {
    if (matchPhase !== "playing") {
      setAnnouncement("There is no live match to resign from.");
      return;
    }

    setSelectedSquare(null);
    setHintMove(null);
    setMatchPhase("finished");
    setAnnouncement(`You resigned. ${botHandle} wins this ${activeQueueMode.toLowerCase()} match.`);
  }

  function handleFlipBoard() {
    setIsBoardFlipped((current) => {
      const nextFlipped = !current;
      const nextBottomColor = nextFlipped ? oppositeColor(previewColor) : previewColor;
      setAnnouncement(`Board flipped. ${seatFromColor(nextBottomColor)} is now at the bottom.`);
      return nextFlipped;
    });
  }

  useEffect(() => {
    window.render_game_to_text = () => {
      const pieces = FILES.flatMap((file) =>
        RANKS.flatMap((rank) => {
          const square = `${file}${rank}` as Square;
          const piece = game.get(square);
          if (!piece) return [];
          return [{ square, piece: `${piece.color}${piece.type}` }];
        }),
      );

      return JSON.stringify({
        mode: matchPhase,
        queueMode: currentMode,
        playerColor,
        boardOrientation,
        coordinates:
          boardOrientation === "w"
            ? "files a-h left-to-right, ranks 8-1 top-to-bottom"
            : "files h-a left-to-right, ranks 1-8 top-to-bottom",
        turn: game.turn(),
        selectedSquare,
        legalTargets: [...legalTargets],
        hint: hintMove?.san ?? null,
        lastMove: moves.at(-1)?.san ?? null,
        moveCount: moves.length,
        status: announcement,
        pieces,
      });
    };

    window.advanceTime = () => {};

    return () => {
      delete window.render_game_to_text;
      delete window.advanceTime;
    };
  }, [
    announcement,
    boardOrientation,
    currentMode,
    game,
    hintMove,
    legalTargets,
    matchPhase,
    moves,
    playerColor,
    selectedSquare,
  ]);

  return (
    <div className="rubik-panel-strong overflow-hidden p-4 sm:p-5">
      <div className="grid gap-4">
        <section className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <span className="rubik-eyebrow">
                <Sparkles className="h-3.5 w-3.5" />
                Featured Arena
              </span>
              <div>
                <h2 className="text-2xl font-semibold tracking-[-0.05em] text-foreground sm:text-3xl">
                  Queue into a playable chess board without leaving spike.land.
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
                  Choose your queue, pick a seat, start the match, and play a full local game
                  against an arena bot. The board now accepts moves, hints, restarts, take-backs,
                  and resigns.
                </p>
              </div>
            </div>

            <div className="grid min-w-[220px] gap-2 sm:grid-cols-3">
              <div className="rubik-panel border-primary/20 bg-primary/10 p-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                  Queue
                </div>
                <div className="mt-1 text-lg font-semibold text-foreground">
                  {queueCount} players
                </div>
              </div>
              <div className="rubik-panel p-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Avg wait
                </div>
                <div className="mt-1 text-lg font-semibold text-foreground">{waitTime}</div>
              </div>
              <div className="rubik-panel p-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Match state
                </div>
                <div className="mt-1 text-lg font-semibold text-foreground">
                  {matchPhase === "lobby" ? "ready" : matchPhase === "playing" ? "live" : "final"}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="rubik-panel overflow-hidden p-3 sm:p-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-3">
                <div>
                  <div className="text-sm font-semibold text-foreground">Arena Board</div>
                  <div className="text-xs text-muted-foreground">
                    {matchPhase === "lobby"
                      ? "Click start to play. During the match: click a piece, then a legal square."
                      : `${playerSeatLabel} at the bottom${isBoardFlipped ? " (flipped)" : ""} • ${queueDescriptor(currentMode)}`}
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  <Activity className="h-3.5 w-3.5" />
                  {matchPhase === "lobby"
                    ? "ready"
                    : matchPhase === "playing"
                      ? "match live"
                      : "game over"}
                </div>
              </div>

              <div className="mt-4 grid gap-4 2xl:grid-cols-[minmax(0,1fr)_minmax(240px,280px)] 2xl:items-start">
                <div className="space-y-3">
                  <div className="mx-auto grid w-full max-w-[640px] grid-cols-[auto_repeat(8,minmax(0,1fr))] gap-1 text-center text-xs font-medium text-muted-foreground">
                    <div />
                    {displayedFiles.map((file) => (
                      <div key={file} className="pb-1 uppercase tracking-[0.16em]">
                        {file}
                      </div>
                    ))}
                    {displayedRanks.map((rank, rowIndex) => (
                      <Fragment key={`row-${rank}`}>
                        <div className="flex items-center justify-center pr-2 text-[11px] font-semibold">
                          {rank}
                        </div>
                        {displayedFiles.map((file, fileIndex) => {
                          const square = `${file}${rank}` as Square;
                          const piece = game.get(square);
                          const isDark = (rowIndex + fileIndex) % 2 === 1;
                          const isSelected = selectedSquare === square;
                          const isHintFrom = hintMove?.from === square;
                          const isHintTo = hintMove?.to === square;
                          const isLegalTarget = legalTargets.has(square);
                          const squareTone = isDark
                            ? "border-border/20 bg-foreground/10"
                            : "border-border/40 bg-background";
                          const interactiveTone =
                            canInteract && piece?.color === playerColor
                              ? "hover:border-primary/35 hover:bg-primary/10"
                              : "";

                          return (
                            <button
                              key={square}
                              type="button"
                              onClick={() => handleSquarePress(square)}
                              className={`relative aspect-square rounded-[18px] border p-1.5 text-left transition-colors ${squareTone} ${interactiveTone} ${isSelected ? "ring-2 ring-primary/65" : ""} ${isHintFrom ? "ring-2 ring-amber-500/65" : ""} ${isHintTo ? "ring-2 ring-emerald-500/65" : ""}`}
                              aria-label={`Square ${square}, ${describePiece(piece)}${isLegalTarget ? ", legal target" : ""}${isSelected ? ", selected" : ""}`}
                            >
                              {isLegalTarget && (
                                <span
                                  className="absolute inset-0 flex items-center justify-center"
                                  aria-hidden="true"
                                >
                                  <span className="h-3 w-3 rounded-full bg-primary/60" />
                                </span>
                              )}
                              <div className="flex h-full items-center justify-center rounded-[14px] bg-background/45 text-[clamp(1.15rem,2vw,2.2rem)]">
                                {piece ? PIECE_GLYPHS[piece.color][piece.type] : ""}
                              </div>
                            </button>
                          );
                        })}
                      </Fragment>
                    ))}
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
                    <button
                      type="button"
                      onClick={() => launchMatch(queueMode, seatSide)}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-primary/30 bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                    >
                      {matchPhase === "lobby" ? (
                        <Play className="h-4 w-4" />
                      ) : (
                        <Repeat2 className="h-4 w-4" />
                      )}
                      {actionLabel(matchPhase)}
                    </button>
                    <button
                      type="button"
                      onClick={handleUndoTurn}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition hover:border-primary/25"
                    >
                      <Undo2 className="h-4 w-4" />
                      Undo turn
                    </button>
                    <button
                      type="button"
                      onClick={handleHint}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition hover:border-primary/25"
                    >
                      <Lightbulb className="h-4 w-4" />
                      Hint
                    </button>
                    <button
                      type="button"
                      onClick={handleFlipBoard}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition hover:border-primary/25"
                    >
                      <Repeat2 className="h-4 w-4" />
                      Flip board
                    </button>
                    <button
                      type="button"
                      onClick={handleResign}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition hover:border-destructive/30 hover:text-destructive"
                    >
                      <Flag className="h-4 w-4" />
                      Resign
                    </button>
                  </div>

                  <div className="rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                      Match feed
                    </div>
                    <div className="mt-1 text-sm font-medium text-foreground">{announcement}</div>
                  </div>
                </div>

                <div className="grid gap-3">
                  <div className="rubik-panel p-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Clock3 className="h-4 w-4 text-primary" />
                      Match Queue
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
                      {(["Blitz", "Rapid", "Arena"] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setQueueMode(mode)}
                          className={`rounded-2xl border px-3 py-2 text-left text-sm font-medium transition-colors ${
                            queueMode === mode
                              ? "border-primary/35 bg-primary/10 text-foreground"
                              : "border-border bg-background text-muted-foreground hover:border-primary/20 hover:text-foreground"
                          }`}
                        >
                          <div>{mode}</div>
                          <div className="text-xs text-muted-foreground">
                            {queueDescriptor(mode)}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rubik-panel p-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Swords className="h-4 w-4 text-primary" />
                      Seat Selection
                    </div>
                    <div className="mt-3 flex gap-2">
                      {(["White", "Black"] as const).map((side) => (
                        <button
                          key={side}
                          type="button"
                          onClick={() => setSeatSide(side)}
                          className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                            seatSide === side
                              ? "border-primary/35 bg-primary/10 text-foreground"
                              : "border-border bg-background text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {side}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rubik-panel p-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Crown className="h-4 w-4 text-primary" />
                      Move List
                    </div>
                    <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                      {moveRows(moves).length === 0 ? (
                        <div className="rounded-xl border border-border bg-background px-3 py-2">
                          No moves yet.
                        </div>
                      ) : (
                        moveRows(moves).map((row) => (
                          <div
                            key={row.turn}
                            className="grid grid-cols-[auto_1fr_1fr] items-center gap-2 rounded-xl border border-border bg-background px-3 py-2"
                          >
                            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                              {row.turn}
                            </span>
                            <span className="font-medium text-foreground">
                              {row.white ?? "..."}
                            </span>
                            <span className="font-medium text-foreground">
                              {row.black ?? "..."}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rubik-panel p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Crown className="h-4 w-4 text-primary" />
                  Arena Pulse
                </div>
                <div className="mt-3 space-y-3">
                  {LIVE_MATCHES.map((match) => (
                    <button
                      key={match.players}
                      type="button"
                      onClick={() => handleQueuePreset(match)}
                      className={`w-full rounded-2xl border px-3 py-2 text-left transition ${
                        featuredMatch === match.players
                          ? "border-primary/35 bg-primary/10"
                          : "border-border bg-background hover:border-primary/20"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-sm font-medium text-foreground">
                        <span>{match.players}</span>
                        <span
                          className={`text-xs font-semibold uppercase tracking-[0.16em] ${match.accent}`}
                        >
                          {match.status}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">{match.mode}</div>
                      <div className="mt-2 text-xs text-muted-foreground">{match.note}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rubik-panel p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Users className="h-4 w-4 text-primary" />
                  Queue Summary
                </div>
                <div className="mt-3 space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between rounded-xl border border-border bg-background px-3 py-2">
                    <span>Selected queue</span>
                    <span className="font-semibold text-foreground">{queueMode}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-border bg-background px-3 py-2">
                    <span>Preferred side</span>
                    <span className="font-semibold text-foreground">{seatSide}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-border bg-background px-3 py-2">
                    <span>Current bot</span>
                    <span className="font-semibold text-foreground">{botHandle}</span>
                  </div>
                  <div className="rounded-xl border border-border bg-background px-3 py-2">
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Current pulse
                    </div>
                    <div className="mt-1 font-semibold text-foreground">{pulse.players}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{pulse.note}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
