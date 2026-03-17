#!/usr/bin/env node
/**
 * batch-upload-r2.ts
 *
 * Fast parallel upload of a local directory to Cloudflare R2 using the
 * S3-compatible API with AWS Signature Version 4 signing via the Web Crypto
 * API. No external dependencies beyond Node.js built-ins.
 *
 * Usage:
 *   npx tsx scripts/batch-upload-r2.ts <source-dir> <bucket> [options]
 *
 * Options:
 *   --prefix=<prefix>      Key prefix (e.g. v-abc123/) for versioned deploys
 *   --concurrency=<n>      Parallel upload limit (default: 10)
 *   --dry-run              List files that would be uploaded, without uploading
 *   --html-last            Upload .html files after all other files
 *
 * Required env vars:
 *   CLOUDFLARE_ACCOUNT_ID
 *   R2_ACCESS_KEY_ID
 *   R2_SECRET_ACCESS_KEY
 */

import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UploadConfig {
  sourceDir: string;
  bucket: string;
  prefix: string;
  concurrency: number;
  dryRun: boolean;
  htmlLast: boolean;
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
}

export interface FileEntry {
  localPath: string;
  remoteKey: string;
  contentType: string;
  md5Hex: string;
  sizeBytes: number;
}

export interface UploadResult {
  uploaded: number;
  skipped: number;
  failed: number;
  errors: Array<{ key: string; error: string }>;
}

// ---------------------------------------------------------------------------
// Content-Type detection
// ---------------------------------------------------------------------------

const EXTENSION_CONTENT_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".cjs": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".map": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".eot": "application/vnd.ms-fontobject",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".pdf": "application/pdf",
  ".wasm": "application/wasm",
};

export function detectContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return EXTENSION_CONTENT_TYPES[ext] ?? "application/octet-stream";
}

// ---------------------------------------------------------------------------
// MD5 helper (ETag comparison)
// ---------------------------------------------------------------------------

export function computeMd5Hex(data: Buffer): string {
  return crypto.createHash("md5").update(data).digest("hex");
}

export function computeMd5Base64(data: Buffer): string {
  return crypto.createHash("md5").update(data).digest("base64");
}

// ---------------------------------------------------------------------------
// AWS Signature Version 4
// ---------------------------------------------------------------------------

function hmacSha256(key: Buffer | string, data: string): Buffer {
  return crypto.createHmac("sha256", key).update(data, "utf8").digest();
}

