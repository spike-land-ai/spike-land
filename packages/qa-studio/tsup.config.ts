import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["index.ts", "mcp-server.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  target: "node20",
  external: ["@modelcontextprotocol/sdk", "cors", "express", "playwright", "zod"],
});
