import { defineConfig, mergeConfig } from "vitest/config";
import baseConfig from "../../vitest.base";

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      name: "video",
      environment: "jsdom",
      pool: "forks",
      fileParallelism: true,
      silent: true,
      include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
      coverage: {
        include: ["src/**/*.ts", "src/**/*.tsx"],
        exclude: ["src/**/*.test.ts", "src/**/*.test.tsx", "src/__test-utils__/**", "src/index.ts"],
      },
    },
  }),
);
