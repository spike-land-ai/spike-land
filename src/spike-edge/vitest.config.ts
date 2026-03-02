import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "cloudflare:workers": new URL("./__mocks__/cloudflare-workers.ts", import.meta.url)
        .pathname,
    },
  },
  test: {
    name: "src-spike-edge",
    globals: true,
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules", "dist"],
  },
});
