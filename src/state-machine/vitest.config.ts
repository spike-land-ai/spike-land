import { defineConfig, mergeConfig } from "vitest/config";
import baseConfig from "../../vitest.base";

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      name: "state-machine",
      coverage: {
        exclude: [
          "src/**/*.test.ts",
          "src/cli.ts",
          "src/index.ts",
          "src/types.ts",
          "src/user-test.ts",
        ],
      },
    },
  }),
);
