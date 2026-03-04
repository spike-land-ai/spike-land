import path from "path";
import { defineConfig, mergeConfig } from "vitest/config";
import baseConfig from "../../vitest.base";

// Using standard Vitest configuration (not cloudflare pool) for simpler test setup
export default mergeConfig(
  baseConfig,
  defineConfig({
    plugins: [
      {
        name: "html-string-loader",
        enforce: "pre",
        transform(code, id): { code: string; map: null } | undefined {
          const filename = id.split("?")[0];
          if (filename !== undefined && filename.endsWith(".html")) {
            return {
              code: `export default ${JSON.stringify(code)};`,
              map: null,
            };
          }
          return undefined;
        },
      },
    ],
    test: {
      name: "spike-land-backend",
      reporters: process.env.COVERAGE
        ? ["../../vitest-minimal-reporter.ts"]
        : ["hanging-process", "../../vitest-minimal-reporter.ts"],
      include: ["../../.tests/spike-land-backend/**/*.{test,spec}.ts"],
      setupFiles: ["../../.tests/spike-land-backend/vitest.setup.ts"],
      coverage: {
        provider: "istanbul",
        reporter: ["text-summary"],
        include: ["src/**/*.ts"],
        exclude: [
          "src/**/*.spec.ts",
          "src/**/*.test.ts",
          "src/**/*.test-utils.ts",
          "src/env.d.ts",
          "src/html.d.ts",
          "src/wasm.d.ts",
          "src/esbuild-loader.d.ts",
          "src/**/__tests__/**",
          "src/types/**",
          "types/**",
          "src/frontend/**",
          "src/staticContent.mjs",
        ],
      },
    },
    resolve: {
      alias: {
        replicate: path.resolve(import.meta.dirname, "__mocks__/replicate.js"),
        "snakecase-keys": path.resolve(import.meta.dirname, "__mocks__/snakecase-keys.js"),
        cookie: path.resolve(import.meta.dirname, "__mocks__/cookie.js"),
        "@spike-land-ai/code": path.resolve(import.meta.dirname, "__mocks__/@spike-land-ai/code.js"),
        "@spike-land-ai/esbuild-wasm": path.resolve(
          import.meta.dirname,
          "node_modules/@spike-land-ai/esbuild-wasm",
        ),
      },
    },
  }),
);
