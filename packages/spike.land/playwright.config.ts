import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./src/app/apps/mcp-explorer",
  testMatch: "**/*.spec.ts",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
