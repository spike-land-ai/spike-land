"use client";

import { useCallback, useRef, useState } from "react";
import { useMcpTool } from "@/lib/mcp/client/hooks/use-mcp-tool";
import { useMcpMutation } from "@/lib/mcp/client/hooks/use-mcp-mutation";
import type { ChessColor, LegalMove } from "@/lib/chess/types";
import { CHESS_THEMES, type ThemeKey } from "../themes";
import { Chess } from "chess.js";
import {
  getBoard,
  getGameState,
  getLegalMovesForSquare,
  makeMove,
} from "@/lib/chess/engine";
import { logger } from "@/lib/logger";

/* ── Types ──────────────────────────────────────────────────────────── */

type BoardSquare = { type: string; color: ChessColor; } | null;
type Board = BoardSquare[][];

interface GameOverInfo {
  reason: string;
  winner: ChessColor | null;
}

// Mirrors the state structure of useChessGame
interface ChessGameState {
  phase: "setup" | "playing" | "game_over";
  themeKey: ThemeKey;
  timeControl: string;
  board: Board;
  turn: ChessColor;
  selectedSquare: string | null;
  legalMoves: LegalMove[];
  lastMove: { from: string; to: string; } | null;
  pendingPromotion: { from: string; to: string; } | null;
  moveHistory: string[];
  capturedPieces: { w: string[]; b: string[]; };
  clocks: { w: number; b: number; };
  drawOffer: ChessColor | null;
  gameOver: GameOverInfo | null;
  isFlipped: boolean;
  isCheck: boolean;
  gameId: string | null;
}

const EMPTY_BOARD: Board = Array.from(
  { length: 8 },
  () => Array.from({ length: 8 }, () => null),
);

// Initial state for the hook
const initialState: ChessGameState = {
  phase: "setup",
  themeKey: "classic",
  timeControl: "BLITZ_5",
  board: EMPTY_BOARD,
  turn: "w",
  selectedSquare: null,
  legalMoves: [],
  lastMove: null,
  pendingPromotion: null,
  moveHistory: [],
  capturedPieces: { w: [], b: [] },
  clocks: { w: 300_000, b: 300_000 },
  drawOffer: null,
  gameOver: null,
  isFlipped: false,
  isCheck: false,
  gameId: null,
};

/* ── Helpers ────────────────────────────────────────────────────────── */

function parseGameState(text: string): Partial<ChessGameState> | null {
  if (!text || text.includes("NOT_FOUND")) return null;

  // Extract FEN
  const fenMatch = text.match(/\*\*FEN:\*\* (.+)/);
  const fen = fenMatch?.[1]?.trim();

  // Extract Status
  const statusMatch = text.match(/\*\*Status:\*\* (.+)/);
  const statusLine = statusMatch?.[1]?.trim() || "";

  // Extract Moves
  const movesMatch = text.match(/\*\*Moves \(\d+\):\*\* (.+)/);
  const moveStr = movesMatch?.[1]?.trim();

  // Extract Time Control
  const tcMatch = text.match(/\*\*Time Control:\*\* (.+)/);
  const timeControl = tcMatch?.[1]?.trim();

  if (!fen) return null;

  const chess = new Chess(fen);
  // Re-hydrate full game history if possible, but FEN is enough for board state
  // We can try to derive captured pieces from full history if we had it, but FEN doesn't have it.
  // For now, we will rely on current board state.

  const board = getBoard(chess);
  const gameState = getGameState(chess);

  let phase: ChessGameState["phase"] = "playing";
  let gameOver: GameOverInfo | null = null;

  if (statusLine.includes("CHECKMATE") || gameState.isCheckmate) {
    phase = "game_over";
    gameOver = {
      reason: "checkmate",
      winner: chess.turn() === "w" ? "b" : "w",
    };
  } else if (statusLine.includes("Stalemate") || gameState.isStalemate) {
    phase = "game_over";
    gameOver = { reason: "stalemate", winner: null };
  } else if (statusLine.includes("Draw") || gameState.isDraw) {
    phase = "game_over";
    gameOver = { reason: "draw", winner: null };
  } else if (statusLine.includes("Resigned")) {
    phase = "game_over";
    gameOver = { reason: "resignation", winner: null };
  } else if (statusLine.includes("WAITING")) {
    phase = "playing"; // Or a specific waiting state if UI supports it
  }

  // Parse moves list if available
  const moves = moveStr && moveStr !== "No moves yet"
    ? moveStr.split(" ").map(m => {
      const parts = m.split(". ");
      return parts.length > 1 ? parts[1]! : m;
    }).filter(Boolean)
    : [];

  // Last move from history if available
  // Determining from/to from pure SAN history is hard without replaying whole game
  // We can skip lastMove highlighting or try to replay if we have full PGN

  return {
    board,
    turn: gameState.turn,
    isCheck: gameState.isCheck,
    phase,
    gameOver,
    timeControl: timeControl || "BLITZ_5",
    moveHistory: moves,
  };
}

