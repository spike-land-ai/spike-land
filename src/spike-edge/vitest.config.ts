import { defineConfig, mergeConfig } from "vitest/config";
import baseConfig from "../../vitest.base";

export default mergeConfig(
  baseConfig,
  defineConfig({
    resolve: {
      alias: {
        "cloudflare:workers": new URL("./__mocks__/cloudflare-workers.ts", import.meta.url)
          .pathname,
      },
    },
    test: {
      name: "src-spike-edge",
      include: ["../../.tests/spike-edge/**/*.test.ts"],
      exclude: ["node_modules", "dist"],
      coverage: {
        include: ["src/spike-edge/**/*.ts"],
        exclude: [
          "src/spike-edge/__tests__/**",
          "src/spike-edge/__mocks__/**",
          "src/spike-edge/vitest.config.ts",
          "**/*.test.ts",
          "../../.tests/**",
        ],
      },
    },
  }),
);
