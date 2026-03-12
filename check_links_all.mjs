import fs from "fs";
import path from "path";
import https from "https";
import http from "http";
import { globSync } from "glob";

// Configuration
const CONCURRENCY = 20;
const TIMEOUT = 10000;
const RETRIES = 2;

const files = globSync("**/*.{md,ts,tsx}", {
  ignore: [
    "node_modules/**",
    "dist/**",
    "coverage/**",
    ".git/**",
    ".wrangler/**",
    ".next/**",
    "build/**",
  ],
});
console.log(`Found ${files.length} files to scan (.md, .ts, .tsx).`);

const urlRegex = /https?:\/\/[a-zA-Z0-9.\-_~:/?#[\]@!$&'()*+,;=%]+/g;
const mdLinkRegex = /\[[^\]]*\]\(([^)]+)\)/g;
const hrefSrcRegex = /(?:href|src)=["']([^"']+)["']/g;
const importRegex = /(?:from\s+|import\s*\(?)["'](\.[^"']+)["']/g;

const ignoreUrls = ["localhost", "127.0.0.1", "example.com", "yourdomain.com", "test.com"];

let linksToValidate = [];

for (const file of files) {
  const content = fs.readFileSync(file, "utf8");

  // 1. Find all http(s) URLs
  let match;
  while ((match = urlRegex.exec(content)) !== null) {
    let url = match[0];
    // Strip trailing punctuation like . , ) ]
    url = url.replace(/[.,)\]"']+$/, "");
    if (ignoreUrls.some((ignored) => url.includes(ignored))) continue;
    linksToValidate.push({ file, link: url, type: "external" });
  }

  // 2. Find relative Markdown links
  while ((match = mdLinkRegex.exec(content)) !== null) {
    let link = match[1].split("#")[0]; // Remove hash
    if (!link || link.startsWith("http") || link.startsWith("mailto:")) continue;
    linksToValidate.push({ file, link, type: "internal_md" });
  }

  // 3. Find href/src attributes (TSX / HTML in MD)
  while ((match = hrefSrcRegex.exec(content)) !== null) {
    let link = match[1].split("#")[0];
    if (!link || link.startsWith("http") || link.startsWith("mailto:") || link.startsWith("data:"))
      continue;
    linksToValidate.push({ file, link, type: "internal_html" });
  }

  // 4. Find imports in TS/TSX
  if (file.endsWith(".ts") || file.endsWith(".tsx")) {
    while ((match = importRegex.exec(content)) !== null) {
      let link = match[1];
      linksToValidate.push({ file, link, type: "internal_import" });
    }
  }
}

// Deduplicate links per file
const uniqueLinks = [];
const seen = new Set();
for (const l of linksToValidate) {
  const key = `${l.file}:${l.link}`;
  if (!seen.has(key)) {
    seen.add(key);
    uniqueLinks.push(l);
  }
}

console.log(`Found ${uniqueLinks.length} unique links across files.`);

async function checkExternal(url, attempt = 1) {
  return new Promise((resolve) => {
    const client = url.startsWith("https") ? https : http;
    const options = {
      method: "HEAD",
      headers: { "User-Agent": "Mozilla/5.0 (Node.js Link Checker)" },
      timeout: TIMEOUT,
    };
    const req = client
      .request(url, options, (res) => {
        if (res.statusCode === 405 || res.statusCode === 403) {
          // Method Not Allowed or Forbidden, let's try GET
          const getReq = client
            .request(url, { ...options, method: "GET" }, (getRes) => {
              resolve(getRes.statusCode);
            })
            .on("error", () => resolve(res.statusCode));
          getReq.end();
        } else {
          resolve(res.statusCode);
        }
      })
      .on("error", (err) => {
        if (attempt < RETRIES) {
          resolve(checkExternal(url, attempt + 1));
        } else {
          resolve(err.message);
        }
      });
    req.on("timeout", () => {
      req.destroy();
      if (attempt < RETRIES) {
        resolve(checkExternal(url, attempt + 1));
      } else {
        resolve("timeout");
      }
    });
    req.end();
  });
}

function resolveInternal(file, link, type) {
  const dir = path.dirname(file);

  if (type === "internal_import") {
    // imports could be .ts, .tsx, .d.ts, .js, .json, or folder/index.ts
    const exts = [".ts", ".tsx", ".js", ".jsx", ".json", "/index.ts", "/index.tsx", ""];
    let resolved = path.resolve(dir, link);
    for (const ext of exts) {
      if (fs.existsSync(resolved + ext)) return true;
    }
    return false;
  }

  if (link.startsWith("/")) {
    // Absolute to some root. This is tricky.
    // We'll check public folders or assume it's valid if we can't determine root.
    // Let's search from project root /public or similar, or just skip.
    // For strictness, if we can't find it, we flag it.
    const rootDir = process.cwd();
    const possiblePaths = [
      path.join(rootDir, "public", link),
      path.join(rootDir, "packages/block-website-old/public", link),
      path.join(rootDir, "vinext.spike.land/public", link),
      path.join(rootDir, "src", link), // some apps have absolute imports from src
      path.join(rootDir, link),
    ];
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) return true;
    }
    return false;
  }

  // Relative
  let target = path.resolve(dir, link);
  if (fs.existsSync(target)) return true;

  // Check with common extensions if it's an import-like link but classified differently
  if (
    fs.existsSync(target + ".ts") ||
    fs.existsSync(target + ".tsx") ||
    fs.existsSync(target + ".md")
  )
    return true;

  return false;
}

async function validateLinks() {
  let brokenLinks = [];
  let checked = 0;

  // Process in batches
  for (let i = 0; i < uniqueLinks.length; i += CONCURRENCY) {
    const batch = uniqueLinks.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map(async (l) => {
        if (l.type === "external") {
          const status = await checkExternal(l.link);
          // 404 is definitely broken, others might be auth/bot protection
          if (status === 404 || typeof status === "string") {
            return { ...l, status };
          }
          if (status >= 400 && status !== 401 && status !== 403) {
            return { ...l, status };
          }
          return null;
        } else {
          const exists = resolveInternal(l.file, l.link, l.type);
          if (!exists) {
            return { ...l, status: "Not Found" };
          }
          return null;
        }
      }),
    );

    brokenLinks.push(...results.filter((r) => r !== null));
    checked += batch.length;
    process.stdout.write(`\rChecked ${checked}/${uniqueLinks.length} links...`);
  }

  console.log("\n\nBroken Links Found:");
  if (brokenLinks.length === 0) {
    console.log("No broken links!");
    process.exit(0);
  } else {
    fs.writeFileSync("broken_links_report.json", JSON.stringify(brokenLinks, null, 2));
    brokenLinks.forEach((b) => console.log(`${b.file} | ${b.link} | ${b.status} | ${b.type}`));
    console.log(
      `\nFound ${brokenLinks.length} broken links. Wrote details to broken_links_report.json`,
    );
  }
}

validateLinks().catch(console.error);