/* ── Hook ───────────────────────────────────────────────────────────── */

export function useChessMcp() {
  // We need a persistent chess instance for local logic
  const chessRef = useRef<Chess>(new Chess());
  const [playerId, setPlayerId] = useState<string | null>(null);

  // Combine all game state into one object for easier syncing
  const [state, setState] = useState<ChessGameState>(initialState);

  // Poll for player ID if not set
  const profileQuery = useMcpTool<string>("chess_list_profiles", {}, {
    enabled: !playerId,
    refetchInterval: 5000,
    onSuccess: data => {
      const match = data.match(/ID: ([a-f0-9-]+)/);
      if (match) {
        setPlayerId(match[1]!);
      } else if (data.includes("No profiles found")) {
        // Auto-create?
        createPlayerMut.mutate({ name: "Guest" });
      }
    },
  });

  const createPlayerMut = useMcpMutation<string>("chess_create_player", {
    onSuccess: data => {
      const match = data.match(/\*\*ID:\*\* ([a-f0-9-]+)/);
      if (match) setPlayerId(match[1]!);
    },
  });

  // Poll for Game State
  const gameQuery = useMcpTool<string>("chess_get_game", {
    game_id: state.gameId,
  }, {
    enabled: !!state.gameId,
    refetchInterval: 1000,
    onSuccess: text => {
      const parsed = parseGameState(text);
      if (parsed) {
        // Sync local chess instance
        // Best approach: create new chess instance from FEN to ensure rules are valid
        // But we lose move history for replay if we only have FEN.
        // Ideally we'd replay all moves, but FEN is safer for now.

        // Update local state
        setState(prev => ({
          ...prev,
          ...parsed,
          // Keep local UI state if meaningful?
          // If parsed board is different, clear selection
          selectedSquare: null,
          legalMoves: [],
        }));

        // Update ref for logic
        // We need to re-create the chess instance to match FEN so getLegalMoves works
        // We can't easily get FEN from the parsed board, so we should have extracted it in parser
        // Let's modify parser to return FEN or just re-extract here?
        // Actually parser creates a Chess instance.
        const fenMatch = text.match(/\*\*FEN:\*\* (.+)/);
        if (fenMatch?.[1]) {
          chessRef.current = new Chess(fenMatch[1]);
        }
      }
    },
  });

  /* ─── Mutations ────────────────────────────────────────────────── */

  const createGameMut = useMcpMutation<string>("chess_create_game", {
    onSuccess: data => {
      const match = data.match(/\*\*Game ID:\*\* ([a-f0-9-]+)/);
      if (match) {
        setState(prev => ({ ...prev, gameId: match[1]!, phase: "playing" }));
      }
    },
  });

  const joinGameMut = useMcpMutation<string>("chess_join_game", {
    onSuccess: data => {
      const match = data.match(/\*\*Game ID:\*\* ([a-f0-9-]+)/);
      if (match) {
        setState(prev => ({ ...prev, gameId: match[1]!, phase: "playing" }));
      }
    },
  });

  const makeMoveMut = useMcpMutation<string>("chess_make_move", {
    onSuccess: () => {
      gameQuery.refetch();
    },
    onError: () => {
      // Revert optimistic update?
      gameQuery.refetch();
    },
  });

  const resignMut = useMcpMutation<string>("chess_resign", {
    onSuccess: () => gameQuery.refetch(),
  });

  const offerDrawMut = useMcpMutation<string>("chess_offer_draw", {
    onSuccess: () => {
      setState(prev => ({ ...prev, drawOffer: prev.turn }));
      gameQuery.refetch();
    },
  });

  const acceptDrawMut = useMcpMutation<string>("chess_accept_draw", {
    onSuccess: () => gameQuery.refetch(),
  });

  const declineDrawMut = useMcpMutation<string>("chess_decline_draw", {
    onSuccess: () => {
      setState(prev => ({ ...prev, drawOffer: null }));
      gameQuery.refetch();
    },
  });

  /* ─── Actions ──────────────────────────────────────────────────── */

  const setTheme = useCallback((themeKey: ThemeKey) => {
    setState(prev => ({ ...prev, themeKey }));
  }, []);

  const setTimeControl = useCallback((timeControl: string) => {
    setState(prev => ({ ...prev, timeControl }));
  }, []);

  const startGame = useCallback(() => {
    if (!playerId) {
      logger.error("No player ID available");
      return;
    }
    createGameMut.mutate({
      player_id: playerId,
      time_control: state.timeControl,
    });
  }, [playerId, state.timeControl, createGameMut]);

  // Join by specific ID (from UI input)
  const joinGame = useCallback((id: string) => {
    if (!playerId) return;
    joinGameMut.mutate({ game_id: id, player_id: playerId });
  }, [playerId, joinGameMut]);

  const selectSquare = useCallback((square: string) => {
    if (state.phase !== "playing") return;

    // 1. If same square, deselect
    if (state.selectedSquare === square) {
      setState(prev => ({ ...prev, selectedSquare: null, legalMoves: [] }));
      return;
    }

    // 2. Check if it's a legal move for currently selected piece
    const move = state.legalMoves.find(m => m.to === square);

    if (move) {
      // 2a. Handle promotion
      if (move.flags.includes("p")) {
        setState(prev => ({
          ...prev,
          pendingPromotion: { from: state.selectedSquare!, to: square },
        }));
        return;
      }

      // 2b. Make move
      if (state.gameId && playerId && state.selectedSquare) {
        // Optimistic: update board locally
        try {
          const result = makeMove(chessRef.current, {
            from: state.selectedSquare,
            to: square,
          });
          if (result.success) {
            setState(prev => ({
              ...prev,
              board: getBoard(chessRef.current),
              turn: chessRef.current.turn(),
              selectedSquare: null,
              legalMoves: [],
              check: chessRef.current.inCheck(),
              lastMove: { from: result.from, to: result.to },
            }));
          }
        } catch (e) {
          logger.error("Local move failed", e);
        }

        // Server mutation
        makeMoveMut.mutate({
          game_id: state.gameId,
          player_id: playerId,
          from: state.selectedSquare,
          to: square,
        });
      }
      return;
    }

    // 3. Select new piece
    // Update local legal moves from chessRef
    const moves = getLegalMovesForSquare(chessRef.current, square);

    // Only allow selecting own pieces
    // Note: getLegalMovesHelper usually checks this, but we double check
    // We assume chessRef is synced.

    if (moves.length > 0) {
      setState(prev => ({
        ...prev,
        selectedSquare: square,
        legalMoves: moves,
      }));
    } else {
      setState(prev => ({ ...prev, selectedSquare: null, legalMoves: [] }));
    }
  }, [state, playerId, makeMoveMut]);

  const promoteWith = useCallback((piece: string) => {
    if (!state.pendingPromotion || !state.gameId || !playerId) return;

    const { from, to } = state.pendingPromotion;

    makeMoveMut.mutate({
      game_id: state.gameId,
      player_id: playerId,
      from,
      to,
      promotion: piece,
    });

    setState(prev => ({
      ...prev,
      pendingPromotion: null,
      selectedSquare: null,
      legalMoves: [],
    }));
  }, [state, playerId, makeMoveMut]);

  const cancelPromotion = useCallback(() => {
    setState(prev => ({ ...prev, pendingPromotion: null }));
  }, []);

  const resign = useCallback(() => {
    if (state.gameId && playerId) {
      resignMut.mutate({ game_id: state.gameId, player_id: playerId });
    }
  }, [state.gameId, playerId, resignMut]);

  const flipBoard = useCallback(() => {
    setState(prev => ({ ...prev, isFlipped: !prev.isFlipped }));
  }, []);

  const offerDraw = useCallback(() => {
    if (state.gameId && playerId) {
      offerDrawMut.mutate({ game_id: state.gameId, player_id: playerId });
    }
  }, [state.gameId, playerId, offerDrawMut]);

  const acceptDraw = useCallback(() => {
    if (state.gameId && playerId) {
      acceptDrawMut.mutate({ game_id: state.gameId, player_id: playerId });
    }
  }, [state.gameId, playerId, acceptDrawMut]);

  const declineDraw = useCallback(() => {
    if (state.gameId && playerId) {
      declineDrawMut.mutate({ game_id: state.gameId, player_id: playerId });
    }
  }, [state.gameId, playerId, declineDrawMut]);
  const rematch = useCallback(() => {
    // Create new game?
    startGame();
  }, [startGame]);

  const newGame = useCallback(() => {
    setState(initialState);
  }, []);

  return {
    ...state,
    playerId,
    theme: CHESS_THEMES[state.themeKey],
    setTheme,
    setTimeControl,
    startGame,
    joinGame,
    selectSquare,
    promoteWith,
    cancelPromotion,
    resign,
    offerDraw,
    acceptDraw,
    declineDraw,
    flipBoard,
    rematch,
    newGame,
    isLoading: gameQuery.isLoading || createGameMut.isLoading,
    isConnecting: profileQuery.isLoading && !playerId,
    connectionError: profileQuery.error,
    retryConnection: profileQuery.refetch,
  };
}
