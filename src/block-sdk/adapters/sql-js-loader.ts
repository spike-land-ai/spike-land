import type { SqlJsStatic } from "sql.js";

let sqlJsPromise: Promise<SqlJsStatic> | null = null;

export function getSqlJs(): Promise<SqlJsStatic> {
  if (!sqlJsPromise) {
    sqlJsPromise = import("sql.js").then((mod) =>
      mod.default({
        locateFile: (file: string) => `https://sql.js.org/dist/${file}`,
      })
    );
  }
  return sqlJsPromise;
}
