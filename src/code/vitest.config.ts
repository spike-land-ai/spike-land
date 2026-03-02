import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    name: "src-code",
    globals: true,
    environment: "jsdom",
    setupFiles: ["./setupTests.ts"],
    include: ["**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", "dist", ".next"],
    alias: {
      "@": path.resolve(__dirname, "./@"),
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./@"),
      "@spike-land-ai/spacetimedb-platform/stdb-http-client": path.resolve(
        __dirname,
        "../spacetimedb-platform/stdb-http-client.ts",
      ),
    },
  },
});
