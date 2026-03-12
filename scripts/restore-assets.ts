import fs from "node:fs/promises";
import path from "node:path";
import { glob } from "glob";

async function main() {
  const mapping = JSON.parse(await fs.readFile("src/.mapping.json", "utf-8"));
  const oldToNew = new Map<string, string>();
  for (const [oldRel, newRel] of Object.entries(mapping)) {
    oldToNew.set(oldRel, "src/" + newRel);
  }

  const allOldFiles = await glob("src-old/**/*", { nodir: true });

  for (const oldFile of allOldFiles) {
    if (
      oldFile.endsWith(".ts") ||
      oldFile.endsWith(".tsx") ||
      oldFile.endsWith(".js") ||
      oldFile.endsWith(".jsx")
    ) {
      continue;
    }

    // Find where files in the same directory moved to
    const oldDir = path.dirname(oldFile);
    const siblings = await fs.readdir(oldDir);
    let targetDir: string | null = null;

    for (const sibling of siblings) {
      if (sibling.endsWith(".ts") || sibling.endsWith(".tsx")) {
        const siblingPath = path.join(oldDir, sibling).replace("src-old/", "src/");
        if (oldToNew.has(siblingPath)) {
          targetDir = path.dirname(oldToNew.get(siblingPath));
          break;
        }
      }
    }

    if (!targetDir) {
      // Fallback: search mapping for anything in this directory
      const oldDirPrefix = oldDir.replace("src-old/", "src/");
      for (const [oldRel, newRel] of oldToNew.entries()) {
        if (oldRel.startsWith(oldDirPrefix + "/")) {
          targetDir = path.dirname(newRel);
          break;
        }
      }
    }

    if (targetDir) {
      const fileName = path.basename(oldFile);
      const destPath = path.join(targetDir, fileName);
      await fs.mkdir(targetDir, { recursive: true });
      await fs.copyFile(oldFile, destPath);
      console.log(`Copied ${oldFile} -> ${destPath}`);
    } else {
      console.warn(`Could not find destination for ${oldFile}`);
    }
  }
}

main().catch(console.error);
