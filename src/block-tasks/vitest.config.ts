import path from "node:path";
import { defineConfig, mergeConfig } from "vitest/config";
import baseConfig from "../../vitest.base";

const root = path.resolve(import.meta.dirname ?? __dirname, "../..");
const pkgDir = path.resolve(import.meta.dirname ?? __dirname);

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      name: "block-tasks",
      include: [path.join(root, ".tests/block-tasks/**/*.{test,spec}.ts")],
      coverage: {
        include: [`${pkgDir}/**/*.ts`],
        exclude: [
          `${pkgDir}/browser.ts`,
          `${pkgDir}/worker.ts`,
          `${pkgDir}/vitest.config.ts`,
          `${pkgDir}/**/*.d.ts`,
          `${pkgDir}/node_modules/**`,
        ],
        reportsDirectory: path.join(root, "coverage/block-tasks"),
      },
    },
  }),
);
