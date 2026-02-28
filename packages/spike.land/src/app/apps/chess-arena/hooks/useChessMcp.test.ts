import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/* ── Hoisted mocks ── */

const mockUseMcpToolFn = vi.hoisted(() => vi.fn());
const mockUseMcpMutationFn = vi.hoisted(() => vi.fn());
const mockChessConstructor = vi.hoisted(() => vi.fn());
const mockGetBoard = vi.hoisted(() => vi.fn());
const mockGetGameState = vi.hoisted(() => vi.fn());
const mockGetLegalMovesForSquare = vi.hoisted(() => vi.fn());
const mockMakeMove = vi.hoisted(() => vi.fn());

vi.mock("@/lib/mcp/client/hooks/use-mcp-tool", () => ({
  useMcpTool: mockUseMcpToolFn,
}));

vi.mock("@/lib/mcp/client/hooks/use-mcp-mutation", () => ({
  useMcpMutation: mockUseMcpMutationFn,
}));

vi.mock("chess.js", () => {
  const ChessMock = function(this: unknown, ...args: unknown[]) {
    return mockChessConstructor(...args);
  } as unknown as new() => ReturnType<typeof mockChessConstructor>;
  return { Chess: ChessMock };
});

vi.mock("@/lib/chess/engine", () => ({
  getBoard: mockGetBoard,
  getGameState: mockGetGameState,
  getLegalMovesForSquare: mockGetLegalMovesForSquare,
  makeMove: mockMakeMove,
}));

import { useChessMcp } from "./useChessMcp";

/* ── Helpers ── */

function makeMockChessInstance(overrides?: Record<string, unknown>) {
  return {
    turn: vi.fn().mockReturnValue("w"),
    inCheck: vi.fn().mockReturnValue(false),
    board: vi.fn().mockReturnValue([]),
    ...overrides,
  };
}

function makeMockMutation(overrides?: Record<string, unknown>) {
  return {
    mutate: vi.fn(),
    isLoading: false,
    data: undefined,
    error: undefined,
    ...overrides,
  };
}

function makeMockQuery(overrides?: Record<string, unknown>) {
  return {
    isLoading: false,
    error: undefined,
    data: undefined,
    refetch: vi.fn(),
    isRefetching: false,
    ...overrides,
  };
}

function makeFenText(
  fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  status = "WAITING",
  moves = "No moves yet",
  timeControl = "BLITZ_5",
) {
  return [
    `**FEN:** ${fen}`,
    `**Status:** ${status}`,
    `**Moves (0):** ${moves}`,
    `**Time Control:** ${timeControl}`,
  ].join("\n");
}

function makeDefaultGameState() {
  return {
    turn: "w" as const,
    isCheck: false,
    isCheckmate: false,
    isStalemate: false,
    isDraw: false,
    isGameOver: false,
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    pgn: "",
    moveCount: 1,
    isInsufficientMaterial: false,
    isThreefoldRepetition: false,
    is50MoveRule: false,
  };
}

/**
 * Setup useMcpTool to dispatch by tool name so onSuccess callbacks can be
 * captured reliably even across React StrictMode double-invocations.
 *
 * Returns setter functions so tests can control per-tool query state and
 * capture the latest onSuccess handler passed by the hook.
 */
function setupToolMocks(overrides?: {
  profileData?: string;
  profileLoading?: boolean;
  profileError?: Error;
  profileRefetch?: () => void;
}) {
  const profileCallbacks: { onSuccess?: (data: string) => void; } = {};
  const gameCallbacks: { onSuccess?: (data: string) => void; } = {};

  const profileQuery = makeMockQuery({
    data: overrides?.profileData,
    isLoading: overrides?.profileLoading ?? false,
    error: overrides?.profileError,
    refetch: overrides?.profileRefetch ?? vi.fn(),
  });

  const gameQuery = makeMockQuery({ isLoading: true });

  mockUseMcpToolFn.mockImplementation(
    (tool: string, _args: unknown, opts?: { onSuccess?: (data: string) => void; }) => {
      if (tool === "chess_list_profiles") {
        if (opts?.onSuccess) profileCallbacks.onSuccess = opts.onSuccess;
        return profileQuery;
      }
      // chess_get_game
      if (opts?.onSuccess) gameCallbacks.onSuccess = opts.onSuccess;
      return gameQuery;
    },
  );

  return { profileQuery, gameQuery, profileCallbacks, gameCallbacks };
}

