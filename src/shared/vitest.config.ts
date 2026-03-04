import { defineConfig, mergeConfig } from "vitest/config";
import baseConfig from "../../vitest.base";

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      name: "shared",
      include: ["../../.tests/shared/**/*.test.ts"],
      coverage: {
        reporter: ["text", "text-summary"],
        include: [
          "src/constants/**/*.ts",
          "src/validations/**/*.ts",
          "src/utils/**/*.ts",
          "src/tool-builder/**/*.ts",
        ],
        exclude: [
          "src/**/*.d.ts",
          "src/**/*.test.ts",
          "src/index.ts",
          "src/types/**/*.ts",
          "src/tool-builder/types.ts",
          "src/tsup.config.ts",
        ],
      },
    },
  }),
);
