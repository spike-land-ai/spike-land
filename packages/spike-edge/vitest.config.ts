import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "cloudflare:workers": new URL("src/__mocks__/cloudflare-workers.ts", import.meta.url)
        .pathname,
    },
  },
  test: {
    name: "spike-edge",
    reporter: "../../vitest-minimal-reporter.ts",
    logLevel: "error",
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/env.ts", "src/__mocks__/**"],
      thresholds: {
        lines: 96,
        functions: 96,
        branches: 96,
        statements: 96,
      },
    },
  },
});
