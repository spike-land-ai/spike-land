import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    reporter: "../../vitest-minimal-reporter.ts",
    logLevel: "error",
  },
});
