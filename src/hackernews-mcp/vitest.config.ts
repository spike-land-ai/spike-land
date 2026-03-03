import { defineConfig, mergeConfig } from "vitest/config";
import baseConfig from "../../vitest.base";

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      include: ["../../.tests/hackernews-mcp/**/*.test.ts"],
      name: "hackernews-mcp",
      pool: "forks",
      fileParallelism: true,
      silent: true,
      coverage: {
        exclude: ["src/**/*.test.ts", "src/__test-utils__/**", "src/index.ts"],
      },
    },
  }),
);
