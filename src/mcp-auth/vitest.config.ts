import { defineConfig, mergeConfig } from "vitest/config";
import baseConfig from "../../vitest.base";

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      name: "mcp-auth",
      include: ["**/*.test.ts"],
    },
  }),
);
