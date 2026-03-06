import fs from "node:fs/promises";
import path from "node:path";
import { Project, SyntaxKind, StringLiteral, NoSubstitutionTemplateLiteral } from "ts-morph";
import type { MovePlan } from "./types.js";

export function rewriteSingleImport(p1: string, oldPath: string, newDir: string, pathMapping: Map<string, string>): string {
  if (p1.startsWith("http") || (!p1.startsWith(".") && !p1.startsWith("/") && !p1.startsWith("@/")) || p1.includes("${")) {
    return p1;
  }
  
  if (p1.startsWith("@/")) {
    return p1;
  }

  const oldDir = path.dirname(oldPath);
  let resolvedAbs = path.resolve(oldDir, p1);
  
  let mapped = pathMapping.get(resolvedAbs);
  if (!mapped) {
    if (pathMapping.has(resolvedAbs + ".ts")) mapped = pathMapping.get(resolvedAbs + ".ts");
    else if (pathMapping.has(resolvedAbs + ".tsx")) mapped = pathMapping.get(resolvedAbs + ".tsx");
    else if (pathMapping.has(resolvedAbs.replace(/\.js$/, ".ts"))) mapped = pathMapping.get(resolvedAbs.replace(/\.js$/, ".ts"));
    else if (pathMapping.has(resolvedAbs.replace(/\.js$/, ".tsx"))) mapped = pathMapping.get(resolvedAbs.replace(/\.js$/, ".tsx"));
    else if (pathMapping.has(resolvedAbs + "/index.ts")) mapped = pathMapping.get(resolvedAbs + "/index.ts");
    else if (pathMapping.has(resolvedAbs + "/index.tsx")) mapped = pathMapping.get(resolvedAbs + "/index.tsx");
  }

  if (mapped) {
    let newRel = path.relative(newDir, mapped);
    if (!newRel.startsWith(".")) newRel = "./" + newRel;
    
    if (p1.endsWith(".js")) {
      newRel = newRel.replace(/\.tsx?$/, ".js");
    } else {
       if ((mapped.endsWith("index.ts") || mapped.endsWith("index.tsx")) && !p1.endsWith("index.ts") && !p1.endsWith("index.tsx") && !p1.endsWith("index.js")) {
          newRel = newRel.replace(/\/index\.tsx?$/, "");
          if (newRel === "") newRel = ".";
       } else {
          newRel = newRel.replace(/\.tsx?$/, "");
       }
    }
    return newRel;
  }
  
  return p1;
}

export function rewriteImports(project: Project, oldPath: string, newPath: string, pathMapping: Map<string, string>): string {
  const sourceFile = project.getSourceFileOrThrow(oldPath);
  const newDir = path.dirname(newPath);
  
  const processSpecifier = (spec: string) => {
    return rewriteSingleImport(spec, oldPath, newDir, pathMapping);
  };
  
  for (const imp of sourceFile.getImportDeclarations()) {
     const spec = imp.getModuleSpecifierValue();
     if (spec) {
       const newSpec = processSpecifier(spec);
       if (newSpec !== spec) imp.setModuleSpecifier(newSpec);
     }
  }
  for (const exp of sourceFile.getExportDeclarations()) {
     if (exp.hasModuleSpecifier()) {
       const spec = exp.getModuleSpecifierValue();
       if (spec) {
         const newSpec = processSpecifier(spec);
         if (newSpec !== spec) exp.setModuleSpecifier(newSpec);
       }
     }
  }
  for (const call of sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression)) {
    if (call.getExpression().getText() === "import") {
      const arg = call.getArguments()[0];
      if (arg && (arg.getKind() === SyntaxKind.StringLiteral || arg.getKind() === SyntaxKind.NoSubstitutionTemplateLiteral)) {
         const spec = (arg as StringLiteral | NoSubstitutionTemplateLiteral).getLiteralText();
         const newSpec = processSpecifier(spec);
         if (newSpec !== spec) {
           call.removeArgument(0);
           call.insertArgument(0, `"${newSpec}"`);
         }
      }
    }
  }
  
  return sourceFile.getFullText();
}

