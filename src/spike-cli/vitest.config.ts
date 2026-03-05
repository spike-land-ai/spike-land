import { defineConfig, mergeConfig } from "vitest/config";
import baseConfig from "../../vitest.base";

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      name: "src-spike-cli",
      include: [
        "../../.tests/spike-cli/**/*.test.ts",
        "../../.tests/spike-cli/__tests__/**/*.test.ts",
      ],
      exclude: ["node_modules", "dist"],
      coverage: {
        include: ["src/spike-cli/**/*.ts"],
        exclude: [
          "src/spike-cli/dist/**",
          "src/spike-cli/vitest.config.ts",
          // index.ts is a pure re-export barrel — V8 cannot instrument module re-export statements
          "src/spike-cli/index.ts",
          // cli.ts lines 94-99 are the process entrypoint guarded by NODE_ENV !== "test"
          "src/spike-cli/cli.ts",
        ],
      },
    },
  }),
);
