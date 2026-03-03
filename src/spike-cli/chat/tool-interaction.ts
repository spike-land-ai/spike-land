/**
 * Interactive tool invocation helpers: prompting, value coercion, and ID extraction.
 */

import type { Interface as ReadlineInterface } from "node:readline";
import { bold, dim } from "../shell/formatter";

/**
 * Prompt the user interactively for a parameter value.
 */
export async function promptForParam(
  rl: ReadlineInterface,
  param: { name: string; description: string; type: string },
): Promise<string> {
  return new Promise((resolve) => {
    const hint = param.description ? ` (${param.description})` : "";
    const typeHint = param.type !== "string" ? ` [${param.type}]` : "";
    rl.question(`  ${bold(param.name)}${dim(hint)}${dim(typeHint)}: `, (answer) => {
      resolve(answer.trim());
    });
  });
}

/**
 * Coerce a string value to the appropriate JS type based on the schema type.
 */
export function coerceValue(value: string, type: string): unknown {
  switch (type) {
    case "number":
    case "integer":
      return Number(value);
    case "boolean":
      return value.toLowerCase() === "true" || value === "1";
    case "array":
    case "object":
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    default:
      return value;
  }
}

/**
 * Try to extract IDs from a tool result for session state tracking.
 * Looks for common ID fields in JSON results.
 */
export function extractIdsFromResult(result: string): string[] {
  try {
    const parsed = JSON.parse(result);
    const ids: string[] = [];
    const idKeys = ["id", "game_id", "player_id", "app_id", "session_id"];
    for (const key of idKeys) {
      if (typeof parsed[key] === "string") {
        ids.push(parsed[key]);
      }
    }
    return ids;
  } catch {
    return [];
  }
}
