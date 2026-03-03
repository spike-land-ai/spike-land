import { defineConfig, mergeConfig } from "vitest/config";
import path from "node:path";
import baseConfig from "../../vitest.base";

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      name: "src-spike-app",
      environment: "jsdom",
      setupFiles: ["./test-setup.ts"],
      include: ["**/*.test.{ts,tsx}"],
      exclude: ["node_modules", "dist", ".next"],
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
  }),
);
