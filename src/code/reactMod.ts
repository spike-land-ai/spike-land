import React from "react";
export default React;
// @ts-expect-error React ships as a CJS module using `export =` (module.exports).
// TypeScript does not allow `export *` to re-export a CJS `export =` module
// in an ESM file even with esModuleInterop. This is a known TS limitation
// (microsoft/TypeScript#38562). The error is unavoidable without forking react's
// type declarations or duplicating every named export by hand.
export * from "react";
