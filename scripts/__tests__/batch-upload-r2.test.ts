import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildS3PutRequest,
  buildSigningKey,
  batchUpload,
  collectFiles,
  computeMd5Base64,
  computeMd5Hex,
  detectContentType,
  fetchRemoteETag,
  runWithConcurrency,
  type UploadConfig,
} from "../batch-upload-r2.js";

// ---------------------------------------------------------------------------
// detectContentType
// ---------------------------------------------------------------------------

describe("detectContentType", () => {
  it.each([
    ["index.html", "text/html; charset=utf-8"],
    ["app.js", "application/javascript"],
    ["app.mjs", "application/javascript"],
    ["styles.css", "text/css"],
    ["data.json", "application/json"],
    ["app.map", "application/json"],
    ["logo.svg", "image/svg+xml"],
    ["photo.png", "image/png"],
    ["photo.jpg", "image/jpeg"],
    ["photo.jpeg", "image/jpeg"],
    ["photo.webp", "image/webp"],
    ["photo.avif", "image/avif"],
    ["favicon.ico", "image/x-icon"],
    ["robots.txt", "text/plain; charset=utf-8"],
    ["sitemap.xml", "application/xml"],
    ["font.woff", "font/woff"],
    ["font.woff2", "font/woff2"],
    ["font.ttf", "font/ttf"],
    ["module.wasm", "application/wasm"],
    ["video.mp4", "video/mp4"],
    ["unknown.xyz", "application/octet-stream"],
    ["NO_EXTENSION", "application/octet-stream"],
  ])("maps %s to %s", (filename, expected) => {
    expect(detectContentType(filename)).toBe(expected);
  });

  it("is case-insensitive for extensions", () => {
    expect(detectContentType("style.CSS")).toBe("text/css");
    expect(detectContentType("image.PNG")).toBe("image/png");
  });
});

// ---------------------------------------------------------------------------
// computeMd5Hex / computeMd5Base64
// ---------------------------------------------------------------------------

describe("computeMd5Hex", () => {
  it("produces a 32-char lowercase hex string", () => {
    const hash = computeMd5Hex(Buffer.from("hello"));
    expect(hash).toHaveLength(32);
    expect(hash).toMatch(/^[0-9a-f]{32}$/);
  });

  it("is deterministic", () => {
    const data = Buffer.from("spike.land rocks");
    expect(computeMd5Hex(data)).toBe(computeMd5Hex(data));
  });

  it("produces known value for empty buffer", () => {
    // md5("") = d41d8cd98f00b204e9800998ecf8427e
    expect(computeMd5Hex(Buffer.from(""))).toBe("d41d8cd98f00b204e9800998ecf8427e");
  });
});

describe("computeMd5Base64", () => {
  it("produces base64 encoding of the same MD5", () => {
    const data = Buffer.from("hello");
    const hex = computeMd5Hex(data);
    const b64 = computeMd5Base64(data);
    expect(Buffer.from(b64, "base64").toString("hex")).toBe(hex);
  });
});

// ---------------------------------------------------------------------------
// buildSigningKey
// ---------------------------------------------------------------------------

describe("buildSigningKey", () => {
  it("returns a 32-byte Buffer", () => {
    const key = buildSigningKey("secret", "20260316", "auto", "s3");
    expect(key).toBeInstanceOf(Buffer);
    expect(key.length).toBe(32);
  });

  it("is deterministic for the same inputs", () => {
    const a = buildSigningKey("secret", "20260316", "auto", "s3");
    const b = buildSigningKey("secret", "20260316", "auto", "s3");
    expect(a.toString("hex")).toBe(b.toString("hex"));
  });

  it("produces different keys for different dates", () => {
    const a = buildSigningKey("secret", "20260316", "auto", "s3");
    const b = buildSigningKey("secret", "20260317", "auto", "s3");
    expect(a.toString("hex")).not.toBe(b.toString("hex"));
  });
});

// ---------------------------------------------------------------------------
// buildS3PutRequest
// ---------------------------------------------------------------------------

