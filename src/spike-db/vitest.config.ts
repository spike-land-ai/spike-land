import { defineConfig, mergeConfig } from "vitest/config";
import baseConfig from "../../vitest.base";

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      name: "spike-db",
      coverage: {
        exclude: ["src/**/*.test.ts", "src/**/index.ts"],
      },
    },
  }),
);
