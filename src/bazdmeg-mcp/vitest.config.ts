import { defineConfig, mergeConfig } from "vitest/config";
import baseConfig from "../../vitest.base";

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      include: ["../../.tests/bazdmeg-mcp/**/*.test.ts"],
      name: "bazdmeg-mcp",
      pool: "forks",
      fileParallelism: true,
      silent: true,
      coverage: {
        exclude: ["src/**/*.test.ts", "src/__test-utils__/**", "src/index.ts"],
        thresholds: {
          lines: 90,
          functions: 90,
          branches: 90,
          statements: 90,
        },
      },
    },
  }),
);
