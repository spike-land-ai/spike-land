import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  "packages/spike.land",
  "packages/code",
  "packages/spike-app",
  "src/code",
  "src/spike-app"
]);