describe("buildS3PutRequest", () => {
  const baseParams = {
    endpoint: "https://abc123.r2.cloudflarestorage.com",
    bucket: "my-bucket",
    key: "assets/app.js",
    body: Buffer.from("console.log('hi');"),
    contentType: "application/javascript",
    md5Base64: computeMd5Base64(Buffer.from("console.log('hi');")),
    accessKeyId: "ACCESS_KEY",
    secretAccessKey: "SECRET_KEY",
  };

  it("returns a URL pointing to the correct key", () => {
    const { url } = buildS3PutRequest(baseParams);
    expect(url).toBe("https://abc123.r2.cloudflarestorage.com/my-bucket/assets/app.js");
  });

  it("includes Authorization header with AWS4-HMAC-SHA256", () => {
    const { headers } = buildS3PutRequest(baseParams);
    expect(headers["Authorization"]).toMatch(/^AWS4-HMAC-SHA256 /);
    expect(headers["Authorization"]).toContain("Credential=ACCESS_KEY/");
    expect(headers["Authorization"]).toContain(
      "SignedHeaders=content-md5;content-type;host;x-amz-content-sha256;x-amz-date",
    );
    expect(headers["Authorization"]).toContain("Signature=");
  });

  it("includes Content-MD5 header", () => {
    const { headers } = buildS3PutRequest(baseParams);
    expect(headers["Content-MD5"]).toBe(baseParams.md5Base64);
  });

  it("includes Content-Type header", () => {
    const { headers } = buildS3PutRequest(baseParams);
    expect(headers["Content-Type"]).toBe("application/javascript");
  });

  it("includes x-amz-date in ISO8601 basic format", () => {
    const { headers } = buildS3PutRequest(baseParams);
    expect(headers["x-amz-date"]).toMatch(/^\d{8}T\d{6}Z$/);
  });

  it("includes x-amz-content-sha256 header with 64 hex chars", () => {
    const { headers } = buildS3PutRequest(baseParams);
    expect(headers["x-amz-content-sha256"]).toMatch(/^[0-9a-f]{64}$/);
  });

  it("produces different signatures for different keys", () => {
    const r1 = buildS3PutRequest({ ...baseParams, key: "a.js" });
    const r2 = buildS3PutRequest({ ...baseParams, key: "b.js" });
    // Signatures differ because the canonical request differs
    const sig1 = r1.headers["Authorization"]!.match(/Signature=([0-9a-f]+)/)?.[1];
    const sig2 = r2.headers["Authorization"]!.match(/Signature=([0-9a-f]+)/)?.[1];
    expect(sig1).not.toBe(sig2);
  });

  it("uses 'auto' region by default in credential scope", () => {
    const { headers } = buildS3PutRequest(baseParams);
    expect(headers["Authorization"]).toContain("/auto/s3/aws4_request");
  });

  it("respects explicit region override", () => {
    const { headers } = buildS3PutRequest({ ...baseParams, region: "us-east-1" });
    expect(headers["Authorization"]).toContain("/us-east-1/s3/aws4_request");
  });
});

// ---------------------------------------------------------------------------
// collectFiles
// ---------------------------------------------------------------------------

describe("collectFiles", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "r2-test-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("returns an entry for each file in the directory tree", () => {
    fs.writeFileSync(path.join(tmpDir, "index.html"), "<html/>");
    fs.mkdirSync(path.join(tmpDir, "assets"));
    fs.writeFileSync(path.join(tmpDir, "assets", "app.js"), "/* js */");
    fs.writeFileSync(path.join(tmpDir, "assets", "style.css"), "body {}");

    const entries = collectFiles(tmpDir, "");
    expect(entries).toHaveLength(3);
    const keys = entries.map((e) => e.remoteKey).sort();
    expect(keys).toEqual(["assets/app.js", "assets/style.css", "index.html"]);
  });

  it("applies prefix to all remote keys", () => {
    fs.writeFileSync(path.join(tmpDir, "index.html"), "<html/>");
    const entries = collectFiles(tmpDir, "v-abc123");
    expect(entries[0]?.remoteKey).toBe("v-abc123/index.html");
  });

  it("strips trailing slash from prefix before joining", () => {
    fs.writeFileSync(path.join(tmpDir, "app.js"), "");
    const entries = collectFiles(tmpDir, "deploy/");
    expect(entries[0]?.remoteKey).toBe("deploy/app.js");
  });

  it("populates contentType, md5Hex, and sizeBytes", () => {
    const content = "body { color: red; }";
    fs.writeFileSync(path.join(tmpDir, "style.css"), content);
    const [entry] = collectFiles(tmpDir, "");
    expect(entry?.contentType).toBe("text/css");
    expect(entry?.md5Hex).toBe(crypto.createHash("md5").update(content).digest("hex"));
    expect(entry?.sizeBytes).toBe(Buffer.byteLength(content));
  });

  it("handles an empty directory", () => {
    expect(collectFiles(tmpDir, "")).toEqual([]);
  });

  it("uses forward slashes in remoteKey even on Windows-style paths", () => {
    fs.mkdirSync(path.join(tmpDir, "sub"));
    fs.writeFileSync(path.join(tmpDir, "sub", "file.txt"), "data");
    const [entry] = collectFiles(tmpDir, "");
    expect(entry?.remoteKey).not.toContain("\\");
  });
});

