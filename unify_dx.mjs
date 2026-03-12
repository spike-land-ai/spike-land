import fs from 'fs';
import { globSync } from 'glob';

const pkgFiles = globSync('packages/*/package.json');
let updatedCount = 0;

for (const file of pkgFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const pkg = JSON.parse(content);
    let changed = false;

    if (!pkg.scripts) pkg.scripts = {};

    // Unify test
    if (pkg.scripts.test && pkg.scripts.test !== 'vitest run') {
        // Keep specific configs if needed, but standardize simple ones
        if (!pkg.scripts.test.includes('--config')) {
            pkg.scripts.test = 'vitest run';
            changed = true;
        }
    } else if (!pkg.scripts.test) {
        pkg.scripts.test = 'vitest run';
        changed = true;
    }

    // Unify lint
    if (pkg.scripts.lint && pkg.scripts.lint !== 'eslint --quiet .') {
        pkg.scripts.lint = 'eslint --quiet .';
        changed = true;
    } else if (!pkg.scripts.lint) {
        pkg.scripts.lint = 'eslint --quiet .';
        changed = true;
    }
    
    // Add typecheck if not exists but has tsconfig.json
    const dir = file.substring(0, file.lastIndexOf('/'));
    if (fs.existsSync(`${dir}/tsconfig.json`) && !pkg.scripts.typecheck) {
        pkg.scripts.typecheck = 'tsc --noEmit';
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(file, JSON.stringify(pkg, null, 2) + '\n');
        updatedCount++;
        console.log(`Updated ${file}`);
    }
}
console.log(`Updated ${updatedCount} package.json files.`);
