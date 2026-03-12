import path from "node:path";
import { defineConfig } from "vitest/config";

const root = path.resolve(import.meta.dirname, "../../..");

export default defineConfig({
  resolve: {
    alias: {
      react: path.join(root, "node_modules/react"),
      "react-dom": path.join(root, "node_modules/react-dom"),
    },
  },
  test: {
    environment: "jsdom",
    include: [path.join(import.meta.dirname, "*.test.tsx")],
    setupFiles: [path.join(import.meta.dirname, "setup.ts")],
  },
});
