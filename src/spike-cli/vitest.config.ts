import { defineConfig, mergeConfig } from "vitest/config";
import baseConfig from "../../vitest.base";

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      name: "src-spike-cli",
      include: [
        "../../.tests/spike-cli/**/*.test.ts",
        "../../.tests/spike-cli/__tests__/**/*.test.ts",
      ],
      exclude: ["node_modules", "dist"],
      coverage: {
        include: ["src/spike-cli/**/*.ts"],
        exclude: ["src/spike-cli/dist/**", "src/spike-cli/vitest.config.ts"],
      },
    },
  }),
);
