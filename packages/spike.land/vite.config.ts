import { cloudflare } from "@cloudflare/vite-plugin";
import path from "path";
import { defineConfig } from "vite";
import vinext from "vinext";

export default defineConfig({
  plugins: [
    // vinext auto-registers @vitejs/plugin-rsc when src/app/ is detected
    vinext(),
    cloudflare({
      viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
    }),
  ],
  resolve: {
    alias: [
      // Map @store-apps/* sub-path imports to packages/store-apps/*
      {
        find: /^@store-apps\/(.+)$/,
        replacement: path.resolve(import.meta.dirname, "./packages/store-apps/$1"),
      },
      { find: "@/components", replacement: path.resolve(import.meta.dirname, "./src/components") },
      { find: "@/ui", replacement: path.resolve(import.meta.dirname, "./src/components/ui") },
      { find: "@/lib", replacement: path.resolve(import.meta.dirname, "./src/lib") },
      { find: "@/utils", replacement: path.resolve(import.meta.dirname, "./src/lib/utils") },
      { find: "@/hooks", replacement: path.resolve(import.meta.dirname, "./src/hooks") },
      { find: "@/auth", replacement: path.resolve(import.meta.dirname, "./src/auth.ts") },
      { find: "@", replacement: path.resolve(import.meta.dirname, "./src") },
      { find: "@apps", replacement: path.resolve(import.meta.dirname, "./apps") },
      // Map @prisma/client to the generated Prisma client location
      {
        find: "@prisma/client",
        replacement: path.resolve(import.meta.dirname, "./src/generated/prisma"),
      },
      // Fix: spike-cli exports field references index.mjs but only index.js exists in dist
      {
        find: "@spike-land-ai/spike-cli",
        replacement: path.resolve(import.meta.dirname, "../../dist/spike-cli/index.js"),
      },
    ],
  },
  ssr: {
    // Exclude heavy native/platform-specific packages from SSR bundle
    external: [
      "@spike-land-ai/esbuild-wasm",
      "@spike-land-ai/react-ts-worker",
      "esbuild",
      "@swc/core",
      "@swc/wasm",
      "@spike-land-ai/spike-cli",
      "typescript",
      "webpack",
    ],
  },
});
