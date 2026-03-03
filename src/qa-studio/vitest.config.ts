import { defineConfig, mergeConfig } from "vitest/config";
import baseConfig from "../../vitest.base";

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      name: "qa-studio",
      pool: "forks",
      fileParallelism: true,
      silent: true,
      coverage: {
        exclude: ["src/**/*.test.ts", "src/index.ts"],
      },
    },
  }),
);
