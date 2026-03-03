import { defineConfig, mergeConfig } from "vitest/config";
import baseConfig from "../../vitest.base";

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      name: "vibe-dev",
      include: ["src/**/*.{test,spec}.{ts,tsx}"],
      coverage: {
        exclude: ["src/**/*.test.ts", "src/cli.ts"],
      },
    },
  }),
);
