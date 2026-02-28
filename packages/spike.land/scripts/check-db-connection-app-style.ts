import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;

// Replicating src/lib/prisma.ts exactly
// @ts-expect-error - Ignoring type check to test runtime behavior
const adapter = new PrismaPg({ connectionString });

const prisma = new PrismaClient({
  adapter,
  log: ["query", "info", "warn", "error"],
});

async function main() {
  console.log("Connecting to DB (App Style)...");
  try {
    const result = await prisma.$queryRaw`SELECT 1`;
    console.log("Connection successful:", result);
  } catch (e) {
    console.error("Connection failed:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
