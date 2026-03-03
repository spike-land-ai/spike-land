import { Hono } from "hono";
import type { Env } from "../env.js";

const version = new Hono<{ Bindings: Env }>();

version.get("/api/version", async (c) => {
  // Read index.html to extract build metadata from meta tags
  const indexObj = await c.env.SPA_ASSETS.get("index.html");
  let sha = "unknown";
  let buildTime = "unknown";

  if (indexObj) {
    const html = await indexObj.text();
    const shaMatch = html.match(/<meta\s+name="build-sha"\s+content="([^"]+)"/);
    const timeMatch = html.match(/<meta\s+name="build-time"\s+content="([^"]+)"/);
    if (shaMatch?.[1]) sha = shaMatch[1];
    if (timeMatch?.[1]) buildTime = timeMatch[1];
  }

  // Paginated list of all deployed assets
  const assets: Array<{ key: string; size: number; etag: string; uploaded: string }> = [];
  let cursor: string | undefined;

  do {
    const listing = await c.env.SPA_ASSETS.list({ cursor, limit: 1000 });
    for (const obj of listing.objects) {
      assets.push({
        key: obj.key,
        size: obj.size,
        etag: obj.etag,
        uploaded: obj.uploaded.toISOString(),
      });
    }
    cursor = listing.truncated ? listing.cursor : undefined;
  } while (cursor);

  // Extract available rollback SHAs from builds/ prefix
  const rollbackShas = [
    ...new Set(
      assets
        .filter((a) => a.key.startsWith("builds/"))
        .map((a) => a.key.split("/")[1])
        .filter(Boolean),
    ),
  ];

  return c.json({ sha, buildTime, rollbackShas, assets });
});

export { version };