export async function updateTsConfigPaths(pathMapping: Map<string, string>) {
  const tsConfigPath = path.resolve(process.cwd(), "tsconfig.json");
  const content = await fs.readFile(tsConfigPath, "utf-8");
  const tsconfig = JSON.parse(content);
  
  if (!tsconfig.compilerOptions || !tsconfig.compilerOptions.paths) return;
  
  let changed = false;
  for (const [alias, locations] of Object.entries<string[]>(tsconfig.compilerOptions.paths)) {
    const newLocs = locations.map(loc => {
      if (loc.endsWith("/*")) {
         const baseLoc = loc.slice(0, -2); // remove /*
         const absBase = path.resolve(process.cwd(), baseLoc);
         
         for (const [oldAbs, newAbs] of pathMapping.entries()) {
             if (oldAbs.startsWith(absBase + path.sep) || oldAbs.startsWith(absBase + "/")) {
                 const oldRel = oldAbs.slice(absBase.length + 1);
                 const newBase = newAbs.slice(0, newAbs.length - oldRel.length - 1);
                 const relativeToRoot = path.relative(process.cwd(), newBase);
                 return "./" + relativeToRoot.replace("src-reorganized", "src") + "/*";
             }
         }
         return loc;
      } else {
         const absLoc = path.resolve(process.cwd(), loc);
         let mapped = pathMapping.get(absLoc);
         if (!mapped) mapped = pathMapping.get(absLoc + ".ts");
         if (!mapped) mapped = pathMapping.get(absLoc + ".tsx");
         if (!mapped) mapped = pathMapping.get(absLoc.replace(/\.js$/, ".ts"));
         if (!mapped) mapped = pathMapping.get(absLoc + "/index.ts");
         
         if (mapped) {
             const relativeToRoot = path.relative(process.cwd(), mapped);
             return "./" + relativeToRoot.replace("src-reorganized", "src");
         }
      }
      return loc;
    });
    
    if (JSON.stringify(newLocs) !== JSON.stringify(locations)) {
      tsconfig.compilerOptions.paths[alias] = newLocs;
      changed = true;
    }
  }
  
  if (changed) {
    await fs.writeFile(tsConfigPath, JSON.stringify(tsconfig, null, 2) + "\n");
    console.log("Updated tsconfig.json paths");
  }
}

