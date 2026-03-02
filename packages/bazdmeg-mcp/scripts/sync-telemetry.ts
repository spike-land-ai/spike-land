#!/usr/bin/env tsx
/**
 * sync-telemetry.ts
 *
 * Reads /tmp/bazdmeg-telemetry.jsonl and batch-uploads new events
 * to SpacetimeDB via the `spacetime sql` CLI.
 *
 * Usage: npx tsx scripts/sync-telemetry.ts
 *
 * Tracks last-synced position in /tmp/bazdmeg-telemetry-cursor.txt
 * so subsequent runs only process new events.
 */

import { readFile, writeFile } from "node:fs/promises";
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";

const TELEMETRY_PATH = "/tmp/bazdmeg-telemetry.jsonl";
const CURSOR_PATH = "/tmp/bazdmeg-telemetry-cursor.txt";
const DATABASE = "rightful-dirt-5033";
const SOURCE = "bazdmeg-mcp";

interface TelemetryEvent {
  eventType: string;
  tool: string;
  workspace: string | null;
  metadata: Record<string, unknown>;
  timestamp: string;
  durationMs?: number;
}

async function readCursor(): Promise<number> {
  try {
    const content = await readFile(CURSOR_PATH, "utf-8");
    const parsed = parseInt(content.trim(), 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  } catch {
    return 0;
  }
}

async function writeCursor(position: number): Promise<void> {
  await writeFile(CURSOR_PATH, String(position), "utf-8");
}

function recordEvent(event: TelemetryEvent): boolean {
  const metadataJson = JSON.stringify({
    tool: event.tool,
    workspace: event.workspace,
    durationMs: event.durationMs,
    ...event.metadata,
  });

  // Escape single quotes for SQL
  const escapedMetadata = metadataJson.replace(/'/g, "''");
  const escapedEventType = event.eventType.replace(/'/g, "''");

  const sql = `INSERT INTO platform_event_table (source, event_type, metadata) VALUES ('${SOURCE}', '${escapedEventType}', '${escapedMetadata}')`;

  try {
    execSync(`spacetime sql ${DATABASE} "${sql}"`, {
      stdio: "pipe",
      timeout: 10_000,
    });
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Failed to sync event: ${message}`);
    return false;
  }
}

async function main(): Promise<void> {
  if (!existsSync(TELEMETRY_PATH)) {
    console.log("No telemetry file found at", TELEMETRY_PATH);
    return;
  }

  const content = await readFile(TELEMETRY_PATH, "utf-8");
  const lines = content.split("\n").filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    console.log("Telemetry file is empty.");
    return;
  }

  const cursor = await readCursor();
  const newLines = lines.slice(cursor);

  if (newLines.length === 0) {
    console.log(`All ${lines.length} events already synced (cursor: ${cursor}).`);
    return;
  }

  console.log(`Syncing ${newLines.length} new events (${cursor} already synced)...`);

  let synced = 0;
  let failed = 0;

  for (const line of newLines) {
    let event: TelemetryEvent;
    try {
      event = JSON.parse(line) as TelemetryEvent;
    } catch {
      console.warn("Skipping malformed line:", line.slice(0, 80));
      failed++;
      continue;
    }

    if (recordEvent(event)) {
      synced++;
    } else {
      failed++;
      // Stop on first failure to avoid gaps in sync
      console.error("Stopping sync due to failure. Will retry from this point next run.");
      break;
    }
  }

  const newCursor = cursor + synced;
  await writeCursor(newCursor);

  console.log(`Done. Synced: ${synced}, Failed: ${failed}, New cursor: ${newCursor}/${lines.length}`);
}

main().catch((err) => {
  console.error("sync-telemetry failed:", err);
  process.exit(1);
});
