import { Project, SyntaxKind } from "ts-morph";
import fs from "node:fs/promises";
import path from "node:path";

async function main() {
  const mapping = JSON.parse(await fs.readFile("src/.mapping.json", "utf-8"));
  const pathMapping = new Map<string, string>();
  for (const [oldRel, newRel] of Object.entries(mapping)) {
    pathMapping.set(path.resolve(process.cwd(), oldRel), path.resolve(process.cwd(), "src", newRel as string));
  }

  const project = new Project();
  const oldContent = await fs.readFile("src-old/spike-edge/index.ts", "utf-8");
  const oldAbsPath = path.resolve(process.cwd(), "src/spike-edge/index.ts");
  const newAbsPath = path.resolve(process.cwd(), "src/edge-api/main/api/index.ts");
  
  const sourceFile = project.createSourceFile(newAbsPath, oldContent, { overwrite: true });
  const newDir = path.dirname(newAbsPath);

  const rewrite = (p1: string) => {
    if (!p1.startsWith(".")) return p1;
    const oldDir = path.resolve(process.cwd(), "src/spike-edge");
    const resolvedAbs = path.resolve(oldDir, p1);
    
    let mapped = pathMapping.get(resolvedAbs);
    if (!mapped) {
      if (pathMapping.has(resolvedAbs + ".ts")) mapped = pathMapping.get(resolvedAbs + ".ts");
      else if (pathMapping.has(resolvedAbs + ".tsx")) mapped = pathMapping.get(resolvedAbs + ".tsx");
      else if (pathMapping.has(resolvedAbs.replace(/\.js$/, ".ts"))) mapped = pathMapping.get(resolvedAbs.replace(/\.js$/, ".ts"));
    }

    if (mapped) {
      let newRel = path.relative(newDir, mapped);
      if (!newRel.startsWith(".")) newRel = "./" + newRel;
      return newRel.replace(/\.tsx?$/, ".js");
    }
    return p1;
  };

  for (const imp of sourceFile.getImportDeclarations()) {
    const spec = imp.getModuleSpecifierValue();
    imp.setModuleSpecifier(rewrite(spec));
  }
  for (const exp of sourceFile.getExportDeclarations()) {
    if (exp.hasModuleSpecifier()) {
      const spec = exp.getModuleSpecifierValue();
      exp.setModuleSpecifier(rewrite(spec));
    }
  }

  await fs.writeFile(newAbsPath, sourceFile.getFullText(), "utf-8");
  console.log("Restored and fixed src/edge-api/main/api/index.ts");
}

main().catch(console.error);
