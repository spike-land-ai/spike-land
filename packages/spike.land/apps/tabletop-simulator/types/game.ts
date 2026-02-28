import type { DeckState } from "./card";
import type { Card } from "./card";
import type { DiceState } from "./dice";

export interface GameState {
  roomId: string;
  players: Map<string, Player>;
  deck: DeckState;
  dice: DiceState[];
  turn: TurnState;
}

export interface Player {
  id: string;
  peerId: string;
  name: string;
  hand: Card[];
  position: "north" | "south" | "east" | "west";
  isHost: boolean;
  mediaStream?: MediaStream | null; // Local only, not synced
  audioEnabled: boolean;
  videoEnabled: boolean;
}

export interface TurnState {
  currentPlayerId: string;
  phase: "draw" | "action" | "end";
}
