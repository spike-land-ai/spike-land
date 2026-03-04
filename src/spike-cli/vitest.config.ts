import { defineConfig, mergeConfig } from "vitest/config";
import baseConfig from "../../vitest.base";

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      name: "spike-cli",
      include: ["../../.tests/spike-cli/**/*.test.ts"],
      coverage: {
        reporter: ["text"],
        exclude: [
          "dist/**",
          "**/dist/**",
          "index.ts",
          "cli.ts",
          "**/index.ts",
          "src/**/*.d.ts",
          "src/**/*.test.ts",
        ],
      },
    },
  }),
);
