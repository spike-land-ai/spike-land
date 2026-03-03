import { defineConfig, mergeConfig } from "vitest/config";
import baseConfig from "../../vitest.base";

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      name: "react-ts-worker",
      environment: "jsdom",
      include: ["tests/**/*.test.ts"],
      coverage: {
        include: ["src/**/*.ts", "src/**/*.tsx"],
      },
    },
    resolve: {
      alias: {
        "react-ts-worker/react": "./src/react/index.ts",
        "react-ts-worker/react-dom/client": "./src/react-dom/client.ts",
        "react-ts-worker/react-dom/server": "./src/react-dom/server.ts",
      },
    },
  }),
);
