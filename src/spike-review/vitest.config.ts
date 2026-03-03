import { defineConfig, mergeConfig } from "vitest/config";
import baseConfig from "../../vitest.base";

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      include: ["../../.tests/spike-review/**/*.test.ts"],
      name: "spike-review",
      coverage: {
        exclude: [
          "src/**/*.test.ts",
          "src/__test-utils__/**",
          "src/cli.ts",
          "src/worker/**",
          "src/index.ts",
        ],
      },
    },
  }),
);
