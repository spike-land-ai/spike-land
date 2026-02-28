"use client";

import { useMcpMutation } from "@/lib/mcp/client/hooks/use-mcp-mutation";
import { useMcpTool } from "@/lib/mcp/client/hooks/use-mcp-tool";
import type { DiceType } from "@apps/tabletop-simulator/types/dice";

export interface CreateRoomArgs {
  host_id: string;
  name?: string;
  max_players?: number;
}

export interface RollDiceArgs {
  room_id: string;
  player_id: string;
  dice_type: DiceType;
  count?: number;
}

export interface MovePieceArgs {
  room_id: string;
  player_id: string;
  piece_id: string;
  position: { x: number; y: number; z: number; };
}

export interface DrawCardArgs {
  room_id: string;
  player_id: string;
}

export interface FlipCardArgs {
  room_id: string;
  player_id: string;
  card_id: string;
}

export interface SendMessageArgs {
  room_id: string;
  player_id: string;
  player_name: string;
  content: string;
}

export interface GetRoomArgs {
  room_id: string;
}

export function useTabletopMcp(roomId?: string) {
  const createRoomMut = useMcpMutation<string>("tabletop_create_room");
  const rollDiceMut = useMcpMutation<string>("tabletop_roll_dice");
  const movePieceMut = useMcpMutation<string>("tabletop_move_piece");
  const drawCardMut = useMcpMutation<string>("tabletop_draw_card");
  const flipCardMut = useMcpMutation<string>("tabletop_flip_card");
  const sendMessageMut = useMcpMutation<string>("tabletop_send_message");

  const roomQuery = useMcpTool<string>(
    "tabletop_get_room",
    roomId ? { room_id: roomId } : {},
    { enabled: !!roomId },
  );

  const peersQuery = useMcpTool<string>(
    "tabletop_list_peers",
    roomId ? { room_id: roomId } : {},
    { enabled: !!roomId },
  );

  return {
    createRoomMut,
    rollDiceMut,
    movePieceMut,
    drawCardMut,
    flipCardMut,
    sendMessageMut,
    roomQuery,
    peersQuery,
  };
}
