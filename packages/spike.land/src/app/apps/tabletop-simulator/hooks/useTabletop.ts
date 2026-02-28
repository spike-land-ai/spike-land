"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";
import { useMcpMutation } from "@/lib/mcp/client/hooks/use-mcp-mutation";
import type { DiceType } from "@apps/tabletop-simulator/types/dice";

export type ConnectionStatus = "idle" | "connecting" | "connected" | "error";

export type AppView = "lobby" | "game";

export interface DiceRollResult {
  id: string;
  diceType: DiceType;
  results: number[];
  total: number;
  isCritical: boolean;
  isFumble: boolean;
  timestamp: number;
}

export interface TabletopState {
  view: AppView;
  roomCode: string;
  inputRoomCode: string;
  connectionStatus: ConnectionStatus;
  errorMessage: string | null;
  playerId: string | null;
  diceHistory: DiceRollResult[];
  isRolling: boolean;
  isCreatingRoom: boolean;
}

export interface TabletopActions {
  setInputRoomCode: (code: string) => void;
  createRoom: () => Promise<void>;
  joinRoom: () => void;
  rollDice: (type: DiceType, count?: number) => Promise<void>;
  clearDiceHistory: () => void;
  leaveRoom: () => void;
}

const DICE_FACES: Record<DiceType, number> = {
  d4: 4,
  d6: 6,
  d8: 8,
  d10: 10,
  d12: 12,
  d20: 20,
};

export function useTabletop(): TabletopState & TabletopActions {
  const router = useRouter();

  const [view, setView] = useState<AppView>("lobby");
  const [roomCode, setRoomCode] = useState("");
  const [inputRoomCode, setInputRoomCode] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [playerId] = useState<string>(() => nanoid(8));
  const [diceHistory, setDiceHistory] = useState<DiceRollResult[]>([]);
  const [isRolling, setIsRolling] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  // MCP mutations
  const createRoomMutation = useMcpMutation<{ room_code?: string; }>(
    "tabletop_create_room",
  );

  const rollDiceMutation = useMcpMutation("tabletop_roll_dice");

  const createRoom = useCallback(async () => {
    setIsCreatingRoom(true);
    setErrorMessage(null);

    try {
      // Call MCP tool to create room (optional — falls back to client-side ID)
      await createRoomMutation.mutateAsync({
        host_id: playerId,
        name: `${playerId.slice(0, 4)}'s Game`,
        max_players: 8,
      });
    } catch {
      // MCP call failing is non-blocking — we still navigate to a room
    }

    const id = nanoid(6).toUpperCase();
    setRoomCode(id);
    setConnectionStatus("connecting");
    router.push(`/apps/tabletop-simulator/room/${id}`);
    setIsCreatingRoom(false);
  }, [router, playerId, createRoomMutation]);

  const joinRoom = useCallback(() => {
    const trimmed = inputRoomCode.trim().toUpperCase();
    if (trimmed.length < 3) {
      setErrorMessage("Room code must be at least 3 characters.");
      return;
    }
    setConnectionStatus("connecting");
    setErrorMessage(null);
    setRoomCode(trimmed);
    router.push(`/apps/tabletop-simulator/room/${trimmed}`);
  }, [router, inputRoomCode]);

  const rollDice = useCallback(
    async (type: DiceType, count = 1) => {
      if (isRolling) return;
      setIsRolling(true);

      // Local roll for immediate UI feedback
      const faces = DICE_FACES[type];
      const results: number[] = [];
      for (let i = 0; i < count; i++) {
        results.push(Math.floor(Math.random() * faces) + 1);
      }
      const total = results.reduce((a, b) => a + b, 0);
      const maxPossible = faces * count;

      const rollResult: DiceRollResult = {
        id: nanoid(),
        diceType: type,
        results,
        total,
        isCritical: total === maxPossible,
        isFumble: total === count,
        timestamp: Date.now(),
      };

      setDiceHistory(prev => [rollResult, ...prev].slice(0, 20));

      // Also call MCP tool to broadcast roll to room
      if (roomCode) {
        try {
          await rollDiceMutation.mutateAsync({
            room_id: roomCode,
            player_id: playerId,
            dice_type: type,
            count,
          });
        } catch {
          // Non-blocking — local roll result still shown
        }
      }

      setIsRolling(false);
    },
    [isRolling, roomCode, playerId, rollDiceMutation],
  );

  const clearDiceHistory = useCallback(() => {
    setDiceHistory([]);
  }, []);

  const leaveRoom = useCallback(() => {
    setRoomCode("");
    setView("lobby");
    setConnectionStatus("idle");
    router.push("/apps/tabletop-simulator");
  }, [router]);

  return {
    view,
    roomCode,
    inputRoomCode,
    connectionStatus,
    errorMessage,
    playerId,
    diceHistory,
    isRolling,
    isCreatingRoom,
    setInputRoomCode,
    createRoom,
    joinRoom,
    rollDice,
    clearDiceHistory,
    leaveRoom,
  };
}