/**
 * Setup useMcpMutation to dispatch by tool name (stable across re-renders).
 */
function setupMutationMocks(overrides?: {
  createPlayer?: Record<string, unknown>;
  createGame?: Record<string, unknown>;
  joinGame?: Record<string, unknown>;
  makeMove?: Record<string, unknown>;
  resign?: Record<string, unknown>;
  offerDraw?: Record<string, unknown>;
  acceptDraw?: Record<string, unknown>;
  declineDraw?: Record<string, unknown>;
}) {
  const muts = {
    createPlayerMut: makeMockMutation(overrides?.createPlayer),
    createGameMut: makeMockMutation(overrides?.createGame),
    joinGameMut: makeMockMutation(overrides?.joinGame),
    makeMoveMut: makeMockMutation(overrides?.makeMove),
    resignMut: makeMockMutation(overrides?.resign),
    offerDrawMut: makeMockMutation(overrides?.offerDraw),
    acceptDrawMut: makeMockMutation(overrides?.acceptDraw),
    declineDrawMut: makeMockMutation(overrides?.declineDraw),
  };

  mockUseMcpMutationFn.mockImplementation((tool: string) => {
    const map: Record<string, ReturnType<typeof makeMockMutation>> = {
      chess_create_player: muts.createPlayerMut,
      chess_create_game: muts.createGameMut,
      chess_join_game: muts.joinGameMut,
      chess_make_move: muts.makeMoveMut,
      chess_resign: muts.resignMut,
      chess_offer_draw: muts.offerDrawMut,
      chess_accept_draw: muts.acceptDrawMut,
      chess_decline_draw: muts.declineDrawMut,
    };
    return map[tool] ?? makeMockMutation();
  });

  return muts;
}

function setupDefaultMocks(toolOverrides?: Parameters<typeof setupToolMocks>[0]) {
  const chessInstance = makeMockChessInstance();
  mockChessConstructor.mockReturnValue(chessInstance);
  mockGetBoard.mockReturnValue([]);
  mockGetGameState.mockReturnValue(makeDefaultGameState());
  mockGetLegalMovesForSquare.mockReturnValue([]);
  mockMakeMove.mockReturnValue({
    success: false,
    from: "e2",
    to: "e4",
    fen: "",
    isCheck: false,
    isCheckmate: false,
    isStalemate: false,
    isDraw: false,
    isGameOver: false,
    san: "",
  });

  const tools = setupToolMocks(toolOverrides);
  const muts = setupMutationMocks();

  return { chessInstance, ...tools, ...muts };
}

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION 1: parseGameState (via hook onSuccess callback)
   ═══════════════════════════════════════════════════════════════════════════ */

