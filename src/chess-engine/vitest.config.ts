import { defineConfig, mergeConfig } from "vitest/config";
import baseConfig from "../../vitest.base";

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      name: "chess-engine",
      coverage: {
        exclude: ["src/**/*.test.ts", "src/index.ts", "src/generated/**", "src/lib/prisma.ts"],
      },
    },
  }),
);
