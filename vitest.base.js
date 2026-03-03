import { defineConfig } from "vitest/config";
/**
 * Shared Vitest base configuration for all @spike-land-ai packages.
 *
 * Usage in src/<pkg>/vitest.config.ts:
 *
 *   import { defineConfig, mergeConfig } from "vitest/config";
 *   import baseConfig from "../../vitest.base";
 *   export default mergeConfig(baseConfig, defineConfig({ test: { name: "my-pkg" } }));
 */
export default defineConfig({
    test: {
        reporter: "../../vitest-minimal-reporter.ts",
        logLevel: "error",
        globals: true,
        environment: "node",
        include: ["src/**/*.test.ts"],
        coverage: {
            provider: "v8",
            include: ["src/**/*.ts"],
            exclude: ["src/**/*.test.ts"],
            thresholds: {
                lines: 96,
                functions: 96,
                branches: 96,
                statements: 96,
            },
        },
    },
});
//# sourceMappingURL=vitest.base.js.map