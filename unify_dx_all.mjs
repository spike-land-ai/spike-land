import fs from "fs";
import path from "path";
import { globSync } from "glob";

const pkgFiles = globSync("**/package.json", {
  ignore: ["node_modules/**", "dist/**", "coverage/**", ".git/**", ".wrangler/**"],
});
let updatedCount = 0;

for (const file of pkgFiles) {
  if (file.includes("node_modules")) continue; // Just in case

  const content = fs.readFileSync(file, "utf8");
  let pkg;
  try {
    pkg = JSON.parse(content);
  } catch (e) {
    console.error(`Error parsing ${file}`);
    continue;
  }
  let changed = false;

  if (!pkg.scripts) pkg.scripts = {};

  // Unify test
  if (pkg.scripts.test && pkg.scripts.test !== "vitest run") {
    // Keep specific configs if needed, but standardize simple ones
    if (!pkg.scripts.test.includes("--config") && !pkg.scripts.test.includes("playwright")) {
      pkg.scripts.test = "vitest run";
      changed = true;
    }
  } else if (!pkg.scripts.test) {
    pkg.scripts.test = "vitest run";
    changed = true;
  }

  // Unify lint
  if (pkg.scripts.lint && pkg.scripts.lint !== "eslint --quiet .") {
    pkg.scripts.lint = "eslint --quiet .";
    changed = true;
  } else if (!pkg.scripts.lint) {
    pkg.scripts.lint = "eslint --quiet .";
    changed = true;
  }

  // Add typecheck if not exists but has tsconfig.json
  const dir = path.dirname(file);
  if (fs.existsSync(path.join(dir, "tsconfig.json"))) {
    if (!pkg.scripts.typecheck) {
      pkg.scripts.typecheck = "tsc --noEmit";
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(file, JSON.stringify(pkg, null, 2) + "\n");
    updatedCount++;
    console.log(`Updated ${file}`);
  }
}
console.log(`Updated ${updatedCount} package.json files.`);
