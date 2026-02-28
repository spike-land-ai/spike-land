import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

const mockCallTool = vi.hoisted(() => vi.fn());
vi.mock("@/lib/mcp/client/mcp-client", () => ({ callTool: mockCallTool }));

import { useTabletopMcp } from "./useTabletopMcp";

describe("useTabletopMcp", () => {
  beforeEach(() => {
    mockCallTool.mockReset();
  });

  describe("initial state without roomId", () => {
    it("should return all mutation hooks in idle state", () => {
      const { result } = renderHook(() => useTabletopMcp());

      expect(result.current.createRoomMut.isLoading).toBe(false);
      expect(result.current.createRoomMut.data).toBeUndefined();
      expect(result.current.rollDiceMut.isLoading).toBe(false);
      expect(result.current.movePieceMut.isLoading).toBe(false);
      expect(result.current.drawCardMut.isLoading).toBe(false);
      expect(result.current.flipCardMut.isLoading).toBe(false);
      expect(result.current.sendMessageMut.isLoading).toBe(false);
    });

    it("should not fetch room or peers when no roomId provided", () => {
      renderHook(() => useTabletopMcp());

      // useMcpTool with enabled: false should not call callTool
      expect(mockCallTool).not.toHaveBeenCalled();
    });

    it("should expose roomQuery as not loading when disabled", () => {
      const { result } = renderHook(() => useTabletopMcp());

      expect(result.current.roomQuery.isLoading).toBe(false);
      expect(result.current.roomQuery.data).toBeUndefined();
    });

    it("should expose peersQuery as not loading when disabled", () => {
      const { result } = renderHook(() => useTabletopMcp());

      expect(result.current.peersQuery.isLoading).toBe(false);
      expect(result.current.peersQuery.data).toBeUndefined();
    });
  });

  describe("with roomId", () => {
    it("should fetch room info when roomId is provided", async () => {
      mockCallTool.mockResolvedValue("Room: Test Room\nCode: ABC123");

      const { result } = renderHook(() => useTabletopMcp("ABC123"));

      await waitFor(() => {
        expect(result.current.roomQuery.isLoading).toBe(false);
      });

      expect(mockCallTool).toHaveBeenCalledWith(
        "tabletop_get_room",
        { room_id: "ABC123" },
      );
      expect(result.current.roomQuery.data).toBe("Room: Test Room\nCode: ABC123");
    });

    it("should fetch peers when roomId is provided", async () => {
      mockCallTool.mockResolvedValue("Active Peers: Player1, Player2");

      const { result } = renderHook(() => useTabletopMcp("ABC123"));

      await waitFor(() => {
        expect(result.current.peersQuery.isLoading).toBe(false);
      });

      expect(mockCallTool).toHaveBeenCalledWith(
        "tabletop_list_peers",
        { room_id: "ABC123" },
      );
    });
  });

  describe("createRoomMut", () => {
    it("should call tabletop_create_room with correct args", async () => {
      mockCallTool.mockResolvedValue("Room Created\nRoom Code: XYZ789");

      const { result } = renderHook(() => useTabletopMcp());

      await act(async () => {
        await result.current.createRoomMut.mutateAsync({
          host_id: "player-1",
          name: "My Game",
          max_players: 4,
        });
      });

      expect(mockCallTool).toHaveBeenCalledWith("tabletop_create_room", {
        host_id: "player-1",
        name: "My Game",
        max_players: 4,
      });
    });

    it("should set data after successful create room", async () => {
      const response = "Room Created\nRoom Code: ABC123";
      mockCallTool.mockResolvedValue(response);

      const { result } = renderHook(() => useTabletopMcp());

      await act(async () => {
        await result.current.createRoomMut.mutateAsync({ host_id: "p1" });
      });

      expect(result.current.createRoomMut.data).toBe(response);
      expect(result.current.createRoomMut.error).toBeUndefined();
    });

    it("should handle create room error", async () => {
      const error = new Error("Server error");
      mockCallTool.mockRejectedValue(error);

      const { result } = renderHook(() => useTabletopMcp());

      await act(async () => {
        await expect(
          result.current.createRoomMut.mutateAsync({ host_id: "p1" }),
        ).rejects.toThrow("Server error");
      });

      expect(result.current.createRoomMut.error).toBe(error);
    });
  });

  describe("rollDiceMut", () => {
    it("should call tabletop_roll_dice with correct args", async () => {
      mockCallTool.mockResolvedValue("Dice Roll: D20\nTotal: 17");

      const { result } = renderHook(() => useTabletopMcp());

      await act(async () => {
        await result.current.rollDiceMut.mutateAsync({
          room_id: "ROOM01",
          player_id: "player-1",
          dice_type: "d20",
          count: 1,
        });
      });

      expect(mockCallTool).toHaveBeenCalledWith("tabletop_roll_dice", {
        room_id: "ROOM01",
        player_id: "player-1",
        dice_type: "d20",
        count: 1,
      });
    });

    it("should support all dice types", async () => {
      mockCallTool.mockResolvedValue("ok");

      const diceTypes = ["d4", "d6", "d8", "d10", "d12", "d20"] as const;
      const { result } = renderHook(() => useTabletopMcp());

      for (const diceType of diceTypes) {
        await act(async () => {
          await result.current.rollDiceMut.mutateAsync({
            room_id: "R1",
            player_id: "p1",
            dice_type: diceType,
          });
        });

        expect(mockCallTool).toHaveBeenCalledWith(
          "tabletop_roll_dice",
          expect.objectContaining({ dice_type: diceType }),
        );

        mockCallTool.mockClear();
      }
    });
  });

  describe("movePieceMut", () => {
    it("should call tabletop_move_piece with correct args", async () => {
      mockCallTool.mockResolvedValue("Piece Moved");

      const { result } = renderHook(() => useTabletopMcp());

      await act(async () => {
        await result.current.movePieceMut.mutateAsync({
          room_id: "ROOM01",
          player_id: "player-1",
          piece_id: "card-ace-of-spades",
          position: { x: 1.5, y: 0, z: -2.3 },
        });
      });

      expect(mockCallTool).toHaveBeenCalledWith("tabletop_move_piece", {
        room_id: "ROOM01",
        player_id: "player-1",
        piece_id: "card-ace-of-spades",
        position: { x: 1.5, y: 0, z: -2.3 },
      });
    });
  });

  describe("drawCardMut", () => {
    it("should call tabletop_draw_card with correct args", async () => {
      mockCallTool.mockResolvedValue("Card Drawn");

      const { result } = renderHook(() => useTabletopMcp());

      await act(async () => {
        await result.current.drawCardMut.mutateAsync({
          room_id: "ROOM01",
          player_id: "player-1",
        });
      });

      expect(mockCallTool).toHaveBeenCalledWith("tabletop_draw_card", {
        room_id: "ROOM01",
        player_id: "player-1",
      });
    });
  });

  describe("flipCardMut", () => {
    it("should call tabletop_flip_card with correct args", async () => {
      mockCallTool.mockResolvedValue("Card Flipped");

      const { result } = renderHook(() => useTabletopMcp());

      await act(async () => {
        await result.current.flipCardMut.mutateAsync({
          room_id: "ROOM01",
          player_id: "player-1",
          card_id: "card-123",
        });
      });

      expect(mockCallTool).toHaveBeenCalledWith("tabletop_flip_card", {
        room_id: "ROOM01",
        player_id: "player-1",
        card_id: "card-123",
      });
    });
  });

  describe("sendMessageMut", () => {
    it("should call tabletop_send_message with correct args", async () => {
      mockCallTool.mockResolvedValue("Message Sent");

      const { result } = renderHook(() => useTabletopMcp());

      await act(async () => {
        await result.current.sendMessageMut.mutateAsync({
          room_id: "ROOM01",
          player_id: "player-1",
          player_name: "Player AB12",
          content: "Hello everyone!",
        });
      });

      expect(mockCallTool).toHaveBeenCalledWith("tabletop_send_message", {
        room_id: "ROOM01",
        player_id: "player-1",
        player_name: "Player AB12",
        content: "Hello everyone!",
      });
    });

    it("should handle send message error gracefully with mutate (fire-and-forget)", async () => {
      mockCallTool.mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useTabletopMcp());

      // mutate (not mutateAsync) swallows errors
      await act(async () => {
        await result.current.sendMessageMut.mutate({
          room_id: "ROOM01",
          player_id: "player-1",
          player_name: "Player AB12",
          content: "This will fail silently",
        });
      });

      expect(result.current.sendMessageMut.error).toBeInstanceOf(Error);
    });
  });

  describe("hook structure", () => {
    it("should expose all required mutations and queries", () => {
      const { result } = renderHook(() => useTabletopMcp());

      expect(typeof result.current.createRoomMut.mutateAsync).toBe("function");
      expect(typeof result.current.rollDiceMut.mutateAsync).toBe("function");
      expect(typeof result.current.movePieceMut.mutateAsync).toBe("function");
      expect(typeof result.current.drawCardMut.mutateAsync).toBe("function");
      expect(typeof result.current.flipCardMut.mutateAsync).toBe("function");
      expect(typeof result.current.sendMessageMut.mutateAsync).toBe("function");
      expect(typeof result.current.roomQuery.refetch).toBe("function");
      expect(typeof result.current.peersQuery.refetch).toBe("function");
    });

    it("should allow resetting mutation state", async () => {
      mockCallTool.mockResolvedValue("Room Created");

      const { result } = renderHook(() => useTabletopMcp());

      await act(async () => {
        await result.current.createRoomMut.mutateAsync({ host_id: "p1" });
      });

      expect(result.current.createRoomMut.data).toBeDefined();

      act(() => {
        result.current.createRoomMut.reset();
      });

      expect(result.current.createRoomMut.data).toBeUndefined();
      expect(result.current.createRoomMut.error).toBeUndefined();
    });
  });
});
