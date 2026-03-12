import fs from "fs";
import path from "path";

const toolsDir = "/Users/z/Developer/spike-land-ai/src/mcp-tools/image-studio/core-logic/tools/";
const files = [
  "delete.ts",
  "update.ts",
  "album-list.ts",
  "icon.ts",
  "album-images.ts",
  "pipeline-list.ts",
  "job-status.ts",
  "list.ts",
  "diagram.ts",
  "pipeline-save.ts",
  "generate.ts",
  "subject-list.ts",
  "upload.ts",
  "enhance.ts",
  "subject-save.ts",
  "edit.ts",
  "avatar.ts",
  "album.ts",
  "export.ts",
  "bulk-delete.ts",
  "duplicate.ts",
  "album-create.ts",
  "subject-delete.ts",
  "album-reorder.ts",
  "album-delete.ts",
  "share.ts",
  "pipeline-delete.ts",
  "pipeline.ts",
  "album-update.ts",
  "versions.ts",
  "auto-tag.ts",
  "screenshot.ts",
  "credits.ts",
  "compare.ts",
  "analyze.ts",
  "history.ts",
  "banner.ts",
];

const inlinedCode = `
// --- Inlined Result and tryCatch ---
type Result<T> =
  | {
      ok: true;
      data: T;
      error?: never;
      unwrap(): T;
      map<U>(fn: (val: T) => U): Result<U>;
      flatMap<U>(fn: (val: T) => Result<U>): Result<U>;
    }
  | {
      ok: false;
      data?: never;
      error: Error;
      unwrap(): never;
      map<U>(fn: (val: T) => U): Result<U>;
      flatMap<U>(fn: (val: T) => Result<U>): Result<U>;
    };

function ok<T>(data: T): Result<T> {
  return {
    ok: true,
    data,
    unwrap: () => data,
    map: <U>(fn: (val: T) => U) => ok(fn(data)),
    flatMap: <U>(fn: (val: T) => Result<U>) => fn(data),
  };
}

function fail<T = never>(error: Error): Result<T> {
  return {
    ok: false,
    error,
    unwrap: () => {
      throw error;
    },
    map: () => fail(error),
    flatMap: () => fail(error),
  };
}

async function tryCatch<T>(promise: Promise<T>): Promise<Result<T>> {
  try {
    const data = await promise;
    return ok(data);
  } catch (err) {
    return fail(err instanceof Error ? err : new Error(String(err)));
  }
}
`;

const domainErrorCode = `
class DomainError extends Error {
  public code: ErrorCode;
  public retryable: boolean;
  constructor(code: ErrorCode, message: string, retryable = false) {
    super(message);
    this.name = "DomainError";
    this.code = code;
    this.retryable = retryable;
  }
}
`;

for (const file of files) {
  const filePath = path.join(toolsDir, file);
  let content = fs.readFileSync(filePath, "utf8");

  // Check if it imports from try-catch.js
  const tryCatchImportRegex =
    /import\s+\{\s*([^}]*)\s*\}\s+from\s+["']\.\.\/\.\.\/mcp\/try-catch\.js["'];?\s*/;
  const match = content.match(tryCatchImportRegex);

  if (match) {
    const importedSymbols = match[1].split(",").map((s) => s.trim());
    const hasDomainError = importedSymbols.includes("DomainError");

    // Remove the import
    content = content.replace(tryCatchImportRegex, "");

    // If DomainError was used, add ErrorCode to the types import and inline DomainError
    if (hasDomainError) {
      // Find the types import
      const typesImportRegex =
        /import\s+\{\s*([^}]*)\s*\}\s+from\s+["']\.\.\/\.\.\/mcp\/types\.js["'];?\s*/;
      const typesMatch = content.match(typesImportRegex);
      if (typesMatch) {
        const typesSymbols = typesMatch[1].split(",").map((s) => s.trim());
        if (!typesSymbols.includes("ErrorCode")) {
          typesSymbols.push("ErrorCode");
          content = content.replace(
            typesImportRegex,
            `import {\n  ${typesSymbols.join(",\n  ")}\n} from "../../mcp/types.js";\n`,
          );
        }
      } else {
        // If types import doesn't exist (unlikely), add it
        content = `import { ErrorCode } from "../../mcp/types.js";\n` + content;
      }
      content += domainErrorCode;
    }

    // Always inline Result/tryCatch
    content += inlinedCode;

    fs.writeFileSync(filePath, content, "utf8");
    console.log(`Updated ${file}`);
  } else {
    console.log(`Skipped ${file} (no try-catch import)`);
  }
}
