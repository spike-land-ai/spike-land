import { defineConfig, mergeConfig } from "vitest/config";
import baseConfig from "../../vitest.base";

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      name: "src-vibe-dev",
      include: ["../../.tests/vibe-dev/**/*.test.ts"],
      exclude: ["node_modules", "dist"],
      coverage: {
        include: ["src/vibe-dev/**/*.ts"],
        exclude: ["src/vibe-dev/dist/**", "src/vibe-dev/**/*.d.ts"],
      },
    },
  }),
);
