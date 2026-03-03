import { defineConfig, mergeConfig } from "vitest/config";
import baseConfig from "../../vitest.base";

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      name: "openclaw-mcp",
      include: ["src/**/*.{test,spec}.ts"],
      coverage: {
        reporter: ["text-summary"],
        exclude: ["src/**/*.d.ts", "src/**/*.test.ts", "src/index.ts"],
      },
    },
  }),
);
