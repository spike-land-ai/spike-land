import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import { resolve } from "path";

const pkgDir = import.meta.dirname;
const srcDir = resolve(pkgDir, "../../src/spike-app");
const repoRoot = resolve(pkgDir, "../..");

export default defineConfig({
  plugins: [react()],
  root: repoRoot,
  resolve: {
    alias: {
      "@": srcDir,
      "@spike-land-ai/block-website/ui": resolve(pkgDir, "../../src/block-website/src/ui/index.ts"),
      "@spike-land-ai/block-website/core": resolve(pkgDir, "../../src/block-website/src/core/index.ts"),
      "@spike-land-ai/block-website/mcp": resolve(pkgDir, "../../src/block-website/src/mcp/index.ts"),
      "@spike-land-ai/block-website": resolve(pkgDir, "../../src/block-website/src/index.ts"),
      "@spike-land-ai/shared": resolve(pkgDir, "../../src/shared/index.ts"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: [resolve(pkgDir, "vitest.setup.ts")],
    include: [
      "src/spike-app/**/*.{test,spec}.{ts,tsx}",
      "packages/spike-app/__tests__/**/*.{test,spec}.{ts,tsx}",
    ],
    coverage: {
      provider: "v8",
      include: ["src/spike-app/**/*.{ts,tsx}"],
      exclude: [
        "src/spike-app/routeTree.gen.ts",
        "src/spike-app/main.tsx",
        "src/spike-app/vite-env.d.ts",
        "src/spike-app/index.ts",
        "src/spike-app/router.ts",
        "src/spike-app/src/**",
        "**/*.d.ts",
        "**/node_modules/**",
        "**/dist/**",
      ],
      reporter: ["text", "lcov", "html"],
      reportsDirectory: resolve(pkgDir, "coverage"),
      all: true,
    },
  },
});
