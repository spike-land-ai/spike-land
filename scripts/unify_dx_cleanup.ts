import { Project, SyntaxKind, Node } from "ts-morph";

const project = new Project({
  // We don't use tsConfigFilePath because it excludes many files we want to fix
  compilerOptions: {
    allowJs: true,
    jsx: 1, // Preserve
  },
});

async function run() {
  console.log("Adding all files...");
  project.addSourceFilesAtPaths([
    "src/**/*.{ts,tsx}",
    ".tests/**/*.{ts,tsx}",
    "packages/**/*.{ts,tsx}",
    "scripts/**/*.{ts,tsx}",
  ]);

  const sourceFiles = project.getSourceFiles();
  console.log(`Processing ${sourceFiles.length} files...`);

  for (const sourceFile of sourceFiles) {
    let changed = false;

    // 1. Handle NonNullExpression (!)
    let foundNonNull = true;
    while (foundNonNull) {
      const expressions = sourceFile.getDescendantsOfKind(SyntaxKind.NonNullExpression);
      if (expressions.length === 0) {
        foundNonNull = false;
        break;
      }

      const node = expressions[expressions.length - 1];
      const expression = node.getExpression();
      const parent = node.getParent();
      const expressionText = expression.getText();

      if (Node.isPropertyAccessExpression(parent) && parent.getExpression() === node) {
        const name = parent.getName();
        parent.replaceWithText(`${expressionText}?.${name}`);
      } else if (Node.isElementAccessExpression(parent) && parent.getExpression() === node) {
        const arg = parent.getArgumentExpression()?.getText();
        if (arg) {
          parent.replaceWithText(`${expressionText}?.[${arg}]`);
        } else {
          node.replaceWithText(expressionText);
        }
      } else if (Node.isCallExpression(parent) && parent.getExpression() === node) {
        const args = parent
          .getArguments()
          .map((a) => a.getText())
          .join(", ");
        parent.replaceWithText(`${expressionText}?.(${args})`);
      } else {
        node.replaceWithText(expressionText);
      }
      changed = true;
    }

    // 2. Fix '@typescript-eslint/no-explicit-any'
    let foundAny = true;
    while (foundAny) {
      const anyKeywords = sourceFile.getDescendantsOfKind(SyntaxKind.AnyKeyword);
      if (anyKeywords.length === 0) {
        foundAny = false;
        break;
      }
      const node = anyKeywords[anyKeywords.length - 1];
      // Only replace if it's a type node or similar, not part of a larger identifier
      // Actually AnyKeyword is specifically for 'any' as a type.
      node.replaceWithText("unknown");
      changed = true;
    }

    if (changed) {
      console.log(`Updated ${sourceFile.getFilePath()}`);
      await sourceFile.save();
    }
  }

  console.log("Cleanup complete.");
}

run().catch(console.error);
