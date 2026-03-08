import {
  buildMainBundle,
  buildMainScripts,
  buildWasm,
} from "../lazy-imports/esbuild-build-tasks.ts";

import { stop } from "../lazy-imports/esbuild-operations.ts";
import { tryCatch } from "../lazy-imports/try-catch.ts"; // Added import

const getWasmFile = async () => {
  const { promises } = await import("node:fs");
  const { readdir } = promises;

  const { data: dir, error: readdirError } = await tryCatch(readdir("./dist"));

  if (readdirError || !dir) {
    console.error("Error reading ./dist directory or directory is null:", readdirError);
    throw new Error("Failed to read ./dist directory for WASM file");
  }

  for await (const file of dir) {
    if (file.includes("esbuild") && file.includes(".wasm")) {
      return file;
    }
  }

  console.error("WASM file not found in ./dist");
  throw new Error("WASM file not found");
};

async function main() {
  try {
    await buildMainScripts();
    await buildWasm();
    const wasmFile = await getWasmFile();
    await buildMainBundle(wasmFile);
    stop();
  } catch (error) {
    console.error("Build failed:", error);
  }
}

main();
