import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["index.ts", "types/index.ts", "validations/index.ts", "constants/index.ts", "utils/index.ts", "tool-builder/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  outDir: "dist",
});
