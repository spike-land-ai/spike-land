import { PrismaClient } from "@/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { logger } from "@/lib/logger";

/**
 * Get the database connection string, preferring Cloudflare Hyperdrive
 * when available (Workers runtime) and falling back to DATABASE_URL.
 */
function getConnectionString(): string | undefined {
  // On Cloudflare Workers, use Hyperdrive for managed connection pooling
  try {
    // Dynamic import to avoid errors in non-Workers environments
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { env } = require("cloudflare:workers") as {
      env: { HYPERDRIVE?: { connectionString: string } };
    };
    if (env.HYPERDRIVE?.connectionString) {
      return env.HYPERDRIVE.connectionString;
    }
  } catch {
    // Not running on Cloudflare Workers — fall through to DATABASE_URL
  }
  return process.env.DATABASE_URL;
}

const prismaClientSingleton = () => {
  const rawConnectionString = getConnectionString();

  if (!rawConnectionString) {
    // If we're in a build environment or E2E test context,
    // the DB might not be available. Instead of throwing, we'll return a mock client.
    const isBuild = process.env.NEXT_PHASE === "phase-production-build";
    const isE2ETestContext =
      process.env.CI === "true" && process.env.BASE_URL && !rawConnectionString;

    if (isBuild || isE2ETestContext) {
      if (isBuild) {
        logger.warn("DATABASE_URL not available during build. Using mocked Prisma Client.");
      }
      return new Proxy(
        {},
        {
          get: (_, prop) => {
            throw new Error(
              `Attempted to access Prisma without DATABASE_URL (property: ${String(
                prop,
              )}). Please ensure DATABASE_URL is set.`,
            );
          },
        },
      ) as PrismaClient;
    }

    throw new Error(
      "DATABASE_URL environment variable is required for database access. " +
        "Please ensure it is set in your environment.",
    );
  }

  // Rewrite sslmode=require → sslmode=verify-full to suppress pg v9 deprecation warning
  const connectionString = rawConnectionString.replace(/sslmode=require\b/, "sslmode=verify-full");

  // When using Hyperdrive, it manages the connection pool — no need for local pooling config.
  // When using DATABASE_URL directly, use serverless-friendly pool settings.
  const isHyperdrive = connectionString !== process.env.DATABASE_URL;

  const adapter = new PrismaPg({
    connectionString,
    connectionTimeoutMillis: 15_000,
    ...(isHyperdrive ? {} : { max: 5, idleTimeoutMillis: 30_000 }),
    ssl: process.env.NODE_ENV === "production" && !isHyperdrive ? true : undefined,
  });
  return new PrismaClient({
    adapter,
    log: ["error", "warn"],
  });
};

declare const globalThis: {
  prismaGlobal_LearnIt: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal_LearnIt ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal_LearnIt = prisma;
}
