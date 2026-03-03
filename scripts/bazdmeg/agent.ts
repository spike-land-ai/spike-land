import { execSync } from "node:child_process";
import type { PromptContext, PromptVariant } from "./types.js";
import { isVerbose } from "./verbose.js";

export function spawnClaude(
  prompt: PromptVariant,
  context: PromptContext,
): string {
  const rendered = prompt.render(context);
  // Strip CLAUDECODE env var to allow nested Claude sessions
  const env = { ...process.env };
  delete env.CLAUDECODE;
  const verbose = isVerbose();
  if (verbose) {
    console.log(`    [verbose] prompt: ${prompt.id} (${prompt.role})`);
    console.log(`    [verbose] input length: ${rendered.length} chars`);
  }
  const output = execSync(
    `claude -p --dangerously-skip-permissions --model sonnet`,
    {
      input: rendered,
      encoding: "utf-8",
      cwd: process.cwd(),
      env,
      // In verbose mode, let stderr flow to terminal so you can see agent progress
      stdio: verbose ? ["pipe", "pipe", "inherit"] : ["pipe", "pipe", "pipe"],
      maxBuffer: 50 * 1024 * 1024,
      timeout: 5 * 60 * 1000, // 5 min timeout
    },
  );
  if (verbose) {
    console.log(`    [verbose] agent output: ${output.length} chars`);
    // Show first 500 chars of output
    const preview = output.trim().slice(0, 500);
    console.log(`    [verbose] output preview:\n${preview}${output.length > 500 ? "\n    ..." : ""}`);
  }
  return output.trim();
}
