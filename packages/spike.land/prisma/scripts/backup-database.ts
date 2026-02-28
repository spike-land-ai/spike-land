#!/usr/bin/env npx tsx
/**
 * Database Backup Script
 *
 * Dumps all data from a Neon database to JSON files.
 * This is useful for creating backups before risky operations
 * or for migrating data between databases.
 *
 * Usage:
 *   npx tsx prisma/scripts/backup-database.ts
 *   DATABASE_URL=<url> npx tsx prisma/scripts/backup-database.ts
 *   npx tsx prisma/scripts/backup-database.ts --output ./my-backup
 *
 * Output:
 *   Creates a timestamped directory in prisma/backups/ with JSON files for each table.
 */

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";

// Load environment variables
config({ path: ".env.local", quiet: true });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL environment variable is required");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// Parse command line arguments
const args = process.argv.slice(2);
const outputIndex = args.indexOf("--output");
const customOutput = outputIndex !== -1 ? args[outputIndex + 1] : null;

async function backup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = customOutput
    || join(process.cwd(), "prisma", "backups", `backup-${timestamp}`);

  console.log(`\n📦 Starting database backup...`);
  console.log(`📁 Output directory: ${backupDir}\n`);

  // Create backup directory
  if (!existsSync(backupDir)) {
    mkdirSync(backupDir, { recursive: true });
  }

  // Define tables to backup with their Prisma model names
  const tables = [
    { name: "users", query: () => prisma.user.findMany() },
    { name: "accounts", query: () => prisma.account.findMany() },
    { name: "sessions", query: () => prisma.session.findMany() },
    { name: "enhanced_images", query: () => prisma.enhancedImage.findMany() },
    {
      name: "image_enhancement_jobs",
      query: () => prisma.imageEnhancementJob.findMany(),
    },
    { name: "albums", query: () => prisma.album.findMany() },
    { name: "album_images", query: () => prisma.albumImage.findMany() },
    { name: "api_keys", query: () => prisma.apiKey.findMany() },
    {
      name: "featured_gallery_items",
      query: () => prisma.featuredGalleryItem.findMany(),
    },
    {
      name: "mcp_generation_jobs",
      query: () => prisma.mcpGenerationJob.findMany(),
    },
    {
      name: "external_agent_sessions",
      query: () => prisma.externalAgentSession.findMany(),
    },
    {
      name: "agent_session_activities",
      query: () => prisma.agentSessionActivity.findMany(),
    },
    { name: "merch_categories", query: () => prisma.merchCategory.findMany() },
    { name: "merch_products", query: () => prisma.merchProduct.findMany() },
    { name: "merch_variants", query: () => prisma.merchVariant.findMany() },
    { name: "merch_orders", query: () => prisma.merchOrder.findMany() },
    {
      name: "merch_order_items",
      query: () => prisma.merchOrderItem.findMany(),
    },
    { name: "merch_shipments", query: () => prisma.merchShipment.findMany() },
    { name: "box_tiers", query: () => prisma.boxTier.findMany() },
    { name: "workspaces", query: () => prisma.workspace.findMany() },
    {
      name: "workspace_members",
      query: () => prisma.workspaceMember.findMany(),
    },
  ];

  const summary: { table: string; count: number; }[] = [];

  for (const table of tables) {
    try {
      const data = await table.query();
      const count = Array.isArray(data) ? data.length : 0;

      const filePath = join(backupDir, `${table.name}.json`);
      writeFileSync(filePath, JSON.stringify(data, null, 2));

      summary.push({ table: table.name, count });
      console.log(`✅ ${table.name}: ${count} records`);
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : String(error);
      // Some tables might not exist or have access issues
      console.log(
        `⚠️  ${table.name}: skipped (${errorMessage.substring(0, 50)}...)`,
      );
      summary.push({ table: table.name, count: -1 });
    }
  }

  // Write summary
  const summaryPath = join(backupDir, "_summary.json");
  writeFileSync(
    summaryPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        connectionString: connectionString!.replace(/:[^:@]+@/, ":****@"), // Hide password
        tables: summary,
        totalRecords: summary.filter(s => s.count >= 0).reduce(
          (a, b) => a + b.count,
          0,
        ),
      },
      null,
      2,
    ),
  );

  console.log(`\n📊 Backup complete!`);
  console.log(
    `   Total records: ${summary.filter(s => s.count >= 0).reduce((a, b) => a + b.count, 0)}`,
  );
  console.log(`   Location: ${backupDir}`);
  console.log(`   Summary: ${summaryPath}\n`);
}

backup()
  .then(() => prisma.$disconnect())
  .catch(async e => {
    console.error("Backup failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
