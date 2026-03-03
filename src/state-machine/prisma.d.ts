/**
 * Ambient type declaration for the Prisma client used by persistence.ts.
 * The actual implementation is provided at runtime via the monorepo's
 * @/lib/prisma module (mocked in tests via vi.mock).
 */

export interface StateMachineRecord {
  id: string;
  userId: string;
  name: string;
  definition: unknown;
  currentStates: string[];
  context: unknown;
  history: unknown;
  transitionLog: unknown;
  initialContext: unknown;
  shareToken: string | null;
  forkedFrom: string | null;
  isPublic: boolean;
}

export interface PrismaStateMachineDelegate {
  findFirst(args: {
    where: {
      userId?: string;
      forkedFrom?: string | null;
      name?: string;
    };
  }): Promise<StateMachineRecord | null>;

  findUnique(args: {
    where: { shareToken?: string; id?: string };
  }): Promise<StateMachineRecord | null>;

  upsert(args: {
    where: { id: string };
    create: Omit<StateMachineRecord, "id" | "forkedFrom"> & {
      forkedFrom?: string | null;
    };
    update: Partial<Omit<StateMachineRecord, "id" | "userId" | "shareToken">>;
  }): Promise<StateMachineRecord>;
}

export interface PrismaClient {
  stateMachine: PrismaStateMachineDelegate;
}

declare module "@/lib/prisma" {
  const prisma: PrismaClient;
  export default prisma;
}