export async function updatePackagesConfigs(pathMapping: Map<string, string>) {
  const rootDir = process.cwd();
  const packagesDir = path.join(rootDir, "packages");
  const entries = await fs.readdir(packagesDir, { withFileTypes: true }).catch(() => []);
  
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const pkgPath = path.join(packagesDir, entry.name);
    
    // package.json
    const pkgJsonPath = path.join(pkgPath, "package.json");
    try {
      const content = await fs.readFile(pkgJsonPath, "utf-8");
      const pkg = JSON.parse(content);
      let changed = false;
      
      const updatePath = (p: string) => {
         if (!p.includes("src/")) return p;
         const absLoc = path.resolve(pkgPath, p);
         for (const [oldAbs, newAbs] of pathMapping.entries()) {
             if (absLoc === oldAbs || absLoc === oldAbs.replace(/\.ts$/, ".js") || absLoc.replace(/\.js$/, ".ts") === oldAbs || absLoc === oldAbs.replace(/\.ts$/, ".d.ts")) {
                 const rel = path.relative(pkgPath, newAbs).replace("src-reorganized", "src");
                 let newP = rel.startsWith(".") ? rel : "./" + rel;
                 if (p.endsWith(".js") && newP.endsWith(".ts")) newP = newP.replace(/\.ts$/, ".js");
                 if (p.endsWith(".d.ts") && newP.endsWith(".ts")) newP = newP.replace(/\.ts$/, ".d.ts");
                 return newP;
             }
         }
         return p;
      };
      
      if (pkg.main) { const n = updatePath(pkg.main); if (n !== pkg.main) { pkg.main = n; changed = true; } }
      if (pkg.types) { const n = updatePath(pkg.types); if (n !== pkg.types) { pkg.types = n; changed = true; } }
      if (pkg.exports) {
         const traverse = (obj: any) => {
            for (const key in obj) {
               if (typeof obj[key] === "string") {
                  const n = updatePath(obj[key]);
                  if (n !== obj[key]) { obj[key] = n; changed = true; }
               } else if (typeof obj[key] === "object") {
                  traverse(obj[key]);
               }
            }
         };
         traverse(pkg.exports);
      }
      
      if (changed) {
         await fs.writeFile(pkgJsonPath, JSON.stringify(pkg, null, 2) + "\n");
         console.log(`Updated ${path.relative(rootDir, pkgJsonPath)}`);
      }
    } catch (e) {}
    
    // wrangler.toml
    const wranglerPath = path.join(pkgPath, "wrangler.toml");
    try {
      let content = await fs.readFile(wranglerPath, "utf-8");
      let changed = false;
      
      content = content.replace(/(?:main|entry)\s*=\s*["']([^"']+)["']/g, (match, p1) => {
          if (p1.includes("src/")) {
             const absLoc = path.resolve(pkgPath, p1);
             for (const [oldAbs, newAbs] of pathMapping.entries()) {
                 if (absLoc === oldAbs || absLoc === oldAbs.replace(/\.ts$/, ".js") || absLoc.replace(/\.js$/, ".ts") === oldAbs) {
                     const rel = path.relative(pkgPath, newAbs).replace("src-reorganized", "src");
                     changed = true;
                     return match.replace(p1, rel.startsWith(".") ? rel : "./" + rel);
                 }
             }
          }
          return match;
      });
      if (changed) {
         await fs.writeFile(wranglerPath, content);
         console.log(`Updated ${path.relative(rootDir, wranglerPath)}`);
      }
    } catch (e) {}
  }
}

export async function updatePackageJsonWorkspaces(outputDir: string) {
  try {
    const pkgJsonPath = path.resolve(process.cwd(), "package.json");
    const pkgJson = JSON.parse(await fs.readFile(pkgJsonPath, "utf-8"));
    if (pkgJson.workspaces) {
      const outRel = path.basename(outputDir);
      const newGlob = `${outRel}/*/*/*`;
      if (!pkgJson.workspaces.includes(newGlob)) {
        pkgJson.workspaces.push(newGlob);
        await fs.writeFile(pkgJsonPath, JSON.stringify(pkgJson, null, 2) + "\n");
        console.log(`Updated package.json workspaces with ${newGlob}`);
      }
    }
  } catch (e) {
    console.error("Failed to update package.json workspaces", e);
  }
}

export async function generateManifests(plans: MovePlan[], outputDir: string) {
  const appMap = new Map<string, { files: string[], deps: Set<string> }>();
  
  for (const p of plans) {
    const parts = p.targetDir.split(path.sep);
    const appFolder = parts.slice(0, 2).join(path.sep);
    
    if (!appMap.has(appFolder)) {
      appMap.set(appFolder, { files: [], deps: new Set() });
    }
    const appData = appMap.get(appFolder)!;
    appData.files.push(path.relative(appFolder, p.targetRelPath));
    for (const d of p.fileNode.externalDeps) {
      appData.deps.add(d);
    }
  }
  
  for (const [appFolder, data] of appMap.entries()) {
    const manifestPath = path.resolve(outputDir, appFolder, "manifest.json");
    const manifest = {
       name: path.basename(appFolder),
       category: path.dirname(appFolder),
       dependencies: Array.from(data.deps).sort(),
       files: data.files.sort()
    };
    await fs.mkdir(path.dirname(manifestPath), { recursive: true });
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf-8");
  }
}
