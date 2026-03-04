import path from "node:path";
import { defineConfig, mergeConfig } from "vitest/config";
import baseConfig from "../../vitest.base";

export default mergeConfig(
  baseConfig,
  defineConfig({
    resolve: {
      alias: {
        "@/": path.resolve(import.meta.dirname, "./") + "/",
      },
    },
    test: {
      include: ["../../.tests/chess-engine/**/*.test.ts"],
      name: "chess-engine",
      coverage: {
        exclude: ["src/**/*.test.ts", "src/index.ts", "src/generated/**", "src/lib/prisma.ts",
          "**/index.ts", "**/generated/**", "**/lib/prisma.ts"],
      },
    },
  }),
);
