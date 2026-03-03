import { defineConfig } from "vite";
import { resolve } from "path";
import { readFileSync } from "fs";

/** Import .html files as raw text strings instead of Vite HTML entries */
function htmlRawPlugin(): import("vite").Plugin {
  return {
    name: "html-raw-import",
    enforce: "pre",
    resolveId(source, importer) {
      if (source.endsWith(".html") && importer && !source.includes("?")) {
        return { id: resolve(importer, "..", source) + "?raw-html", external: false };
      }
      return null;
    },
    load(id) {
      if (id.endsWith("?raw-html")) {
        const filePath = id.replace("?raw-html", "");
        const content = readFileSync(filePath, "utf-8");
        return `export default ${JSON.stringify(content)};`;
      }
      return null;
    },
  };
}

export default defineConfig({
  plugins: [htmlRawPlugin()],
  resolve: {
    alias: {
      "@/": resolve(__dirname, "@") + "/",
      "@": resolve(__dirname, "@"),
    },
  },
  build: {
    outDir: "dist-vite",
    lib: {
      entry: {
        modules: resolve(__dirname, "modules.ts"),
        "cf-esbuild": resolve(__dirname, "cf-esbuild.mjs"),
      },
      formats: ["es"],
      fileName: (_format, entryName) => `${entryName}.mjs`,
    },
    rollupOptions: {
      external: [
        /^@spike-land-ai\//,
        /^node:/,
        "esbuild-wasm/esbuild.wasm",
      ],
    },
    target: "es2022",
    minify: false,
  },
});
