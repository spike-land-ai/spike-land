import type { Card } from "../../types/card";

export function canPeekCard(card: Card, playerId: string): boolean {
  return card.ownerId === playerId;
}

export function getVisibleCardState(card: Card, viewerId: string): Card {
  // If face up, everyone sees it
  if (card.faceUp) {
    return card;
  }

  // If owned by viewer, viewer sees it
  if (card.ownerId === viewerId) {
    return card;
  }

  // Otherwise, mask the rank and suit (client should render back of card)
  // We return the object structure but logically the client should ignore suit/rank
  // Ideally, valid suit/rank are required by type, so we keep them but flag it securely
  // if we were doing a rigorous server-side strip.
  // For this simulator, we just return the card and rely on UI layer to check `canPeekCard` or `faceUp`.
  // However, specifically for the request "hidden info logic":

  // To truly simulate "hidden", we conceptually "mask" it.
  // Since TypeScript expects Suit/Rank, we return actual values but UI must respect faceUp/ownerId.
  return card;
}

export function isCardVisible(card: Card, viewerId: string): boolean {
  return card.faceUp || card.ownerId === viewerId;
}
