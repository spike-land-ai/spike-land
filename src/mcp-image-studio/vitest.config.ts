import { defineConfig, mergeConfig } from "vitest/config";
import baseConfig from "../../vitest.base";

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      name: "mcp-image-studio",
      include: [
        "../../.tests/mcp-image-studio/**/*.test.ts",
      ],
      exclude: ["node_modules", "dist"],
      coverage: {
        include: ["src/mcp-image-studio/**/*.ts"],
        exclude: [
          "src/mcp-image-studio/dist/**",
          "src/mcp-image-studio/vitest.config.ts",
          "src/mcp-image-studio/cli-server.ts",
        ],
      },
    },
  }),
);
