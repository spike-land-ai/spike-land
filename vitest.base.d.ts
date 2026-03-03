/**
 * Shared Vitest base configuration for all @spike-land-ai packages.
 *
 * Usage in src/<pkg>/vitest.config.ts:
 *
 *   import { defineConfig, mergeConfig } from "vitest/config";
 *   import baseConfig from "../../vitest.base";
 *   export default mergeConfig(baseConfig, defineConfig({ test: { name: "my-pkg" } }));
 */
declare const _default: import("vite").UserConfig &
  Promise<import("vite").UserConfig> &
  (import("vitest/config").ViteUserConfigFnObject &
    (import("vitest/config").ViteUserConfigFnPromise &
      import("vitest/config").ViteUserConfigExport));
export default _default;
//# sourceMappingURL=vitest.base.d.ts.map
