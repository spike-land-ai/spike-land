// Vite build entry point: imports the esbuild WASM binary URL from the
// @spike-land-ai/esbuild-wasm package and re-exports it as `wasmFile`.
// This lets the in-browser esbuild initializer locate the WASM asset.
import wasmUrl from "@spike-land-ai/esbuild-wasm/esbuild.wasm";
export { wasmUrl as wasmFile };
