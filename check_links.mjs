import fs from "fs";
import path from "path";
import https from "https";
import http from "http";
import { globSync } from "glob";

const mdFiles = globSync("**/*.md", { ignore: ["node_modules/**", "dist/**", "coverage/**"] });
console.log(`Found ${mdFiles.length} markdown files.`);

const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
let promises = [];

for (const file of mdFiles) {
  const content = fs.readFileSync(file, "utf8");
  let match;
  while ((match = linkRegex.exec(content)) !== null) {
    const text = match[1];
    let link = match[2];

    // Remove hash fragments
    const hashIdx = link.indexOf("#");
    if (hashIdx !== -1) link = link.substring(0, hashIdx);

    if (!link) continue; // Only hash fragment

    if (link.startsWith("http")) {
      // Check external
      promises.push(
        new Promise((resolve) => {
          const client = link.startsWith("https") ? https : http;
          const req = client
            .get(link, { timeout: 5000 }, (res) => {
              if (res.statusCode >= 400 && res.statusCode !== 403) {
                // Ignore 403 as it might be bot blocking
                resolve({ file, text, link, status: res.statusCode, type: "external" });
              } else {
                resolve(null);
              }
            })
            .on("error", (err) => {
              resolve({ file, text, link, status: err.message, type: "external" });
            });
          req.setTimeout(5000, () => {
            req.destroy();
            resolve({ file, text, link, status: "timeout", type: "external" });
          });
        }),
      );
    } else {
      // Check internal
      const dir = path.dirname(file);
      const target = path.resolve(dir, link);
      if (!fs.existsSync(target)) {
        promises.push(Promise.resolve({ file, text, link, status: "not found", type: "internal" }));
      }
    }
  }
}

Promise.all(promises).then((results) => {
  const broken = results.filter((r) => r !== null);
  if (broken.length === 0) {
    console.log("No broken links found.");
  } else {
    console.log(`Found ${broken.length} broken links:`);
    broken.forEach((b) =>
      console.log(`${b.file} | Link: ${b.link} | Status: ${b.status} | Type: ${b.type}`),
    );
  }
});
