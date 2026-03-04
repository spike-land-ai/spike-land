import { defineConfig, mergeConfig } from "vitest/config";
import baseConfig from "../../vitest.base";

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      name: "openclaw-mcp",
      include: ["../../.tests/openclaw-mcp/**/*.test.ts"],
      coverage: {
        reporter: ["text-summary"],
        exclude: ["src/**/*.d.ts", "src/**/*.test.ts", "src/index.ts",
          "**/index.ts", "**/types.ts"],
        thresholds: {
          lines: 95,
          functions: 85,
          branches: 96,
          statements: 95,
        },
      },
    },
  }),
);
