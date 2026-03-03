import { defineConfig, mergeConfig } from "vitest/config";
import baseConfig from "../../vitest.base";

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      name: "block-tasks",
      include: ["../../.tests/block-tasks/**/*.{test,spec}.ts"],
    },
  }),
);
