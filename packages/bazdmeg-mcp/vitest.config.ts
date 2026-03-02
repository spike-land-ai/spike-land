import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "bazdmeg-mcp",
    reporter: "../../vitest-minimal-reporter.ts",
    logLevel: "error",
    globals: true,
    pool: "forks",
    fileParallelism: true,
    silent: true,
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/__test-utils__/**", "src/index.ts"],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90,
      },
    },
  },
});
