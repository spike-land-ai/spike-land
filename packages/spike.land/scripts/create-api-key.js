const { PrismaClient } = require("../src/generated/prisma");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const { createHash, randomBytes } = require("crypto");

const connectionString = process.env.DATABASE_URL;

function generateApiKey() {
  const prefix = "sk_test_";
  const keyBody = randomBytes(32).toString("base64url");
  const fullKey = prefix + keyBody;
  const hash = createHash("sha256").update(fullKey).digest("hex");
  const maskedPrefix = fullKey.slice(0, 7) + "...****";
  return { key: fullKey, hash, prefix: maskedPrefix };
}

async function main() {
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const userId = "fake_user_1";
  const name = "QA Test Key";
  const { key, hash, prefix } = generateApiKey();

  try {
    const apiKey = await prisma.apiKey.create({
      data: {
        userId,
        name,
        keyHash: hash,
        keyPrefix: prefix,
      },
    });
    console.log(`Created API key: ${key}`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch(console.error);
