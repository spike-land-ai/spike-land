import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockCallTool = vi.hoisted(() => vi.fn());
vi.mock("@/lib/mcp/client/mcp-client", () => ({ callTool: mockCallTool }));

vi.mock("nanoid", () => ({
  nanoid: vi.fn().mockImplementation((size?: number) => {
    const chars = "ABCDEFGHIJ";
    const len = size ?? 21;
    return chars.slice(0, Math.min(len, chars.length)).padEnd(len, "0");
  }),
}));

import { useTabletop } from "./useTabletop";

describe("useTabletop", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCallTool.mockResolvedValue("ok");
  });

  describe("initial state", () => {
    it("should return default state", () => {
      const { result } = renderHook(() => useTabletop());

      expect(result.current.view).toBe("lobby");
      expect(result.current.roomCode).toBe("");
      expect(result.current.inputRoomCode).toBe("");
      expect(result.current.connectionStatus).toBe("idle");
      expect(result.current.errorMessage).toBeNull();
      expect(result.current.playerId).toBeTruthy();
      expect(result.current.diceHistory).toEqual([]);
      expect(result.current.isRolling).toBe(false);
      expect(result.current.isCreatingRoom).toBe(false);
    });

    it("should expose all actions", () => {
      const { result } = renderHook(() => useTabletop());

      expect(typeof result.current.setInputRoomCode).toBe("function");
      expect(typeof result.current.createRoom).toBe("function");
      expect(typeof result.current.joinRoom).toBe("function");
      expect(typeof result.current.rollDice).toBe("function");
      expect(typeof result.current.clearDiceHistory).toBe("function");
      expect(typeof result.current.leaveRoom).toBe("function");
    });
  });

  describe("setInputRoomCode", () => {
    it("should update inputRoomCode", () => {
      const { result } = renderHook(() => useTabletop());

      act(() => {
        result.current.setInputRoomCode("ABCDEF");
      });

      expect(result.current.inputRoomCode).toBe("ABCDEF");
    });
  });

  describe("joinRoom", () => {
    it("should set error when room code is too short", () => {
      const { result } = renderHook(() => useTabletop());

      act(() => {
        result.current.setInputRoomCode("AB");
      });

      act(() => {
        result.current.joinRoom();
      });

      expect(result.current.errorMessage).toBe(
        "Room code must be at least 3 characters.",
      );
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("should navigate to room when code is valid", () => {
      const { result } = renderHook(() => useTabletop());

      act(() => {
        result.current.setInputRoomCode("ROOM01");
      });

      act(() => {
        result.current.joinRoom();
      });

      expect(result.current.connectionStatus).toBe("connecting");
      expect(result.current.errorMessage).toBeNull();
      expect(mockPush).toHaveBeenCalledWith(
        "/apps/tabletop-simulator/room/ROOM01",
      );
    });

    it("should trim and uppercase the room code", () => {
      const { result } = renderHook(() => useTabletop());

      act(() => {
        result.current.setInputRoomCode("  abc123  ");
      });

      act(() => {
        result.current.joinRoom();
      });

      expect(mockPush).toHaveBeenCalledWith(
        "/apps/tabletop-simulator/room/ABC123",
      );
    });
  });

  describe("createRoom", () => {
    it("should navigate to a room on success", async () => {
      mockCallTool.mockResolvedValue("Room Created");

      const { result } = renderHook(() => useTabletop());

      await act(async () => {
        await result.current.createRoom();
      });

      expect(mockPush).toHaveBeenCalledWith(
        expect.stringMatching(/^\/apps\/tabletop-simulator\/room\//),
      );
    });

    it("should call tabletop_create_room MCP tool", async () => {
      mockCallTool.mockResolvedValue("Room Created");

      const { result } = renderHook(() => useTabletop());

      await act(async () => {
        await result.current.createRoom();
      });

      expect(mockCallTool).toHaveBeenCalledWith(
        "tabletop_create_room",
        expect.objectContaining({
          host_id: expect.any(String),
          name: expect.any(String),
          max_players: 8,
        }),
      );
    });

    it("should still navigate even when MCP call fails", async () => {
      mockCallTool.mockRejectedValue(new Error("Server unavailable"));

      const { result } = renderHook(() => useTabletop());

      await act(async () => {
        await result.current.createRoom();
      });

      // Navigation should still happen even if MCP call fails
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringMatching(/^\/apps\/tabletop-simulator\/room\//),
      );
    });

    it("should set isCreatingRoom to false after completion", async () => {
      mockCallTool.mockResolvedValue("ok");

      const { result } = renderHook(() => useTabletop());

      await act(async () => {
        await result.current.createRoom();
      });

      expect(result.current.isCreatingRoom).toBe(false);
    });
  });

  describe("rollDice", () => {
    it("should add result to diceHistory", async () => {
      const { result } = renderHook(() => useTabletop());

      await act(async () => {
        await result.current.rollDice("d6");
      });

      expect(result.current.diceHistory).toHaveLength(1);
      expect(result.current.diceHistory[0]?.diceType).toBe("d6");
      expect(result.current.diceHistory[0]?.results).toHaveLength(1);
      expect(result.current.diceHistory[0]?.total).toBeGreaterThanOrEqual(1);
      expect(result.current.diceHistory[0]?.total).toBeLessThanOrEqual(6);
    });

    it("should support rolling multiple dice", async () => {
      const { result } = renderHook(() => useTabletop());

      await act(async () => {
        await result.current.rollDice("d6", 3);
      });

      expect(result.current.diceHistory[0]?.results).toHaveLength(3);
    });

    it("should limit diceHistory to 20 entries", async () => {
      const { result } = renderHook(() => useTabletop());

      for (let i = 0; i < 25; i++) {
        await act(async () => {
          await result.current.rollDice("d6");
        });
      }

      expect(result.current.diceHistory).toHaveLength(20);
    });

    it("should mark roll as critical when max value rolled", async () => {
      const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.999);

      const { result } = renderHook(() => useTabletop());

      await act(async () => {
        await result.current.rollDice("d4", 1);
      });

      randomSpy.mockRestore();

      // With 0.999 * 4 + 1 = 4.996 → floor = 4 → max for d4
      expect(result.current.diceHistory[0]?.isCritical).toBe(true);
    });

    it("should mark roll as fumble when all ones rolled", async () => {
      const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0);

      const { result } = renderHook(() => useTabletop());

      await act(async () => {
        await result.current.rollDice("d6", 2);
      });

      randomSpy.mockRestore();

      // With 0 * 6 + 1 = 1 for each die, total = count = 2 → fumble
      expect(result.current.diceHistory[0]?.isFumble).toBe(true);
    });

    it("should broadcast roll via MCP when in a room", async () => {
      mockCallTool.mockResolvedValue("ok");

      const { result } = renderHook(() => useTabletop());

      // First create a room to set roomCode
      await act(async () => {
        await result.current.createRoom();
      });

      mockCallTool.mockClear();

      await act(async () => {
        await result.current.rollDice("d20");
      });

      expect(mockCallTool).toHaveBeenCalledWith(
        "tabletop_roll_dice",
        expect.objectContaining({
          dice_type: "d20",
          player_id: expect.any(String),
        }),
      );
    });

    it("should not call MCP roll when not in a room", async () => {
      const { result } = renderHook(() => useTabletop());

      await act(async () => {
        await result.current.rollDice("d6");
      });

      expect(mockCallTool).not.toHaveBeenCalledWith(
        "tabletop_roll_dice",
        expect.anything(),
      );
    });

    it("should set isRolling to false after completion", async () => {
      const { result } = renderHook(() => useTabletop());

      await act(async () => {
        await result.current.rollDice("d6");
      });

      expect(result.current.isRolling).toBe(false);
    });
  });

  describe("clearDiceHistory", () => {
    it("should clear all dice history", async () => {
      const { result } = renderHook(() => useTabletop());

      await act(async () => {
        await result.current.rollDice("d6");
        await result.current.rollDice("d20");
      });

      expect(result.current.diceHistory).toHaveLength(2);

      act(() => {
        result.current.clearDiceHistory();
      });

      expect(result.current.diceHistory).toHaveLength(0);
    });
  });

  describe("leaveRoom", () => {
    it("should reset state and navigate to lobby", () => {
      const { result } = renderHook(() => useTabletop());

      act(() => {
        result.current.leaveRoom();
      });

      expect(result.current.roomCode).toBe("");
      expect(result.current.view).toBe("lobby");
      expect(result.current.connectionStatus).toBe("idle");
      expect(mockPush).toHaveBeenCalledWith("/apps/tabletop-simulator");
    });
  });
});
