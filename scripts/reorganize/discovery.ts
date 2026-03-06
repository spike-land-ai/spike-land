import path from "node:path";
import { Project, SyntaxKind, StringLiteral, NoSubstitutionTemplateLiteral } from "ts-morph";
import type { FileNode } from "./types.js";
import { extractRootPackage } from "./utils.js";
import { excludedDeps } from "../reorganize-config.js";

export async function discoverFiles(project: Project): Promise<FileNode[]> {
  const root = path.resolve(process.cwd(), "src");
  const nodes: FileNode[] = [];
  
  for (const sourceFile of project.getSourceFiles()) {
    const absPath = sourceFile.getFilePath();
    if (!absPath.includes("/src/")) continue;
    
    const relPath = path.relative(root, absPath);
    const packageName = relPath.split(path.sep)[0];
    
    const externalDeps = new Set<string>();
    const relativeImports = new Set<string>();
    
    const imports = sourceFile.getImportDeclarations();
    const exports = sourceFile.getExportDeclarations();
    const dynamicImports = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression)
      .filter(c => c.getExpression().getText() === "import");

    const specs = [
        ...imports.map(i => i.getModuleSpecifierValue()).filter(Boolean),
        ...exports.map(e => e.getModuleSpecifierValue()).filter(Boolean),
        ...dynamicImports.map(d => {
            const arg = d.getArguments()[0];
            if (arg && (arg.getKind() === SyntaxKind.StringLiteral || arg.getKind() === SyntaxKind.NoSubstitutionTemplateLiteral)) {
                return (arg as StringLiteral | NoSubstitutionTemplateLiteral).getLiteralText();
            }
            return null;
        }).filter(Boolean)
    ] as string[];
    
    for (const importPath of specs) {
      if (importPath.startsWith("http") || importPath.endsWith(".css") || importPath.endsWith(".json") || importPath.includes("${")) continue;
      
      if (importPath.startsWith(".") || importPath.startsWith("/")) {
        const dir = path.dirname(absPath);
        const resolved = path.resolve(dir, importPath);
        relativeImports.add(resolved);
      } else if (importPath.startsWith("@/")) {
        // Alias, treat as internal
      } else {
        const rootPkg = extractRootPackage(importPath);
        if (rootPkg && !excludedDeps.has(rootPkg)) {
          externalDeps.add(rootPkg);
        }
      }
    }
    
    nodes.push({ absPath, relPath, packageName, externalDeps, relativeImports });
  }
  return nodes;
}