// ---------------------------------------------------------------------------
// runWithConcurrency
// ---------------------------------------------------------------------------

describe("runWithConcurrency", () => {
  it("runs all tasks and returns results in order", async () => {
    const tasks = [1, 2, 3].map((n) => async () => n * 2);
    const results = await runWithConcurrency(tasks, 2);
    expect(results).toEqual([2, 4, 6]);
  });

  it("respects concurrency limit", async () => {
    let running = 0;
    let maxRunning = 0;
    const concurrency = 3;

    const tasks = Array.from({ length: 10 }, () => async () => {
      running++;
      maxRunning = Math.max(maxRunning, running);
      await new Promise((r) => setTimeout(r, 5));
      running--;
      return 1;
    });

    await runWithConcurrency(tasks, concurrency);
    expect(maxRunning).toBeLessThanOrEqual(concurrency);
  });

  it("handles empty task list", async () => {
    const results = await runWithConcurrency([], 5);
    expect(results).toEqual([]);
  });

  it("propagates errors from tasks", async () => {
    const tasks = [
      async () => 1,
      async () => {
        throw new Error("boom");
      },
      async () => 3,
    ];
    await expect(runWithConcurrency(tasks, 2)).rejects.toThrow("boom");
  });

  it("works when concurrency exceeds task count", async () => {
    const tasks = [async () => "only one"];
    const results = await runWithConcurrency(tasks, 50);
    expect(results).toEqual(["only one"]);
  });
});

// ---------------------------------------------------------------------------
// fetchRemoteETag
// ---------------------------------------------------------------------------

describe("fetchRemoteETag", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the unquoted ETag on 200", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 200,
        headers: new Headers({ etag: '"abc123def456"' }),
      }),
    );

    const etag = await fetchRemoteETag(
      "https://acct.r2.cloudflarestorage.com",
      "bucket",
      "key.js",
      "AKID",
      "SECRET",
    );
    expect(etag).toBe("abc123def456");
  });

  it("returns null on 404", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 404,
        headers: new Headers(),
      }),
    );

    const etag = await fetchRemoteETag(
      "https://acct.r2.cloudflarestorage.com",
      "bucket",
      "missing.js",
      "AKID",
      "SECRET",
    );
    expect(etag).toBeNull();
  });

  it("returns null when fetch throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));

    const etag = await fetchRemoteETag(
      "https://acct.r2.cloudflarestorage.com",
      "bucket",
      "key.js",
      "AKID",
      "SECRET",
    );
    expect(etag).toBeNull();
  });

  it("returns null when etag header is missing on 200", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 200,
        headers: new Headers(),
      }),
    );

    const etag = await fetchRemoteETag(
      "https://acct.r2.cloudflarestorage.com",
      "bucket",
      "key.js",
      "AKID",
      "SECRET",
    );
    expect(etag).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// batchUpload — dry-run mode (no real network calls)
// ---------------------------------------------------------------------------

