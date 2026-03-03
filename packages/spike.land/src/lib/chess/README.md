# Chess Library

Business logic for the multiplayer chess system backing the Chess Arena app.

## Key Files

| File                   | Responsibility                                                                                                                    |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `types.ts`             | Shared types: `ChessColor`, `GameState`, `MoveResult`, `EloUpdate`, `GameResult`, `TIME_CONTROL_MS`                               |
| `engine.ts`            | Pure chess logic wrapping `chess.js`: `createGame`, `makeMove`, `getGameState`, `getLegalMoves`, `validateFen`                    |
| `elo.ts`               | ELO rating math: `expectedScore`, `getKFactor` (K=16/32/40 by rating/games), `calculateEloChange`                                 |
| `game-manager.ts`      | Database-backed game lifecycle: create, join, move, resign, draw — calls `engine.ts` for move validation and `elo.ts` on game end |
| `player-manager.ts`    | Player profile CRUD: create/fetch player records, rating and stats (wins/losses/draws/streak)                                     |
| `challenge-manager.ts` | Challenge flow: send/accept/decline/expire challenges (5-minute TTL); on accept, creates a game via `game-manager`                |

## Dependency Flow

```
types.ts
  └── engine.ts          (pure, no DB)
  └── elo.ts             (pure, no DB)
      └── game-manager.ts  (Prisma + engine + elo)
      └── player-manager.ts (Prisma)
      └── challenge-manager.ts (Prisma + game-manager)
```

## Time Controls

Defined in `types.ts` as `TIME_CONTROL_MS`: `BULLET_1`, `BULLET_2`, `BLITZ_3`,
`BLITZ_5`, `RAPID_10`, `RAPID_15`, `CLASSICAL_30`, `UNLIMITED`.

## ELO System

Standard Elo formula with dynamic K-factor:

- K=40 for players with fewer than 30 games
- K=32 for standard players
- K=16 for players rated above 2400

## Related

- MCP tools: `src/lib/mcp/server/tools/chess/`
- App UI: `src/app/apps/chess-arena/`
- Store app tools: `packages/store-apps/chess-arena/`
- Database schema:
  [docs/architecture/DATABASE_SCHEMA.md](../../../docs/architecture/DATABASE_SCHEMA.md)
