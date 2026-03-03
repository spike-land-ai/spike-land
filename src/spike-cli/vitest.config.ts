import { defineConfig, mergeConfig } from "vitest/config";
import baseConfig from "../../vitest.base";

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      name: "spike-cli",
      include: ["__tests__/**/*.{test,spec}.ts", "src/**/*.{test,spec}.ts"],
    },
  }),
);
