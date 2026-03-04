import { defineConfig, mergeConfig } from "vitest/config";
import baseConfig from "../../vitest.base";

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      name: "vibe-dev",
      include: ["../../.tests/vibe-dev/**/*.test.ts"],
      coverage: {
        exclude: [
          "src/**/*.test.ts",
          "src/cli.ts",
          "vitest.config.ts",
          "../../vitest.base.ts",
          "../../vitest-minimal-reporter.ts",
        ],
      },
    },
  }),
);
