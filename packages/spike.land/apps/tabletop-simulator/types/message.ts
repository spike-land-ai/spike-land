// Game messages for chat and event log
export type MessageType = "chat" | "event";

export interface GameMessage {
  id: string;
  type: MessageType;
  playerId: string;
  playerName: string;
  playerColor: string;
  content: string;
  timestamp: number;
}

// Event content helpers
export interface DiceRollEvent {
  diceType: string;
  value: number;
}

export interface CardPlayEvent {
  cardRank: string;
  cardSuit: string;
}

export function formatEventContent(
  eventType: "dice_roll" | "card_play" | "card_draw" | "deck_shuffle",
  data?: DiceRollEvent | CardPlayEvent,
): string {
  switch (eventType) {
    case "dice_roll":
      return `rolled a ${(data as DiceRollEvent).value} on ${(data as DiceRollEvent).diceType}`;
    case "card_play":
      return `played ${(data as CardPlayEvent).cardRank} of ${(data as CardPlayEvent).cardSuit}`;
    case "card_draw":
      return "drew a card";
    case "deck_shuffle":
      return "shuffled the deck";
    default:
      return "";
  }
}