function sha256Hex(data: Buffer | string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

export function buildSigningKey(
  secretAccessKey: string,
  dateStamp: string,
  region: string,
  service: string,
): Buffer {
  const kDate = hmacSha256(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = hmacSha256(kDate, region);
  const kService = hmacSha256(kRegion, service);
  const kSigning = hmacSha256(kService, "aws4_request");
  return kSigning;
}

export interface S3PutParams {
  endpoint: string; // https://<account-id>.r2.cloudflarestorage.com
  bucket: string;
  key: string;
  body: Buffer;
  contentType: string;
  md5Base64: string;
  accessKeyId: string;
  secretAccessKey: string;
  region?: string; // default: auto
}

export function buildS3PutRequest(params: S3PutParams): {
  url: string;
  headers: Record<string, string>;
} {
  const region = params.region ?? "auto";
  const service = "s3";

  const now = new Date();
  // Format: YYYYMMDDTHHMMSSZ
  const amzDate = now
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d+Z$/, "Z");
  const dateStamp = amzDate.slice(0, 8);

  const url = `${params.endpoint}/${params.bucket}/${params.key}`;
  const host = new URL(params.endpoint).host;

  const payloadHash = sha256Hex(params.body);

  // Canonical headers must be sorted and lowercase
  const canonicalHeaders =
    [
      `content-md5:${params.md5Base64}`,
      `content-type:${params.contentType}`,
      `host:${host}`,
      `x-amz-content-sha256:${payloadHash}`,
      `x-amz-date:${amzDate}`,
    ].join("\n") + "\n";

  const signedHeaders = "content-md5;content-type;host;x-amz-content-sha256;x-amz-date";

  const canonicalRequest = [
    "PUT",
    `/${params.bucket}/${params.key}`,
    "", // query string
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256Hex(Buffer.from(canonicalRequest)),
  ].join("\n");

  const signingKey = buildSigningKey(params.secretAccessKey, dateStamp, region, service);
  const signature = hmacSha256(signingKey, stringToSign).toString("hex");

  const authorizationHeader =
    `AWS4-HMAC-SHA256 Credential=${params.accessKeyId}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const headers: Record<string, string> = {
    Authorization: authorizationHeader,
    "Content-MD5": params.md5Base64,
    "Content-Type": params.contentType,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
  };

  return { url, headers };
}

// ---------------------------------------------------------------------------
// HEAD request to check existing ETag (skip-unchanged)
// ---------------------------------------------------------------------------

export async function fetchRemoteETag(
  endpoint: string,
  bucket: string,
  key: string,
  accessKeyId: string,
  secretAccessKey: string,
  region = "auto",
): Promise<string | null> {
  const service = "s3";
  const now = new Date();
  const amzDate = now
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d+Z$/, "Z");
  const dateStamp = amzDate.slice(0, 8);
  const host = new URL(endpoint).host;

  const payloadHash = sha256Hex(Buffer.from(""));

  const canonicalHeaders =
    [`host:${host}`, `x-amz-content-sha256:${payloadHash}`, `x-amz-date:${amzDate}`].join("\n") +
    "\n";

  const signedHeaders = "host;x-amz-content-sha256;x-amz-date";

  const canonicalRequest = [
    "HEAD",
    `/${bucket}/${key}`,
    "",
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256Hex(Buffer.from(canonicalRequest)),
  ].join("\n");

  const signingKey = buildSigningKey(secretAccessKey, dateStamp, region, service);
  const signature = hmacSha256(signingKey, stringToSign).toString("hex");

  const authorizationHeader =
    `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const url = `${endpoint}/${bucket}/${key}`;
  try {
    const response = await fetch(url, {
      method: "HEAD",
      headers: {
        Authorization: authorizationHeader,
        "x-amz-content-sha256": payloadHash,
        "x-amz-date": amzDate,
      },
    });
    if (response.status === 200) {
      const etag = response.headers.get("etag");
      // ETag is quoted and may be wrapped in quotes: "abc123"
      return etag ? etag.replace(/"/g, "") : null;
    }
    return null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// File discovery
// ---------------------------------------------------------------------------

export function collectFiles(sourceDir: string, prefix: string): FileEntry[] {
  const entries: FileEntry[] = [];
  const absSource = path.resolve(sourceDir);

  function walk(dir: string): void {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        walk(fullPath);
      } else if (item.isFile()) {
        const relKey = path.relative(absSource, fullPath).replace(/\\/g, "/");
        const remoteKey = prefix ? `${prefix.replace(/\/$/, "")}/${relKey}` : relKey;
        const data = fs.readFileSync(fullPath);
        entries.push({
          localPath: fullPath,
          remoteKey,
          contentType: detectContentType(fullPath),
          md5Hex: computeMd5Hex(data),
          sizeBytes: data.length,
        });
      }
    }
  }

  walk(absSource);
  return entries;
}

// ---------------------------------------------------------------------------
// Concurrency limiter
// ---------------------------------------------------------------------------

export async function runWithConcurrency<T>(
  tasks: Array<() => Promise<T>>,
  concurrency: number,
): Promise<T[]> {
  const results: T[] = [];
  let index = 0;

  async function worker(): Promise<void> {
    while (index < tasks.length) {
      const taskIndex = index++;
      const result = await tasks[taskIndex]();
      results[taskIndex] = result;
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

// ---------------------------------------------------------------------------
// Single file upload
// ---------------------------------------------------------------------------

export async function uploadFile(
  entry: FileEntry,
  config: UploadConfig,
): Promise<{ skipped: boolean; error?: string }> {
  const endpoint = `https://${config.accountId}.r2.cloudflarestorage.com`;

  // Check remote ETag to skip unchanged files
  const remoteETag = await fetchRemoteETag(
    endpoint,
    config.bucket,
    entry.remoteKey,
    config.accessKeyId,
    config.secretAccessKey,
  );

  if (remoteETag && remoteETag === entry.md5Hex) {
    return { skipped: true };
  }

  const body = fs.readFileSync(entry.localPath);
  const md5Base64 = computeMd5Base64(body);

  const { url, headers } = buildS3PutRequest({
    endpoint,
    bucket: config.bucket,
    key: entry.remoteKey,
    body,
    contentType: entry.contentType,
    md5Base64,
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
  });

  const response = await fetch(url, {
    method: "PUT",
    headers,
    body,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "(no body)");
    return {
      skipped: false,
      error: `HTTP ${response.status}: ${text.slice(0, 200)}`,
    };
  }

  return { skipped: false };
}

// ---------------------------------------------------------------------------
// Progress reporter
// ---------------------------------------------------------------------------

export class ProgressReporter {
  private total: number;
  private done = 0;
  private uploaded = 0;
  private skipped = 0;
  private failed = 0;

  constructor(total: number) {
    this.total = total;
  }

  tick(result: { skipped: boolean; error?: string }): void {
    this.done++;
    if (result.error) {
      this.failed++;
    } else if (result.skipped) {
      this.skipped++;
    } else {
      this.uploaded++;
    }

    const pct = Math.floor((this.done / this.total) * 100);
    process.stdout.write(
      `\r  [${pct.toString().padStart(3)}%] ${this.done}/${this.total} — uploaded: ${this.uploaded}, skipped: ${this.skipped}, failed: ${this.failed}  `,
    );
  }

  finish(): void {
    process.stdout.write("\n");
  }

  getSummary(): { uploaded: number; skipped: number; failed: number } {
    return {
      uploaded: this.uploaded,
      skipped: this.skipped,
      failed: this.failed,
    };
  }
}

// ---------------------------------------------------------------------------
// Main upload orchestrator
// ---------------------------------------------------------------------------

export async function batchUpload(config: UploadConfig): Promise<UploadResult> {
  const allFiles = collectFiles(config.sourceDir, config.prefix);

  let nonHtmlFiles: FileEntry[];
  let htmlFiles: FileEntry[];

  if (config.htmlLast) {
    nonHtmlFiles = allFiles.filter((f) => !f.remoteKey.endsWith(".html"));
    htmlFiles = allFiles.filter((f) => f.remoteKey.endsWith(".html"));
  } else {
    nonHtmlFiles = allFiles;
    htmlFiles = [];
  }

  const totalBytes = allFiles.reduce((s, f) => s + f.sizeBytes, 0);
  const totalMB = (totalBytes / 1024 / 1024).toFixed(1);
  console.log(`Found ${allFiles.length} files (${totalMB} MB) in ${config.sourceDir}`);
  console.log(`Destination: ${config.bucket}${config.prefix ? ` (prefix: ${config.prefix})` : ""}`);

  if (config.dryRun) {
    console.log("\n[dry-run] Files that would be uploaded:");
    for (const f of allFiles) {
      console.log(`  ${f.remoteKey}  (${f.contentType}, ${f.sizeBytes}B)`);
    }
    return { uploaded: 0, skipped: allFiles.length, failed: 0, errors: [] };
  }

  const errors: Array<{ key: string; error: string }> = [];
  const reporter = new ProgressReporter(allFiles.length);

  async function processGroup(group: FileEntry[]): Promise<void> {
    const tasks = group.map((entry) => async () => {
      const result = await uploadFile(entry, config);
      reporter.tick(result);
      if (result.error) {
        errors.push({ key: entry.remoteKey, error: result.error });
      }
      return result;
    });
    await runWithConcurrency(tasks, config.concurrency);
  }

  console.log(`\nUploading (concurrency=${config.concurrency})...`);
  await processGroup(nonHtmlFiles);

  if (htmlFiles.length > 0) {
    console.log(`\nUploading ${htmlFiles.length} HTML file(s) last...`);
    // HTML files upload sequentially to ensure atomic visibility
    for (const entry of htmlFiles) {
      const result = await uploadFile(entry, config);
      reporter.tick(result);
      if (result.error) {
        errors.push({ key: entry.remoteKey, error: result.error });
      }
    }
  }

  reporter.finish();

  const summary = reporter.getSummary();

  if (errors.length > 0) {
    console.error(`\nFailed uploads (${errors.length}):`);
    for (const { key, error } of errors) {
      console.error(`  ${key}: ${error}`);
    }
  }

  console.log(
    `\nDone. uploaded=${summary.uploaded}, skipped=${summary.skipped}, failed=${summary.failed}`,
  );

  return { ...summary, errors };
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

function parseArgs(argv: string[]): UploadConfig {
  // argv[0] = node, argv[1] = script
  const args = argv.slice(2);

  const positional: string[] = [];
  let prefix = "";
  let concurrency = 10;
  let dryRun = false;
  let htmlLast = false;

  for (const arg of args) {
    if (arg.startsWith("--prefix=")) {
      prefix = arg.slice("--prefix=".length);
    } else if (arg.startsWith("--concurrency=")) {
      concurrency = parseInt(arg.slice("--concurrency=".length), 10);
    } else if (arg === "--dry-run") {
      dryRun = true;
    } else if (arg === "--html-last") {
      htmlLast = true;
    } else if (!arg.startsWith("--")) {
      positional.push(arg);
    }
  }

  if (positional.length < 2) {
    console.error(
      "Usage: batch-upload-r2.ts <source-dir> <bucket> [--prefix=v-abc123/] [--concurrency=10] [--dry-run] [--html-last]",
    );
    process.exit(1);
  }

  const accountId = process.env["CLOUDFLARE_ACCOUNT_ID"];
  const accessKeyId = process.env["R2_ACCESS_KEY_ID"];
  const secretAccessKey = process.env["R2_SECRET_ACCESS_KEY"];

  if (!accountId || !accessKeyId || !secretAccessKey) {
    const missing = [
      !accountId && "CLOUDFLARE_ACCOUNT_ID",
      !accessKeyId && "R2_ACCESS_KEY_ID",
      !secretAccessKey && "R2_SECRET_ACCESS_KEY",
    ]
      .filter(Boolean)
      .join(", ");
    console.error(`Missing required environment variables: ${missing}`);
    process.exit(1);
  }

  const sourceDir = positional[0];
  const bucket = positional[1];

  if (!fs.existsSync(sourceDir)) {
    console.error(`Source directory not found: ${sourceDir}`);
    process.exit(1);
  }

  if (isNaN(concurrency) || concurrency < 1) {
    console.error(`Invalid concurrency value: ${concurrency}`);
    process.exit(1);
  }

  return {
    sourceDir,
    bucket,
    prefix,
    concurrency,
    dryRun,
    htmlLast,
    accountId,
    accessKeyId,
    secretAccessKey,
  };
}

// Only run when executed directly (not when imported by tests)
const isMain =
  process.argv[1] &&
  (process.argv[1].endsWith("batch-upload-r2.ts") ||
    process.argv[1].endsWith("batch-upload-r2.js"));

if (isMain) {
  const config = parseArgs(process.argv);
  batchUpload(config).then((result) => {
    process.exit(result.failed > 0 ? 1 : 0);
  });
}
