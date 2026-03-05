import { defineConfig, mergeConfig } from "vitest/config";
import baseConfig from "../../vitest.base";

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      name: "src-esbuild-wasm-mcp",
      include: ["../../.tests/esbuild-wasm-mcp/**/*.test.ts"],
      exclude: ["node_modules", "dist"],
      coverage: {
        include: ["src/esbuild-wasm-mcp/**/*.ts"],
        exclude: [
          "src/esbuild-wasm-mcp/dist/**",
          "src/esbuild-wasm-mcp/vitest.config.ts",
          // index.ts is the MCP server binary entrypoint (starts process, not library code)
          "src/esbuild-wasm-mcp/index.ts",
        ],
      },
    },
  }),
);