describe("parseGameState (via hook onSuccess callback)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null for empty text — no state change", () => {
    const { gameCallbacks } = setupDefaultMocks();
    const { result } = renderHook(() => useChessMcp());

    if (gameCallbacks.onSuccess) {
      act(() => gameCallbacks.onSuccess!(""));
    }

    expect(result.current.phase).toBe("setup");
    expect(result.current.gameOver).toBeNull();
  });

  it("returns null for NOT_FOUND text — no state change", () => {
    const { gameCallbacks } = setupDefaultMocks();
    const { result } = renderHook(() => useChessMcp());

    if (gameCallbacks.onSuccess) {
      act(() => gameCallbacks.onSuccess!("NOT_FOUND: game does not exist"));
    }

    expect(result.current.phase).toBe("setup");
  });

  it("parses valid FEN text and updates board state", () => {
    const mockBoard = [[{ type: "r", color: "b" as const }]];

    const { gameCallbacks } = setupDefaultMocks();
    // Override AFTER setupDefaultMocks so our values win on the next call
    mockGetBoard.mockReturnValue(mockBoard);
    mockGetGameState.mockReturnValue({ ...makeDefaultGameState(), turn: "b" as const });
    const { result } = renderHook(() => useChessMcp());

    const fenText = makeFenText(
      "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
      "WAITING",
      "No moves yet",
      "RAPID_10",
    );

    if (gameCallbacks.onSuccess) {
      act(() => gameCallbacks.onSuccess!(fenText));
    }

    expect(result.current.board).toEqual(mockBoard);
    expect(result.current.turn).toBe("b");
    expect(result.current.selectedSquare).toBeNull();
    expect(result.current.legalMoves).toEqual([]);
    expect(result.current.timeControl).toBe("RAPID_10");
  });

  it("detects CHECKMATE from status line", () => {
    mockGetGameState.mockReturnValue({ ...makeDefaultGameState(), turn: "w" as const });

    const { gameCallbacks } = setupDefaultMocks();
    const { result } = renderHook(() => useChessMcp());

    const fenText = makeFenText(
      "rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3",
      "CHECKMATE",
    );

    if (gameCallbacks.onSuccess) {
      act(() => gameCallbacks.onSuccess!(fenText));
    }

    expect(result.current.phase).toBe("game_over");
    expect(result.current.gameOver?.reason).toBe("checkmate");
    // Turn is "w" → black delivered checkmate → winner is "b"
    expect(result.current.gameOver?.winner).toBe("b");
  });

  it("detects isCheckmate flag from engine (not just status)", () => {
    const { gameCallbacks } = setupDefaultMocks();
    // Override after setupDefaultMocks so this takes effect on next call
    // Chess mock turn() returns "w" by default → winner = "b"
    mockGetGameState.mockReturnValue({
      ...makeDefaultGameState(),
      turn: "w" as const,
      isCheckmate: true,
    });
    const { result } = renderHook(() => useChessMcp());

    const fenText = makeFenText(
      "rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3",
      "WAITING",
    );

    if (gameCallbacks.onSuccess) {
      act(() => gameCallbacks.onSuccess!(fenText));
    }

    expect(result.current.phase).toBe("game_over");
    expect(result.current.gameOver?.reason).toBe("checkmate");
    // chess.turn() returns "w" from mock → winner is opposite = "b"
    expect(result.current.gameOver?.winner).toBe("b");
  });

  it("detects Stalemate from status line", () => {
    mockGetGameState.mockReturnValue({ ...makeDefaultGameState(), turn: "w" as const });

    const { gameCallbacks } = setupDefaultMocks();
    const { result } = renderHook(() => useChessMcp());

    if (gameCallbacks.onSuccess) {
      act(() =>
        gameCallbacks.onSuccess!(makeFenText("k7/8/1K6/8/8/8/8/1Q6 w - - 0 1", "Stalemate"))
      );
    }

    expect(result.current.phase).toBe("game_over");
    expect(result.current.gameOver?.reason).toBe("stalemate");
    expect(result.current.gameOver?.winner).toBeNull();
  });

  it("detects Resigned from status line", () => {
    const { gameCallbacks } = setupDefaultMocks();
    const { result } = renderHook(() => useChessMcp());

    if (gameCallbacks.onSuccess) {
      act(() =>
        gameCallbacks.onSuccess!(makeFenText(
          "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
          "Resigned",
        ))
      );
    }

    expect(result.current.phase).toBe("game_over");
    expect(result.current.gameOver?.reason).toBe("resignation");
    expect(result.current.gameOver?.winner).toBeNull();
  });

  it("detects Draw from status line", () => {
    const { gameCallbacks } = setupDefaultMocks();
    const { result } = renderHook(() => useChessMcp());

    if (gameCallbacks.onSuccess) {
      act(() =>
        gameCallbacks.onSuccess!(makeFenText(
          "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
          "Draw",
        ))
      );
    }

    expect(result.current.phase).toBe("game_over");
    expect(result.current.gameOver?.reason).toBe("draw");
    expect(result.current.gameOver?.winner).toBeNull();
  });

  it("parses move list from text (format: plain SAN tokens separated by spaces)", () => {
    mockGetGameState.mockReturnValue({ ...makeDefaultGameState(), turn: "b" as const });

    const { gameCallbacks } = setupDefaultMocks();
    const { result } = renderHook(() => useChessMcp());

    // Each token without ". " is returned as-is → ["e4", "e5"]
    const text = [
      `**FEN:** rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1`,
      `**Status:** WAITING`,
      `**Moves (2):** e4 e5`,
      `**Time Control:** BLITZ_5`,
    ].join("\n");

    if (gameCallbacks.onSuccess) {
      act(() => gameCallbacks.onSuccess!(text));
    }

    expect(result.current.moveHistory).toEqual(["e4", "e5"]);
  });

  it("returns empty moveHistory when moves text is No moves yet", () => {
    const { gameCallbacks } = setupDefaultMocks();
    const { result } = renderHook(() => useChessMcp());

    if (gameCallbacks.onSuccess) {
      act(() => gameCallbacks.onSuccess!(makeFenText()));
    }

    expect(result.current.moveHistory).toEqual([]);
  });

  it("returns null for text without FEN line", () => {
    const { gameCallbacks } = setupDefaultMocks();
    const { result } = renderHook(() => useChessMcp());

    if (gameCallbacks.onSuccess) {
      act(() => gameCallbacks.onSuccess!("**Status:** WAITING\n**Moves (0):** No moves yet"));
    }

    // No FEN → parseGameState returns null → state unchanged
    expect(result.current.board).toBeDefined();
    expect(result.current.phase).toBe("setup");
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION 2: Hook initialization state
   ═══════════════════════════════════════════════════════════════════════════ */

describe("useChessMcp — initialization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts with setup phase and classic theme", () => {
    setupDefaultMocks();
    const { result } = renderHook(() => useChessMcp());

    expect(result.current.phase).toBe("setup");
    expect(result.current.themeKey).toBe("classic");
    expect(result.current.timeControl).toBe("BLITZ_5");
    expect(result.current.selectedSquare).toBeNull();
    expect(result.current.legalMoves).toEqual([]);
    expect(result.current.pendingPromotion).toBeNull();
    expect(result.current.gameOver).toBeNull();
    expect(result.current.gameId).toBeNull();
    expect(result.current.isFlipped).toBe(false);
    expect(result.current.isCheck).toBe(false);
    expect(result.current.drawOffer).toBeNull();
    expect(result.current.moveHistory).toEqual([]);
    expect(result.current.capturedPieces).toEqual({ w: [], b: [] });
    expect(result.current.clocks).toEqual({ w: 300_000, b: 300_000 });
  });

  it("returns all expected action functions and values", () => {
    setupDefaultMocks();
    const { result } = renderHook(() => useChessMcp());

    expect(typeof result.current.setTheme).toBe("function");
    expect(typeof result.current.setTimeControl).toBe("function");
    expect(typeof result.current.startGame).toBe("function");
    expect(typeof result.current.joinGame).toBe("function");
    expect(typeof result.current.selectSquare).toBe("function");
    expect(typeof result.current.promoteWith).toBe("function");
    expect(typeof result.current.cancelPromotion).toBe("function");
    expect(typeof result.current.resign).toBe("function");
    expect(typeof result.current.offerDraw).toBe("function");
    expect(typeof result.current.acceptDraw).toBe("function");
    expect(typeof result.current.declineDraw).toBe("function");
    expect(typeof result.current.flipBoard).toBe("function");
    expect(typeof result.current.rematch).toBe("function");
    expect(typeof result.current.newGame).toBe("function");
    expect(result.current.theme).toBeDefined();
    expect(result.current.theme.name).toBe("Classic");
  });

  it("extracts playerId from profile query onSuccess", async () => {
    const { profileCallbacks } = setupDefaultMocks();
    const { result } = renderHook(() => useChessMcp());

    expect(result.current.playerId).toBeNull();

    if (profileCallbacks.onSuccess) {
      act(() =>
        profileCallbacks.onSuccess!(
          "Profiles:\nID: deadbeef-1234-5678-abcd-000000000000\nName: Test",
        )
      );
    }

    await waitFor(() => {
      expect(result.current.playerId).toBe("deadbeef-1234-5678-abcd-000000000000");
    });
  });

  it("isConnecting is true when profile is loading and playerId is null", () => {
    setupDefaultMocks({ profileLoading: true });
    const { result } = renderHook(() => useChessMcp());

    expect(result.current.isConnecting).toBe(true);
  });

  it("isConnecting is false when playerId is set", async () => {
    const { profileCallbacks } = setupDefaultMocks();
    const { result } = renderHook(() => useChessMcp());

    if (profileCallbacks.onSuccess) {
      act(() => profileCallbacks.onSuccess!("ID: aabbccdd-1234-5678-abcd-000000000000"));
    }

    await waitFor(() =>
      expect(result.current.playerId).toBe("aabbccdd-1234-5678-abcd-000000000000")
    );

    expect(result.current.isConnecting).toBe(false);
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION 3: startGame action
   ═══════════════════════════════════════════════════════════════════════════ */

describe("useChessMcp — startGame", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does nothing when playerId is null", () => {
    // profileData is undefined → onSuccess never fires → playerId stays null
    const mocks = setupDefaultMocks({ profileData: undefined });
    const { result } = renderHook(() => useChessMcp());

    act(() => result.current.startGame());

    expect(mocks.createGameMut.mutate).not.toHaveBeenCalled();
  });

  it("calls chess_create_game with playerId and default timeControl when playerId is set", async () => {
    const { profileCallbacks, createGameMut } = setupDefaultMocks();
    const { result } = renderHook(() => useChessMcp());

    if (profileCallbacks.onSuccess) {
      act(() => profileCallbacks.onSuccess!("ID: aabbccdd-0001-0002-0003-000000000001"));
    }

    await waitFor(() =>
      expect(result.current.playerId).toBe("aabbccdd-0001-0002-0003-000000000001")
    );

    act(() => result.current.startGame());

    expect(createGameMut.mutate).toHaveBeenCalledWith({
      player_id: "aabbccdd-0001-0002-0003-000000000001",
      time_control: "BLITZ_5",
    });
  });

  it("uses the updated timeControl setting when starting a game", async () => {
    const { profileCallbacks, createGameMut } = setupDefaultMocks();
    const { result } = renderHook(() => useChessMcp());

    if (profileCallbacks.onSuccess) {
      act(() => profileCallbacks.onSuccess!("ID: aabbccdd-0001-0002-0003-000000000099"));
    }

    await waitFor(() =>
      expect(result.current.playerId).toBe("aabbccdd-0001-0002-0003-000000000099")
    );

    act(() => result.current.setTimeControl("BULLET_1"));
    act(() => result.current.startGame());

    expect(createGameMut.mutate).toHaveBeenCalledWith({
      player_id: "aabbccdd-0001-0002-0003-000000000099",
      time_control: "BULLET_1",
    });
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION 4: joinGame action
   ═══════════════════════════════════════════════════════════════════════════ */

describe("useChessMcp — joinGame", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does nothing when playerId is null", () => {
    const mocks = setupDefaultMocks({ profileData: undefined });
    const { result } = renderHook(() => useChessMcp());

    act(() => result.current.joinGame("some-game-id"));

    expect(mocks.joinGameMut.mutate).not.toHaveBeenCalled();
  });

  it("calls chess_join_game with game_id and player_id when playerId is set", async () => {
    const { profileCallbacks, joinGameMut } = setupDefaultMocks();
    const { result } = renderHook(() => useChessMcp());

    if (profileCallbacks.onSuccess) {
      act(() => profileCallbacks.onSuccess!("ID: aabbccdd-0001-0002-0003-000000000002"));
    }

    await waitFor(() =>
      expect(result.current.playerId).toBe("aabbccdd-0001-0002-0003-000000000002")
    );

    act(() => result.current.joinGame("target-game-id"));

    expect(joinGameMut.mutate).toHaveBeenCalledWith({
      game_id: "target-game-id",
      player_id: "aabbccdd-0001-0002-0003-000000000002",
    });
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION 5: selectSquare action
   ═══════════════════════════════════════════════════════════════════════════ */

describe("useChessMcp — selectSquare", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does nothing when phase is setup (not playing)", () => {
    setupDefaultMocks();
    const { result } = renderHook(() => useChessMcp());

    act(() => result.current.selectSquare("e2"));

    expect(result.current.selectedSquare).toBeNull();
    expect(result.current.legalMoves).toEqual([]);
  });

  it("clears selection when no legal moves exist for the clicked square", () => {
    mockGetLegalMovesForSquare.mockReturnValue([]);
    setupDefaultMocks();
    const { result } = renderHook(() => useChessMcp());

    act(() => result.current.selectSquare("a1"));

    expect(result.current.selectedSquare).toBeNull();
    expect(result.current.legalMoves).toEqual([]);
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION 6: promoteWith action
   ═══════════════════════════════════════════════════════════════════════════ */

describe("useChessMcp — promoteWith", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does nothing when pendingPromotion is null", () => {
    const mocks = setupDefaultMocks();
    const { result } = renderHook(() => useChessMcp());

    act(() => result.current.promoteWith("q"));

    expect(mocks.makeMoveMut.mutate).not.toHaveBeenCalled();
    expect(result.current.pendingPromotion).toBeNull();
  });

  it("does nothing when gameId is null (no active game)", () => {
    setupDefaultMocks();
    const { result } = renderHook(() => useChessMcp());

    // pendingPromotion starts null, so this is a no-op
    expect(result.current.pendingPromotion).toBeNull();
    act(() => result.current.promoteWith("q"));

    expect(result.current.pendingPromotion).toBeNull();
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION 7: cancelPromotion action
   ═══════════════════════════════════════════════════════════════════════════ */

describe("useChessMcp — cancelPromotion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sets pendingPromotion to null (is already null initially)", () => {
    setupDefaultMocks();
    const { result } = renderHook(() => useChessMcp());

    act(() => result.current.cancelPromotion());

    expect(result.current.pendingPromotion).toBeNull();
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION 8: flipBoard action
   ═══════════════════════════════════════════════════════════════════════════ */

describe("useChessMcp — flipBoard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("toggles isFlipped from false to true", () => {
    setupDefaultMocks();
    const { result } = renderHook(() => useChessMcp());

    expect(result.current.isFlipped).toBe(false);

    act(() => result.current.flipBoard());

    expect(result.current.isFlipped).toBe(true);
  });

  it("toggles isFlipped back to false on second call", () => {
    setupDefaultMocks();
    const { result } = renderHook(() => useChessMcp());

    act(() => result.current.flipBoard());
    act(() => result.current.flipBoard());

    expect(result.current.isFlipped).toBe(false);
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION 9: setTheme / setTimeControl
   ═══════════════════════════════════════════════════════════════════════════ */

describe("useChessMcp — setTheme / setTimeControl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates themeKey and returns correct theme when setTheme is called", () => {
    setupDefaultMocks();
    const { result } = renderHook(() => useChessMcp());

    act(() => result.current.setTheme("neon"));

    expect(result.current.themeKey).toBe("neon");
    expect(result.current.theme.name).toBe("Neon");
  });

  it("updates themeKey to minimal", () => {
    setupDefaultMocks();
    const { result } = renderHook(() => useChessMcp());

    act(() => result.current.setTheme("minimal"));

    expect(result.current.themeKey).toBe("minimal");
    expect(result.current.theme.name).toBe("Minimal");
  });

  it("updates timeControl when setTimeControl is called", () => {
    setupDefaultMocks();
    const { result } = renderHook(() => useChessMcp());

    act(() => result.current.setTimeControl("RAPID_10"));

    expect(result.current.timeControl).toBe("RAPID_10");
  });

  it("updates timeControl to UNLIMITED", () => {
    setupDefaultMocks();
    const { result } = renderHook(() => useChessMcp());

    act(() => result.current.setTimeControl("UNLIMITED"));

    expect(result.current.timeControl).toBe("UNLIMITED");
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION 10: newGame action
   ═══════════════════════════════════════════════════════════════════════════ */

describe("useChessMcp — newGame", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("resets state back to initial values including theme changes", () => {
    setupDefaultMocks();
    const { result } = renderHook(() => useChessMcp());

    act(() => result.current.setTheme("minimal"));
    act(() => result.current.setTimeControl("RAPID_15"));
    act(() => result.current.flipBoard());

    act(() => result.current.newGame());

    expect(result.current.phase).toBe("setup");
    expect(result.current.themeKey).toBe("classic");
    expect(result.current.timeControl).toBe("BLITZ_5");
    expect(result.current.isFlipped).toBe(false);
    expect(result.current.gameId).toBeNull();
    expect(result.current.gameOver).toBeNull();
    expect(result.current.moveHistory).toEqual([]);
    expect(result.current.selectedSquare).toBeNull();
    expect(result.current.legalMoves).toEqual([]);
    expect(result.current.drawOffer).toBeNull();
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION 11: resign / draw actions guard when gameId is null
   ═══════════════════════════════════════════════════════════════════════════ */

describe("useChessMcp — resign / draw actions (no active game)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("resign does nothing when gameId is null", () => {
    const mocks = setupDefaultMocks();
    const { result } = renderHook(() => useChessMcp());

    act(() => result.current.resign());

    expect(mocks.resignMut.mutate).not.toHaveBeenCalled();
  });

  it("offerDraw does nothing when gameId is null", () => {
    const mocks = setupDefaultMocks();
    const { result } = renderHook(() => useChessMcp());

    act(() => result.current.offerDraw());

    expect(mocks.offerDrawMut.mutate).not.toHaveBeenCalled();
  });

  it("acceptDraw does nothing when gameId is null", () => {
    const mocks = setupDefaultMocks();
    const { result } = renderHook(() => useChessMcp());

    act(() => result.current.acceptDraw());

    expect(mocks.acceptDrawMut.mutate).not.toHaveBeenCalled();
  });

  it("declineDraw does nothing when gameId is null", () => {
    const mocks = setupDefaultMocks();
    const { result } = renderHook(() => useChessMcp());

    act(() => result.current.declineDraw());

    expect(mocks.declineDrawMut.mutate).not.toHaveBeenCalled();
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION 12: auto-create player when no profiles found
   ═══════════════════════════════════════════════════════════════════════════ */

describe("useChessMcp — auto-create player", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls chess_create_player with Guest name when profile says No profiles found", () => {
    const { profileCallbacks, createPlayerMut } = setupDefaultMocks();
    renderHook(() => useChessMcp());

    if (profileCallbacks.onSuccess) {
      act(() => profileCallbacks.onSuccess!("No profiles found"));
    }

    expect(createPlayerMut.mutate).toHaveBeenCalledWith({ name: "Guest" });
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION 13: connection state exposure
   ═══════════════════════════════════════════════════════════════════════════ */

describe("useChessMcp — connection state", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exposes connectionError from profile query", () => {
    const connectionError = new Error("401 Unauthorized");
    setupDefaultMocks({ profileError: connectionError });
    const { result } = renderHook(() => useChessMcp());

    expect(result.current.connectionError).toBe(connectionError);
  });

  it("exposes retryConnection as the profile refetch function", () => {
    const refetch = vi.fn();
    setupDefaultMocks({ profileRefetch: refetch });
    const { result } = renderHook(() => useChessMcp());

    expect(result.current.retryConnection).toBe(refetch);
  });

  it("isLoading is a boolean", () => {
    setupDefaultMocks();
    const { result } = renderHook(() => useChessMcp());

    expect(typeof result.current.isLoading).toBe("boolean");
  });
});
