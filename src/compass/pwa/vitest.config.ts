import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: false,
    setupFiles: [],
    include: ["__tests__/**/*.test.{ts,tsx}", "**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["ui/**/*.{ts,tsx}", "types.ts"],
      exclude: ["**/__tests__/**", "**/index.ts"],
    },
  },
});
