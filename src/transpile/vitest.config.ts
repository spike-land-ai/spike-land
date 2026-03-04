import { defineConfig, mergeConfig } from "vitest/config";
import baseConfig from "../../vitest.base";

export default mergeConfig(
  baseConfig,
  defineConfig({
    plugins: [
      {
        name: "wasm-stub",
        enforce: "pre",
        load(id) {
          if (id.endsWith(".wasm")) {
            return 'export default "mock-wasm-url";';
          }
          return undefined;
        },
      },
    ],
    test: {
      name: "transpile",
      include: ["../../.tests/transpile/**/*.{test,spec}.ts"],
      coverage: {
        exclude: ["../../.tests/**", "vitest.config.ts", "**/*.d.ts", "wasm.d.ts"],
      },
    },
  }),
);
