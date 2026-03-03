// Prisma client stub — chess-engine does not bundle a Prisma client.
// This file exports typed interfaces matching the Prisma operations used
// across game-manager, player-manager, and challenge-manager.
// In production, the host application (spike.land) provides a real PrismaClient.

import type { ChessGameStatus, ChessTimeControl } from "@/generated/prisma";

// ---- Record types (mirror Prisma model shapes) ----

export interface ChessGameRecord {
  id: string;
  whitePlayerId: string;
  blackPlayerId: string | null;
  status: string;
  fen: string;
  pgn: string;
  timeControl: string;
  whiteTimeMs: number;
  blackTimeMs: number;
  winnerId: string | null;
  result: string | null;
  eloChanges: unknown;
  moveCount: number;
  createdAt: Date;
  updatedAt: Date;
  moves?: ChessMoveRecord[];
}

export interface ChessMoveRecord {
  id: string;
  gameId: string;
  moveNumber: number;
  san: string;
  from: string;
  to: string;
  fen: string;
  playerId: string;
  timeSpentMs: number | null;
  createdAt: Date;
}

export interface ChessPlayerRecord {
  id: string;
  userId: string;
  name: string;
  avatar: string | null;
  elo: number;
  bestElo: number;
  wins: number;
  losses: number;
  draws: number;
  streak: number;
  soundEnabled: boolean;
  isOnline: boolean;
  lastSeenAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChessChallengeRecord {
  id: string;
  senderId: string;
  receiverId: string;
  status: string;
  timeControl: string;
  senderColor: string | null;
  gameId: string | null;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationRecord {
  id: string;
  userId: string;
  workspaceId: string;
  type: string;
  title: string;
  message: string;
  createdAt: Date;
}

// ---- Input types ----

export interface ChessGameCreateInput {
  whitePlayerId: string;
  blackPlayerId?: string;
  status: ChessGameStatus | string;
  fen: string;
  timeControl: ChessTimeControl;
  whiteTimeMs: number;
  blackTimeMs: number;
}

export interface ChessGameUpdateInput {
  blackPlayerId?: string | null;
  status?: ChessGameStatus | string;
  fen?: string;
  pgn?: string;
  moveCount?: number;
  winnerId?: string | null;
  result?: string | null;
  eloChanges?: {
    whiteNewElo: number;
    blackNewElo: number;
    whiteChange: number;
    blackChange: number;
  };
}

export interface ChessMoveCreateInput {
  gameId: string;
  moveNumber: number;
  san: string;
  from: string;
  to: string;
  fen: string;
  playerId: string;
  timeSpentMs?: number | null;
}

export interface ChessPlayerCreateInput {
  userId: string;
  name: string;
  avatar?: string;
}

export interface ChessPlayerUpdateInput {
  elo?: number;
  bestElo?: number;
  wins?: number;
  losses?: number;
  draws?: number;
  streak?: number;
  isOnline?: boolean;
  lastSeenAt?: Date;
  name?: string;
  avatar?: string;
  soundEnabled?: boolean;
}

export interface ChessChallengeCreateInput {
  senderId: string;
  receiverId: string;
  timeControl: ChessTimeControl;
  senderColor?: string | null;
  expiresAt: Date;
}

export interface ChessChallengeUpdateInput {
  status?: string;
  gameId?: string | null;
}

export interface NotificationCreateInput {
  userId: string;
  workspaceId: string;
  type: string;
  title: string;
  message: string;
}

export interface UpdateManyResult {
  count: number;
}

// ---- Where clause types ----

interface WhereUniqueId {
  id: string;
}

interface WhereUniqueIdUserId {
  id: string;
  userId: string;
}

// ---- Model delegate types ----

interface ChessGameDelegate {
  create(args: { data: ChessGameCreateInput }): Promise<ChessGameRecord>;
  findUnique(args: {
    where: WhereUniqueId;
    include?: { moves?: boolean };
  }): Promise<ChessGameRecord | null>;
  update(args: { where: WhereUniqueId; data: ChessGameUpdateInput }): Promise<ChessGameRecord>;
  findMany(args: {
    where?: Record<string, unknown>;
    select?: Record<string, boolean>;
    orderBy?: Record<string, string>;
  }): Promise<ChessGameRecord[]>;
  updateMany(args: {
    where: Record<string, unknown>;
    data: Record<string, unknown>;
  }): Promise<UpdateManyResult>;
}

interface ChessPlayerDelegate {
  create(args: { data: ChessPlayerCreateInput }): Promise<ChessPlayerRecord>;
  findUnique(args: { where: WhereUniqueId }): Promise<ChessPlayerRecord | null>;
  update(args: {
    where: WhereUniqueId | WhereUniqueIdUserId;
    data: ChessPlayerUpdateInput;
  }): Promise<ChessPlayerRecord>;
  findMany(args: {
    where?: Record<string, unknown>;
    select?: Record<string, boolean>;
  }): Promise<ChessPlayerRecord[]>;
  delete(args: { where: WhereUniqueIdUserId }): Promise<ChessPlayerRecord>;
}

interface ChessMoveDelegate {
  create(args: { data: ChessMoveCreateInput }): Promise<ChessMoveRecord>;
  findMany(args: {
    where?: Record<string, unknown>;
    orderBy?: Record<string, string>;
  }): Promise<ChessMoveRecord[]>;
}

interface ChessChallengeDelegate {
  create(args: { data: ChessChallengeCreateInput }): Promise<ChessChallengeRecord>;
  findUnique(args: { where: WhereUniqueId }): Promise<ChessChallengeRecord | null>;
  update(args: {
    where: WhereUniqueId;
    data: ChessChallengeUpdateInput;
  }): Promise<ChessChallengeRecord>;
  findMany(args: {
    where?: Record<string, unknown>;
    select?: Record<string, boolean>;
  }): Promise<ChessChallengeRecord[]>;
  updateMany(args: {
    where: Record<string, unknown>;
    data: Record<string, unknown>;
  }): Promise<UpdateManyResult>;
}

interface NotificationDelegate {
  create(args: { data: NotificationCreateInput }): Promise<NotificationRecord>;
}

export interface PrismaClientLike {
  chessGame: ChessGameDelegate;
  chessPlayer: ChessPlayerDelegate;
  chessMove: ChessMoveDelegate;
  chessChallenge: ChessChallengeDelegate;
  notification: NotificationDelegate;
  $executeRaw(strings: TemplateStringsArray, ...values: unknown[]): Promise<number>;
}

// ---- Stub implementation ----
// Throws at runtime making misconfiguration explicit rather than silently
// returning empty data.

const notConfigured = (model: string, method: string) => (): never => {
  throw new Error(
    `prisma.${model}.${method}() called but no PrismaClient is configured. ` +
      "Inject a real client via the host application.",
  );
};

const makeGameStub = (): ChessGameDelegate => ({
  create: notConfigured("chessGame", "create"),
  findUnique: notConfigured("chessGame", "findUnique"),
  update: notConfigured("chessGame", "update"),
  findMany: notConfigured("chessGame", "findMany"),
  updateMany: notConfigured("chessGame", "updateMany"),
});

const makePlayerStub = (): ChessPlayerDelegate => ({
  create: notConfigured("chessPlayer", "create"),
  findUnique: notConfigured("chessPlayer", "findUnique"),
  update: notConfigured("chessPlayer", "update"),
  findMany: notConfigured("chessPlayer", "findMany"),
  delete: notConfigured("chessPlayer", "delete"),
});

const makeMoveStub = (): ChessMoveDelegate => ({
  create: notConfigured("chessMove", "create"),
  findMany: notConfigured("chessMove", "findMany"),
});

const makeChallengeStub = (): ChessChallengeDelegate => ({
  create: notConfigured("chessChallenge", "create"),
  findUnique: notConfigured("chessChallenge", "findUnique"),
  update: notConfigured("chessChallenge", "update"),
  findMany: notConfigured("chessChallenge", "findMany"),
  updateMany: notConfigured("chessChallenge", "updateMany"),
});

const makeNotificationStub = (): NotificationDelegate => ({
  create: notConfigured("notification", "create"),
});

const prismaStub: PrismaClientLike = {
  chessGame: makeGameStub(),
  chessPlayer: makePlayerStub(),
  chessMove: makeMoveStub(),
  chessChallenge: makeChallengeStub(),
  notification: makeNotificationStub(),
  $executeRaw: notConfigured("$executeRaw", "call"),
};

export default prismaStub;
