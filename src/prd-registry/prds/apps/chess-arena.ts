import type { PrdDefinition } from "../../core-logic/types.js";

export const chessArenaPrd: PrdDefinition = {
  id: "app:chess-arena",
  level: "app",
  name: "Chess Arena",
  summary:
    "Multiplayer chess with live ladders, match queues, Stockfish analysis, and ELO rankings",
  purpose:
    "A flagship 3D chess experience. Complete with multiplayer matchmaking, Stockfish-powered analysis, vibrant leaderboards, and tournament support.",
  constraints: [
    "Moves must be validated server-side before broadcast",
    "ELO updates are atomic (both players in one transaction)",
    "Stockfish analysis runs in a Web Worker, not main thread",
    "Game state must survive page refresh via Durable Objects",
  ],
  acceptance: [
    "Two players can complete a game with correct ELO updates",
    "Leaderboard reflects current rankings within 5s of game end",
    "Stockfish analysis available for any completed game",
  ],
  toolCategories: [
    "chess-game",
    "chess-player",
    "chess-challenge",
    "chess-replay",
    "chess-tournament",
  ],
  tools: ["chess_create_game", "chess_make_move", "chess_get_leaderboard"],
  composesFrom: ["platform", "domain:app-building", "route:/apps"],
  routePatterns: ["/apps/chess-arena"],
  keywords: ["chess", "game", "elo", "leaderboard", "match", "tournament"],
  tokenEstimate: 400,
  version: "1.0.0",
};
