import path from "node:path";
import { defineConfig, mergeConfig } from "vitest/config";
import baseConfig from "../../vitest.base";

const root = path.resolve(import.meta.dirname ?? __dirname, "../..");

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      name: "block-tasks",
      include: [path.join(root, ".tests/block-tasks/**/*.{test,spec}.ts")],
    },
  }),
);
