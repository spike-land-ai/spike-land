import fs from "fs";
import { globSync } from "glob";

const replacements = [
  { from: /\.\/packages\/spike-app/g, to: "./packages/spike-web" }, // assuming spike-app was renamed to spike-web
  { from: /\.\/packages\/code/g, to: "./packages/spike-cli" }, // or something else, wait - code editor. There's 'block-website-old' or 'spike-chat'? Maybe just use '#'
  { from: /\.\.\/API_REFERENCE\.md/g, to: "./API_REFERENCE.md" },
  { from: /\.\.\/FEATURES\.md/g, to: "../features/FEATURES.md" },
  { from: /\.\.\/TOKEN_SYSTEM\.md/g, to: "../develop/TOKEN_SYSTEM.md" },
  { from: /\.\.\/SECURITY_AUDIT_REPORT\.md/g, to: "../security/SECURITY_AUDIT_REPORT.md" },
  { from: /\.\.\/DATABASE_SCHEMA\.md/g, to: "../develop/JSON_SCHEMAS.md" },
  { from: /\.\.\/IMAGE_ENHANCEMENT\.md/g, to: "./IMAGE_ENDPOINTS.md" },
  { from: /\.\/DATABASE_SCHEMA\.md/g, to: "../develop/JSON_SCHEMAS.md" },
  { from: /\.\/TOKEN_SYSTEM\.md/g, to: "../develop/TOKEN_SYSTEM.md" },
  { from: /\/images\/blog\/tool-first-benchmark-hero\.png/g, to: "#" },
  { from: /\/docs\/features\/AB_TESTING_BUG_DETECTION\.md/g, to: "#" },
  { from: /\/apps\/qa-studio/g, to: "/packages/qa-studio" },
  { from: /\/packages\/ai-gateway\/ui/g, to: "#" },
];

const mdFiles = globSync("**/*.md", { ignore: ["node_modules/**", "dist/**", "coverage/**"] });
let updatedCount = 0;

for (const file of mdFiles) {
  let content = fs.readFileSync(file, "utf8");
  let changed = false;

  // specific fix for code and video which are missing in packages
  if (file === "README.md") {
    if (content.includes("./packages/spike-app")) {
      content = content.replace(/\.\/packages\/spike-app/g, "./packages/spike-web");
      changed = true;
    }
    if (content.includes("./packages/code")) {
      content = content.replace(/\.\/packages\/code/g, "#");
      changed = true;
    }
    if (content.includes("./packages/video")) {
      content = content.replace(/\.\/packages\/video/g, "./packages/educational-videos");
      changed = true;
    }
  }

  for (const { from, to } of replacements) {
    if (content.match(from)) {
      content = content.replace(from, to);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(file, content);
    updatedCount++;
    console.log(`Updated links in ${file}`);
  }
}

console.log(`Updated links in ${updatedCount} markdown files.`);