describe("batchUpload (dry-run)", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "r2-batch-test-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  function makeConfig(overrides: Partial<UploadConfig> = {}): UploadConfig {
    return {
      sourceDir: tmpDir,
      bucket: "test-bucket",
      prefix: "",
      concurrency: 5,
      dryRun: true,
      htmlLast: false,
      accountId: "acct",
      accessKeyId: "AKID",
      secretAccessKey: "SECRET",
      ...overrides,
    };
  }

  it("returns skipped=N and uploaded=0 in dry-run mode", async () => {
    fs.writeFileSync(path.join(tmpDir, "index.html"), "<html/>");
    fs.writeFileSync(path.join(tmpDir, "app.js"), "/* js */");

    const result = await batchUpload(makeConfig());
    expect(result.uploaded).toBe(0);
    expect(result.skipped).toBe(2);
    expect(result.failed).toBe(0);
    expect(result.errors).toHaveLength(0);
  });

  it("returns all zeros for empty directory", async () => {
    const result = await batchUpload(makeConfig());
    expect(result.uploaded).toBe(0);
    expect(result.skipped).toBe(0);
    expect(result.failed).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// batchUpload — upload paths (mocked fetch)
// ---------------------------------------------------------------------------

describe("batchUpload (upload)", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "r2-upload-test-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  function makeConfig(overrides: Partial<UploadConfig> = {}): UploadConfig {
    return {
      sourceDir: tmpDir,
      bucket: "test-bucket",
      prefix: "",
      concurrency: 5,
      dryRun: false,
      htmlLast: false,
      accountId: "acct",
      accessKeyId: "AKID",
      secretAccessKey: "SECRET",
      ...overrides,
    };
  }

  it("skips files whose remote ETag matches the local MD5", async () => {
    const content = "cached content";
    const md5 = computeMd5Hex(Buffer.from(content));
    fs.writeFileSync(path.join(tmpDir, "cached.js"), content);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 200,
        headers: new Headers({ etag: `"${md5}"` }),
        ok: true,
        text: async () => "",
      }),
    );

    const result = await batchUpload(makeConfig());
    expect(result.skipped).toBe(1);
    expect(result.uploaded).toBe(0);
  });

  it("uploads files whose ETag differs", async () => {
    fs.writeFileSync(path.join(tmpDir, "app.js"), "new content");

    const fetchMock = vi
      .fn()
      // HEAD → stale ETag
      .mockResolvedValueOnce({
        status: 200,
        headers: new Headers({ etag: '"stale000etag0000000000000000000"' }),
        ok: true,
        text: async () => "",
      })
      // PUT → success
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        text: async () => "",
      });

    vi.stubGlobal("fetch", fetchMock);

    const result = await batchUpload(makeConfig());
    expect(result.uploaded).toBe(1);
    expect(result.skipped).toBe(0);
    expect(result.failed).toBe(0);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("uploads files with no existing remote object (404 HEAD)", async () => {
    fs.writeFileSync(path.join(tmpDir, "new.js"), "brand new");

    const fetchMock = vi
      .fn()
      // HEAD → 404
      .mockResolvedValueOnce({
        status: 404,
        headers: new Headers(),
        ok: false,
        text: async () => "",
      })
      // PUT → success
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        text: async () => "",
      });

    vi.stubGlobal("fetch", fetchMock);

    const result = await batchUpload(makeConfig());
    expect(result.uploaded).toBe(1);
    expect(result.failed).toBe(0);
  });

  it("records failed uploads when PUT returns non-2xx", async () => {
    fs.writeFileSync(path.join(tmpDir, "bad.js"), "content");

    const fetchMock = vi
      .fn()
      // HEAD → 404
      .mockResolvedValueOnce({
        status: 404,
        headers: new Headers(),
        ok: false,
        text: async () => "",
      })
      // PUT → 403
      .mockResolvedValueOnce({
        status: 403,
        ok: false,
        text: async () => "AccessDenied",
      });

    vi.stubGlobal("fetch", fetchMock);

    const result = await batchUpload(makeConfig());
    expect(result.failed).toBe(1);
    expect(result.errors[0]?.key).toBe("bad.js");
    expect(result.errors[0]?.error).toContain("403");
  });

  it("uploads html files last when htmlLast=true", async () => {
    fs.writeFileSync(path.join(tmpDir, "index.html"), "<html/>");
    fs.writeFileSync(path.join(tmpDir, "app.js"), "/* js */");

    const uploadOrder: string[] = [];

    const fetchMock = vi.fn().mockImplementation((url: string, opts: RequestInit) => {
      if (opts.method === "HEAD") {
        return Promise.resolve({
          status: 404,
          headers: new Headers(),
          ok: false,
          text: async () => "",
        });
      }
      // Extract key from URL for ordering assertion
      const key = new URL(url).pathname.split("/").pop()!;
      uploadOrder.push(key);
      return Promise.resolve({
        status: 200,
        ok: true,
        text: async () => "",
      });
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await batchUpload(makeConfig({ htmlLast: true }));
    expect(result.uploaded).toBe(2);
    expect(result.failed).toBe(0);
    // HTML must come after JS
    const htmlIdx = uploadOrder.indexOf("index.html");
    const jsIdx = uploadOrder.indexOf("app.js");
    expect(htmlIdx).toBeGreaterThan(jsIdx);
  });

  it("uses prefix in remote keys", async () => {
    fs.writeFileSync(path.join(tmpDir, "bundle.js"), "/* bundle */");

    const putUrls: string[] = [];
    const fetchMock = vi.fn().mockImplementation((url: string, opts: RequestInit) => {
      if (opts.method === "HEAD") {
        return Promise.resolve({
          status: 404,
          headers: new Headers(),
          ok: false,
          text: async () => "",
        });
      }
      putUrls.push(url);
      return Promise.resolve({ status: 200, ok: true, text: async () => "" });
    });

    vi.stubGlobal("fetch", fetchMock);

    await batchUpload(makeConfig({ prefix: "v-deadbeef" }));
    expect(putUrls[0]).toContain("v-deadbeef/bundle.js");
  });
});
