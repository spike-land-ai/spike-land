import { defineConfig, mergeConfig } from "vitest/config";
import baseConfig from "../../vitest.base";

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      name: "spike-land-mcp",
      include: ["**/*.test.ts"],
      coverage: {
        // Include only infra modules; tool definitions are data-only registrations
        // that require integration tests against the real MCP transport
        include: [
          "src/auth/**",
          "src/db/**",
          "src/kv/**",
          "src/mcp/**",
          "src/procedures/**",
          "src/routes/**",
          "src/tools/tool-helpers.ts",
          "src/tools/tool-factory.ts",
          "src/tools/types.ts",
          "src/__test-utils__/**",
          "src/app.ts",
          "src/env.ts",
        ],
      },
    },
  }),
);
