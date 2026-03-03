import { defineConfig, mergeConfig } from "vitest/config";
import baseConfig from "../../vitest.base";

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      include: ["../../.tests/state-machine/**/*.test.ts"],
      name: "state-machine",
      coverage: {
        exclude: ["src/**/*.test.ts", "src/cli.ts", "src/index.ts", "src/types.ts"],
      },
    },
  }),
);
