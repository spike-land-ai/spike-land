// Prisma types stub — chess-engine does not have a generated Prisma client.
// These types mirror the Prisma schema enums used across game-manager,
// player-manager, and challenge-manager.

export type ChessTimeControl =
  | "BULLET_1"
  | "BULLET_2"
  | "BLITZ_3"
  | "BLITZ_5"
  | "RAPID_10"
  | "RAPID_15"
  | "CLASSICAL_30"
  | "UNLIMITED";

export type ChessGameStatus =
  | "WAITING"
  | "ACTIVE"
  | "CHECK"
  | "CHECKMATE"
  | "STALEMATE"
  | "DRAW"
  | "RESIGNED"
  | "EXPIRED";

// ---- Stub implementation ----
// Throws at runtime making misconfiguration explicit rather than silently
// returning empty data.

/** Argument type accepted by all Prisma model methods. */
type PrismaArgs = Record<string, unknown> | undefined;

/**
 * Explicit stub surface for a Prisma model delegate.
 *
 * Enumerates every method name called by game-manager, player-manager, and
 * challenge-manager. Named properties (rather than an index signature) mean
 * TypeScript resolves each lookup to a concrete function type — never
 * `(...) | undefined` — even under `noUncheckedIndexedAccess`.
 *
 * The real PrismaClient delegate is a structural superset of this interface,
 * so host applications can inject the real client without any cast.
 */
export interface ModelStub {
  create: (args: PrismaArgs) => Promise<unknown>;
  findUnique: (args: PrismaArgs) => Promise<unknown>;
  findMany: (args: PrismaArgs) => Promise<unknown>;
  update: (args: PrismaArgs) => Promise<unknown>;
  updateMany: (args: PrismaArgs) => Promise<unknown>;
  delete: (args: PrismaArgs) => Promise<unknown>;
}

/**
 * Minimal structural type covering every Prisma model + raw method accessed
 * by game-manager, player-manager, and challenge-manager.
 *
 * The real PrismaClient satisfies this interface because its model delegates
 * are structural supersets of ModelStub.
 */
export interface PrismaClientLike {
  chessGame: ModelStub;
  chessMove: ModelStub;
  chessPlayer: ModelStub;
  chessChallenge: ModelStub;
  notification: ModelStub;
  /** Raw SQL — tagged-template, returns Promise<number> on a real client. */
  $executeRaw: (...args: unknown[]) => Promise<number>;
}

const notConfigured = (model: string, method: string) => (): never => {
  throw new Error(
    `prisma.${model}.${method}() called but no PrismaClient is configured. ` +
      "Inject a real client via the host application.",
  );
};

const makeStub = (model: string): ModelStub =>
  new Proxy({} as ModelStub, {
    get: (_, method) => notConfigured(model, String(method)),
  });

const prismaStub: PrismaClientLike = new Proxy({} as PrismaClientLike, {
  get: (_, model) => makeStub(String(model)),
});

export default prismaStub;
