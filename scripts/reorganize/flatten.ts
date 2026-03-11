import path from "node:path";

export function flattenFilename(relPath: string, _packageName: string): string {
  const parts = relPath.split(path.sep);
  const fileName = parts.pop()!;

  if (fileName === "index.ts" || fileName === "index.tsx") {
    if (parts.length > 1) {
      const parent = parts[parts.length - 1];
      return `${parent}-${fileName}`;
    }
  }
  return fileName;
}
