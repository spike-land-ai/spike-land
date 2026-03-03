import path from "node:path";
import { defineConfig } from "vitest/config";

const root = path.resolve(import.meta.dirname ?? __dirname);

/**
 * Shared Vitest base configuration for all @spike-land-ai packages.
 *
 * Usage in src/<pkg>/vitest.config.ts:
 *
 *   import { defineConfig, mergeConfig } from "vitest/config";
 *   import baseConfig from "../../vitest.base";
 *   export default mergeConfig(baseConfig, defineConfig({ test: { name: "my-pkg" } }));
 */
export default defineConfig({
  resolve: {
    alias: {
      "@spike-land-ai/shared/tool-builder": path.join(root, "src/shared/tool-builder/index.ts"),
      "@spike-land-ai/shared": path.join(root, "src/shared/index.ts"),
    },
  },
  test: {
    reporters: ["../../vitest-minimal-reporter.ts"],
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts", "**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts", "**/*.ts"],
      exclude: ["src/**/*.test.ts", "**/*.test.ts", "vitest.config.ts"],
      thresholds: {
        lines: 96,
        functions: 96,
        branches: 96,
        statements: 96,
      },
    },
  },
});
