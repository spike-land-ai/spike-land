import { defineConfig, mergeConfig } from "vitest/config";
import baseConfig from "../../vitest.base";

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      name: "src-openclaw-mcp",
      include: ["../../.tests/openclaw-mcp/**/*.test.ts"],
      exclude: ["node_modules", "dist"],
      coverage: {
        include: ["src/openclaw-mcp/**/*.ts"],
        exclude: ["src/openclaw-mcp/dist/**", "src/openclaw-mcp/**/*.d.ts"],
      },
    },
  }),
);
